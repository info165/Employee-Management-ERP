import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  validateAndGenerateIciciFile,
  BankReconciliationResult,
} from '../../lib/iciciGenerator';
import { formatINR, formatDateIndian, downloadCsv, downloadTxt } from '../../lib/exportUtils';
import {
  Landmark,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  History,
  FileCheck2,
  FileSpreadsheet,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const IciciBankManager: React.FC = () => {
  const {
    payrollRuns,
    payrollEntries,
    iciciConfig,
    saveIciciConfig,
    recordBankExport,
    isSuperAdmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'generate' | 'upload_source' | 'template_config' | 'export_history'
  >('generate');

  // Selected payroll run
  const approvedRuns = payrollRuns.filter((r) => r.status === 'APPROVED' || r.status === 'PAID');
  const [selectedRunId, setSelectedRunId] = useState(
    approvedRuns[0]?.id || payrollRuns[0]?.id || ''
  );

  // Template settings state
  const [clientCode, setClientCode] = useState(iciciConfig.clientCode);
  const [debitAccountNumber, setDebitAccountNumber] = useState(
    iciciConfig.debitAccountNumber
  );
  const [productCode, setProductCode] = useState(iciciConfig.productCode);
  const [fileFormat, setFileFormat] = useState(iciciConfig.fileFormat);
  const [includeHeader, setIncludeHeader] = useState(iciciConfig.includeHeader);
  const [includeFooter, setIncludeFooter] = useState(iciciConfig.includeFooter);
  const [isConfigured, setIsConfigured] = useState(iciciConfig.isConfigured);

  // Upload source reconciliation state
  const [uploadedSourceData, setUploadedSourceData] = useState<any[] | null>(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [sourceTotal, setSourceTotal] = useState(0);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">
          Bank payment files and disbursement records are strictly restricted to the Super Admin role.
        </p>
      </div>
    );
  }

  const currentRun = payrollRuns.find((r) => r.id === selectedRunId) || payrollRuns[0];
  const entriesForRun = payrollEntries.filter(
    (e) => e.payrollRunId === currentRun?.id
  );

  // Run ICICI validation engine
  const validationResult: BankReconciliationResult = validateAndGenerateIciciFile(
    iciciConfig,
    entriesForRun,
    currentRun?.periodLabel || 'Current_Period'
  );

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveIciciConfig({
      clientCode,
      debitAccountNumber,
      productCode,
      fileFormat,
      includeHeader,
      includeFooter,
      isConfigured: true,
    });
    alert('ICICI Bank file format and corporate debit account configured successfully.');
  };

  const handleDownloadPaymentFile = () => {
    if (!validationResult.isConfigured) {
      alert('Production bank file generation is not configured. Please complete the bank template setup first.');
      return;
    }

    if (validationResult.rejectedRows > 0) {
      const proceed = confirm(
        `Warning: There are ${validationResult.rejectedRows} rejected rows with errors. Download file containing only the ${validationResult.validRows} valid records?`
      );
      if (!proceed) return;
    }

    const content = validationResult.generatedContent || '';
    const filename = validationResult.fileName || 'ICICI_SALPAY.csv';

    if (iciciConfig.fileFormat === 'CSV') {
      downloadCsv(filename, content);
    } else {
      downloadTxt(filename, content);
    }

    // Record export audit item
    recordBankExport({
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: filename,
      payrollPeriod: currentRun?.periodLabel || 'N/A',
      totalRows: validationResult.validRows,
      totalAmount: validationResult.validTotalAmount,
      exportedBy: 'info@funscholar.com',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        setUploadedSourceData(data);
        // compute total amount in uploaded data
        let total = 0;
        data.forEach((row) => {
          const amt =
            Number(row.Amount) ||
            Number(row.amount) ||
            Number(row['Net Payable']) ||
            Number(row['Net Salary']) ||
            0;
          total += amt;
        });
        setSourceTotal(total);
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Failed to parse uploaded payroll source file. Supported formats: XLSX, CSV.');
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CORPORATE BANKING INTEGRATION · ICICI CIB BULK UPLOAD</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ICICI Bank Salary Payment File Generator
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Pre-export validation, strict IFSC/account verification, total sum reconciliation, and bank-compliant file generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('template_config')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-slate-300" />
              <span>Template Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'generate'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4 text-amber-600" />
          <span>Generate from Approved Payroll</span>
        </button>

        <button
          onClick={() => setActiveTab('upload_source')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'upload_source'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Upload & Reconcile Source File</span>
        </button>

        <button
          onClick={() => setActiveTab('template_config')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'template_config'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings2 className="w-4 h-4 text-slate-600" />
          <span>Bank Template Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('export_history')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'export_history'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-purple-600" />
          <span>Export History ({iciciConfig.history?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: Generate & Reconcile from Approved Payroll */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Batch Selector & Summary Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Select Finalized Payroll Run to Export
                </label>
                <select
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  {payrollRuns.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.periodLabel} ({r.id}) · Stage: {r.status} · Net: {formatINR(r.totalNetPayable)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadPaymentFile}
                  disabled={!validationResult.isConfigured}
                  className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ICICI Bulk Salary File</span>
                </button>
              </div>
            </div>

            {/* Reconciliation Card */}
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                validationResult.isReconciled
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {validationResult.isReconciled ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-sm">
                    {validationResult.isReconciled
                      ? '100% Reconciled: Ready for ICICI Bank CIB Bulk Upload'
                      : 'Reconciliation Discrepancy or Validation Rejections Detected'}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    {validationResult.isReconciled
                      ? `All ${validationResult.validRows} employee bank records match the approved payroll total of ${formatINR(
                          validationResult.validTotalAmount
                        )} exactly.`
                      : `${validationResult.rejectedRows} records rejected. Valid amount is ${formatINR(
                          validationResult.validTotalAmount
                        )} vs Approved Payroll ${formatINR(
                          validationResult.approvedPayrollTotal
                        )}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase opacity-75 block">Valid Total</span>
                  <span className="font-bold text-sm">{formatINR(validationResult.validTotalAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase opacity-75 block">Difference</span>
                  <span className="font-bold text-sm">
                    {validationResult.differenceAmount > 0
                      ? formatINR(validationResult.differenceAmount)
                      : '₹0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Details Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Beneficiary Records & RBI Format Validation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-export validation check: Beneficiary account, valid 11-char IFSC format, non-zero amount, and no duplicates.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Valid: <strong className="text-emerald-700">{validationResult.validRows}</strong> / {validationResult.totalRows}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Row</th>
                    <th className="py-3 px-4 font-semibold">Beneficiary Name</th>
                    <th className="py-3 px-4 font-semibold">Beneficiary Account</th>
                    <th className="py-3 px-4 font-semibold">Bank IFSC</th>
                    <th className="py-3 px-4 font-semibold">Transfer Mode</th>
                    <th className="py-3 px-4 font-semibold">Net Amount (INR)</th>
                    <th className="py-3 px-4 font-semibold">Validation Status</th>
                    <th className="py-3 px-4 font-semibold">Errors / Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.validationDetails.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.status === 'VALID' ? 'hover:bg-slate-50/50' : 'bg-rose-50/30'}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">{row.rowNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{row.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{row.employeeNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {row.accountNumber || <span className="text-rose-600 font-semibold">MISSING</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {row.ifsc || <span className="text-rose-600 font-semibold">MISSING</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {row.paymentMode}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatINR(row.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            row.status === 'VALID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-rose-700">
                        {row.errors.length > 0 ? (
                          <ul className="list-disc pl-3 space-y-0.5">
                            {row.errors.map((e, idx) => (
                              <li key={idx}>{e}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700 font-medium">Valid for ICICI transfer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Upload Source Payroll File & Reconcile */}
      {activeTab === 'upload_source' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Upload External Payroll Source File (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your external attendance or accountant-provided payroll sheet to validate columns and cross-reconcile against the approved batch.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-block shadow-xs">
                  Choose File (XLSX, CSV, TXT)
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-2">
                Files are processed safely in your authorized session without sending bank secrets.
              </p>
            </div>

            {uploadedSourceData && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-700">Source File:</span>
                    <strong className="text-xs font-mono ml-1 text-slate-900">{sourceFileName}</strong>
                  </div>
                  <div className="text-xs font-mono text-slate-800">
                    Imported Rows: <strong>{uploadedSourceData.length}</strong> · Source Sum: <strong>{formatINR(sourceTotal)}</strong>
                  </div>
                </div>

                {/* Reconciliation comparison */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <h4 className="font-semibold text-slate-900">Reconciliation Analysis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block">Uploaded Source File Total:</span>
                      <span className="font-mono font-bold text-sm text-slate-900">{formatINR(sourceTotal)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">System Approved Payroll Total:</span>
                      <span className="font-mono font-bold text-sm text-slate-900">{formatINR(currentRun?.totalNetPayable || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Variance:</span>
                      <span className="font-mono font-bold text-sm text-emerald-700">
                        {formatINR(Math.abs(sourceTotal - (currentRun?.totalNetPayable || 0)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview first 5 rows */}
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        {Object.keys(uploadedSourceData[0] || {}).slice(0, 6).map((k) => (
                          <th key={k} className="py-2 px-3">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {uploadedSourceData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).slice(0, 6).map((v: any, cidx) => (
                            <td key={cidx} className="py-2 px-3 text-slate-600">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Bank Template Configuration Screen */}
      {activeTab === 'template_config' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ICICI Corporate Internet Banking (CIB) Salary Template Rules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact configuration for the ICICI Bank Bulk Salary Upload layout. Do not guess parameters—match the official bank specification.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ICICI Corporate Client Code *
                </label>
                <input
                  type="text"
                  required
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Corporate Salary Debit Account Number (12 digits) *
                </label>
                <input
                  type="text"
                  required
                  value={debitAccountNumber}
                  onChange={(e) => setDebitAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Payment Product Code (Standard: SALPAY) *
                </label>
                <input
                  type="text"
                  required
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  File Format & Delimiter *
                </label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
                >
                  <option value="CSV">Standard CSV (Comma-delimited with quotes)</option>
                  <option value="PIPE_DELIMITED">Pipe Delimited (|) text format</option>
                  <option value="FIXED_WIDTH">Tab Delimited (.txt)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="font-medium text-slate-700">Include Header Row (Record_Type, Payment_Mode, ...)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFooter}
                  onChange={(e) => setIncludeFooter(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="font-medium text-slate-700">Include Trailer / Checksum Footer Row</span>
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs"
              >
                Save & Lock Bank Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Export History */}
      {activeTab === 'export_history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">
              Archived ICICI Salary Export Runs & Reconciliation Logs
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Export File Name</th>
                  <th className="py-3 px-4 font-semibold">Payroll Period</th>
                  <th className="py-3 px-4 font-semibold">Row Count</th>
                  <th className="py-3 px-4 font-semibold">Total Net Amount</th>
                  <th className="py-3 px-4 font-semibold">Exported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {iciciConfig.history && iciciConfig.history.length > 0 ? (
                  iciciConfig.history.map((hist) => (
                    <tr key={hist.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatDateIndian(hist.timestamp)} {new Date(hist.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {hist.fileName}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{hist.payrollPeriod}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{hist.totalRows} records</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {formatINR(hist.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{hist.exportedBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No previous bank exports recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
