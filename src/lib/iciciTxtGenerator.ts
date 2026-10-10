/**
 * ICICI Bank Corporate Internet Banking (CIB) Salary Payment TXT Generator
 * Follows the exact specification of the official ICICI bulk payment text converter.
 */

import { IciciTxtBatchConfig, PayrollEntry } from '../types';

export interface TxtBeneficiaryEntry {
  employeeNumber: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  ifsc: string;
  amount: number;
  remarks: string;
  transactionType: 'WIB' | 'NFT'; // WIB = ICICI within bank (MCW), NFT = NEFT (MCO)
  status: 'VALID' | 'INVALID';
  errors: string[];
}

export interface IciciTxtValidationResult {
  isValid: boolean;
  totalRecords: number; // Beneficiary count
  fhrRecordCount: number; // Beneficiary count + 1 (for MDR)
  totalAmount: number;
  wibCount: number;
  mcoCount: number;
  errors: string[];
  beneficiaries: TxtBeneficiaryEntry[];
  rawTxtContent: string;
  fileName: string;
}

// Validation constants based on the ICICI workbook formulas
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const SPECIAL_CHARS_REGEX = /[^a-zA-Z0-9\s]/g;

export function sanitizeBeneficiaryName(name: string): string {
  if (!name) return '';
  // Name allows spaces, no special characters, max 32 chars
  return name.replace(SPECIAL_CHARS_REGEX, '').trim().substring(0, 32);
}

export function sanitizeRemarks(remarks: string): string {
  if (!remarks) return 'Salary';
  return remarks.replace(SPECIAL_CHARS_REGEX, '').trim().substring(0, 30);
}

export function formatDateForTxt(dateStr: string, format: 'MM/DD/YYYY' | 'DD/MM/YYYY'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}

