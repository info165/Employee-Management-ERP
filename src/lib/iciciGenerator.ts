import { IciciBankExportConfig, PayrollEntry } from '../types';

export interface BankValidationRow {
  rowNumber: number;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  accountNumber: string;
  ifsc: string;
  amount: number;
  paymentMode: 'IFT' | 'NEFT' | 'RTGS';
  clientRef: string;
  remarks: string;
  status: 'VALID' | 'REJECTED';
  errors: string[];
}

export interface BankReconciliationResult {
  isConfigured: boolean;
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  validTotalAmount: number;
  rejectedTotalAmount: number;
  approvedPayrollTotal: number;
  isReconciled: boolean;
  differenceAmount: number;
  validationDetails: BankValidationRow[];
  generatedContent?: string;
  fileName?: string;
}

// Strict IFSC validation regex per Reserve Bank of India
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validateAndGenerateIciciFile(
  config: IciciBankExportConfig,
  payrollEntries: PayrollEntry[],
  payrollPeriodLabel: string
): BankReconciliationResult {
  if (!config || !config.isConfigured || !config.debitAccountNumber) {
    return {
      isConfigured: false,
      totalRows: 0,
      validRows: 0,
      rejectedRows: 0,
      validTotalAmount: 0,
      rejectedTotalAmount: 0,
      approvedPayrollTotal: 0,
      isReconciled: false,
      differenceAmount: 0,
      validationDetails: [],
    };
  }

  const validationDetails: BankValidationRow[] = [];
  const seenAccounts = new Set<string>();
  let validTotalAmount = 0;
  let rejectedTotalAmount = 0;
  let approvedPayrollTotal = 0;

  const today = new Date();
  const dateFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1
  ).padStart(2, '0')}/${today.getFullYear()}`;

  payrollEntries.forEach((entry, idx) => {
    approvedPayrollTotal += entry.netPayable;
    const errors: string[] = [];
    const rowNum = idx + 1;

    // Check account number
    const account = (entry.bankAccountNumber || '').trim().replace(/\s+/g, '');
    if (!account) {
      errors.push('Beneficiary bank account number is missing.');
    } else if (account.length < 9 || account.length > 20) {
      errors.push(`Account number length (${account.length}) is invalid. Expected 9-20 digits.`);
    } else if (seenAccounts.has(account)) {
      errors.push('Duplicate beneficiary bank account detected within same payroll batch.');
    } else {
      seenAccounts.add(account);
    }

    // Check IFSC
    const ifsc = (entry.bankIfsc || '').trim().toUpperCase();
    if (!ifsc) {
      errors.push('Bank IFSC code is missing.');
    } else if (!IFSC_REGEX.test(ifsc)) {
      errors.push(`Invalid IFSC code format (${ifsc}). Must be 11 characters (4 letters, 0, 6 alphanumeric).`);
    }

    // Check Amount
    if (isNaN(entry.netPayable) || entry.netPayable <= 0) {
      errors.push(`Invalid payment amount (₹${entry.netPayable}). Amount must be greater than zero.`);
    }

    // Check Employee Name
    if (!entry.employeeName || entry.employeeName.trim().length === 0) {
      errors.push('Employee beneficiary name is required.');
    }

    // Determine ICICI internal transfer vs NEFT/RTGS
    const isIciciBeneficiary = ifsc.startsWith('ICIC');
    const paymentMode: 'IFT' | 'NEFT' | 'RTGS' = isIciciBeneficiary
      ? 'IFT'
      : entry.netPayable >= 200000
      ? 'RTGS'
      : 'NEFT';

    const cleanPeriod = payrollPeriodLabel.replace(/\s+/g, '_').toUpperCase();
    const clientRef = `${config.clientCode}-${entry.employeeNumber}-${entry.year}${String(entry.month).padStart(2, '0')}`;
    const remarks = `SALARY_${cleanPeriod}`;

    const isValid = errors.length === 0;
    if (isValid) {
      validTotalAmount += entry.netPayable;
    } else {
      rejectedTotalAmount += entry.netPayable;
    }

    validationDetails.push({
      rowNumber: rowNum,
      employeeId: entry.employeeId,
      employeeNumber: entry.employeeNumber,
      employeeName: entry.employeeName,
      accountNumber: account,
      ifsc,
      amount: entry.netPayable,
      paymentMode,
      clientRef,
      remarks,
      status: isValid ? 'VALID' : 'REJECTED',
      errors,
    });
  });

  const validRows = validationDetails.filter((r) => r.status === 'VALID').length;
  const rejectedRows = validationDetails.length - validRows;
  const isReconciled =
    rejectedRows === 0 && Math.abs(validTotalAmount - approvedPayrollTotal) < 0.01;
  const differenceAmount = Math.abs(validTotalAmount - approvedPayrollTotal);

  // Generate output content based on configured format
  let generatedContent = '';
  const delimiter =
    config.fileFormat === 'PIPE_DELIMITED' ? '|' : config.fileFormat === 'CSV' ? ',' : '\t';

  // Standard ICICI CIB Corporate Bulk Upload Header
  if (config.includeHeader) {
    generatedContent += [
      'Record_Type',
      'Payment_Mode',
      'Debit_Account_Number',
      'Beneficiary_Account_Number',
      'Beneficiary_Name',
      'Amount',
      'Value_Date',
      'Beneficiary_IFSC',
      'Client_Reference_Number',
      'Remarks',
    ].join(delimiter) + '\r\n';
  }

  // Populate valid rows
  validationDetails.forEach((row) => {
    if (row.status === 'VALID') {
      const line = [
        'D', // Detail record
        row.paymentMode,
        config.debitAccountNumber,
        row.accountNumber,
        `"${row.employeeName.replace(/"/g, '""')}"`,
        row.amount.toFixed(2),
        dateFormatted,
        row.ifsc,
        row.clientRef,
        row.remarks,
      ].join(delimiter);
      generatedContent += line + '\r\n';
    }
  });

  // Footer record if configured
  if (config.includeFooter) {
    generatedContent += [
      'T', // Trailer record
      config.debitAccountNumber,
      validRows,
      validTotalAmount.toFixed(2),
      dateFormatted,
    ].join(delimiter) + '\r\n';
  }

  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const ext = config.fileFormat === 'CSV' ? 'csv' : 'txt';
  const fileName = `ICICI_SALPAY_${config.clientCode}_${yyyymmdd}.${ext}`;

  return {
    isConfigured: true,
    totalRows: validationDetails.length,
    validRows,
    rejectedRows,
    validTotalAmount,
    rejectedTotalAmount,
    approvedPayrollTotal,
    isReconciled,
    differenceAmount,
    validationDetails,
    generatedContent,
    fileName,
  };
}