export function generateIciciTxtFile(
  batchConfig: IciciTxtBatchConfig,
  payrollEntries: Array<{
    employeeNumber: string;
    employeeName: string;
    bankAccountNumber: string;
    bankIfsc: string;
    netPayable: number;
    remarks?: string;
  }>
): IciciTxtValidationResult {
  const errors: string[] = [];
  const beneficiaries: TxtBeneficiaryEntry[] = [];
  let wibCount = 0;
  let mcoCount = 0;
  let totalAmount = 0;

  // 1. Validate Batch Config
  if (!batchConfig.debitAccountNumber || batchConfig.debitAccountNumber.length !== 12) {
    errors.push('Debit Account Number must be exactly 12 digits (e.g. 627505030081).');
  }
  if (!batchConfig.corporateId || batchConfig.corporateId.trim().length === 0) {
    errors.push('Corporate ID is required (e.g. FUNSCHOL03072019).');
  }
  if (!batchConfig.transactionDate) {
    errors.push('Transaction date is required.');
  }
  if (!batchConfig.dateFormatConfirmed) {
    errors.push('Date format confirmation required: Please verify whether ICICI CIB expects MM/DD/YYYY or DD/MM/YYYY.');
  }

  // 2. Validate Beneficiaries
  const seenAccounts = new Set<string>();

  payrollEntries.forEach((entry, idx) => {
    const itemErrors: string[] = [];
    const account = (entry.bankAccountNumber || '').trim().replace(/\s+/g, '');
    const ifsc = (entry.bankIfsc || '').trim().toUpperCase();
    const cleanName = sanitizeBeneficiaryName(entry.employeeName);
    const amount = Math.round(entry.netPayable); // ICICI amount is whole integer rupees in sample
    const remarks = sanitizeRemarks(entry.remarks || batchConfig.batchRemarks || 'Salary');

    if (!account) {
      itemErrors.push('Account number is missing');
    } else if (seenAccounts.has(account)) {
      itemErrors.push('Duplicate account number in batch');
    } else {
      seenAccounts.add(account);
    }

    if (!cleanName) {
      itemErrors.push('Beneficiary name is required (letters/numbers/spaces only)');
    }

    if (isNaN(amount) || amount <= 0) {
      itemErrors.push('Amount must be greater than zero');
    }

    // Determine WIB (Within ICICI) vs NFT (NEFT)
    const isWib = ifsc.startsWith('ICIC');
    const transactionType: 'WIB' | 'NFT' = isWib ? 'WIB' : 'NFT';

    if (isWib) {
      if (account.length !== 12) {
        itemErrors.push(`ICICI account number must be exactly 12 digits (found ${account.length})`);
      }
      wibCount++;
    } else {
      if (!IFSC_REGEX.test(ifsc)) {
        itemErrors.push(`Invalid NEFT IFSC code (${ifsc}). Must be 11 characters with 5th character '0'`);
      }
      if (account.length < 9 || account.length > 20) {
        itemErrors.push(`Account number length (${account.length}) is invalid for NEFT`);
      }
      mcoCount++;
    }

    totalAmount += amount;

    beneficiaries.push({
      employeeNumber: entry.employeeNumber,
      beneficiaryName: cleanName,
      beneficiaryAccount: account,
      ifsc,
      amount,
      remarks,
      transactionType,
      status: itemErrors.length === 0 ? 'VALID' : 'INVALID',
      errors: itemErrors,
    });
  });

  const hasItemErrors = beneficiaries.some((b) => b.status === 'INVALID');
  const isValid = errors.length === 0 && !hasItemErrors && beneficiaries.length > 0;

  // 3. Build Exact TXT Records with CRLF
  const lines: string[] = [];
  const fhrRecordCount = beneficiaries.length + 1; // Beneficiary records + 1 (for MDR)
  const formattedDate = formatDateForTxt(batchConfig.transactionDate, batchConfig.dateFormat);

  // Line 1: FHR (File Header)
  // Format: FHR|{record_count}|{transaction_date}|{external_reference}|{total_amount}|INR|{debit_account_number}|0011^
  const fhrLine = `FHR|${fhrRecordCount}|${formattedDate}|${batchConfig.externalReference || 'Cut-off'}|${totalAmount}|INR|${batchConfig.debitAccountNumber}|0011^`;
  lines.push(fhrLine);

  // Line 2: MDR (Batch Debit Header)
  // Format: MDR|{debit_account_number}|0011|{corporate_id}|{total_amount}|INR|{batch_remarks}|ICIC0000011|WIB^
  const mdrRemarks = sanitizeRemarks(batchConfig.batchRemarks || 'Salary Payment');
  const mdrLine = `MDR|${batchConfig.debitAccountNumber}|0011|${batchConfig.corporateId}|${totalAmount}|INR|${mdrRemarks}|ICIC0000011|WIB^`;
  lines.push(mdrLine);

  // Beneficiary Lines
  beneficiaries.forEach((b) => {
    if (b.transactionType === 'WIB') {
      // Record 3A: Within-Bank ICICI (MCW)
      // Format: MCW|{beneficiary_account_number}|0011|{beneficiary_name}|{amount}|INR|{beneficiary_remarks}|ICIC0000011|WIB^
      const line = `MCW|${b.beneficiaryAccount}|0011|${b.beneficiaryName}|${b.amount}|INR|${b.remarks}|ICIC0000011|WIB^`;
      lines.push(line);
    } else {
      // Record 3B: NEFT (MCO)
      // Format: MCO|{beneficiary_account_number}|0011|{beneficiary_name}|${amount}|INR|{beneficiary_remarks}|NFT|{IFSC}^
      const line = `MCO|${b.beneficiaryAccount}|0011|${b.beneficiaryName}|${b.amount}|INR|${b.remarks}|NFT|${b.ifsc}^`;
      lines.push(line);
    }
  });

  // Join lines with Windows CRLF (\r\n) exactly matching sample, NO trailing newline at end of file
  const rawTxtContent = lines.join('\r\n');

  const cleanDateSlug = batchConfig.transactionDate.replace(/[^0-9]/g, '');
  const fileName = `Salary_Payment_${cleanDateSlug}.txt`;

  return {
    isValid,
    totalRecords: beneficiaries.length,
    fhrRecordCount,
    totalAmount,
    wibCount,
    mcoCount,
    errors,
    beneficiaries,
    rawTxtContent,
    fileName,
  };
}
