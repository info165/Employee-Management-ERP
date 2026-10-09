import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PayrollEntry } from '../../types';
import { formatINR, formatDateIndian } from '../../lib/exportUtils';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';

interface Props {
  entry: PayrollEntry;
  onClose: () => void;
}

export const PayslipModal: React.FC<Props> = ({ entry, onClose }) => {
  const { systemSettings } = useAuth();

  const monthName = new Date(entry.year, entry.month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Payslip Document · {entry.employeeName} ({monthName})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Print-Ready Payslip Body */}
        <div className="p-8 space-y-6 text-xs text-slate-800" id="printable-payslip">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight">
                {systemSettings.companyName}
              </h1>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 leading-relaxed">
                {systemSettings.companyAddress}
              </p>
            </div>
            <div className="text-right">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 block">
                PAYSLIP FOR {monthName.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Generated: {formatDateIndian(new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Employee & Attendance Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900">{entry.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-900">{entry.employeeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-800">{entry.department || 'Academics & Training'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="text-slate-800">{entry.designation || 'Staff Specialist'}</span>
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Name:</span>
                <span className="font-medium text-slate-800">{entry.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-mono text-slate-800">
                  {entry.bankAccountNumber ? `...${entry.bankAccountNumber.slice(-4)}` : 'XXXXXXXX'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank IFSC:</span>
                <span className="font-mono text-slate-800">{entry.bankIfsc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payable Days:</span>
                <span className="font-semibold text-slate-900">
                  {entry.payableDays} / {entry.totalMonthDays} Days
                </span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg overflow-hidden">
            {/* Earnings Column */}
            <div>
              <div className="bg-slate-100 p-2 font-bold text-slate-900 text-[11px] border-b border-slate-200 flex justify-between">
                <span>EARNINGS</span>
                <span>AMOUNT (INR)</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Salary</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.basic)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.hra)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Special Allowance</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.specialAllowance)}</span>
                </div>
                {entry.conveyance > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Conveyance Allowance</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.conveyance)}</span>
                  </div>
                )}
                {entry.medical > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Medical Allowance</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.medical)}</span>
                  </div>
                )}
                {entry.bonus > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Performance Incentive / Bonus</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.bonus)}</span>
                  </div>
                )}
                {entry.reimbursement > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Approved Expense Reimbursement</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.reimbursement)}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-2.5 font-bold text-slate-900 border-t border-slate-200 flex justify-between">
                <span>GROSS EARNINGS</span>
                <span className="font-mono">{formatINR(entry.grossEarnings)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border-l border-slate-200">
              <div className="bg-slate-100 p-2 font-bold text-slate-900 text-[11px] border-b border-slate-200 flex justify-between">
                <span>DEDUCTIONS</span>
                <span>AMOUNT (INR)</span>
              </div>
              <div className="p-3 space-y-2">
                {entry.unpaidLeaveDeduction > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Unpaid Leave (LWP)</span>
                    <span className="font-mono text-rose-600 font-medium">
                      {formatINR(entry.unpaidLeaveDeduction)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>Unpaid Leave (LWP)</span>
                    <span className="font-mono">₹0</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Provident Fund (PF)</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.pf)}</span>
                </div>
                {entry.esi > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Employee State Insurance (ESI)</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.esi)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>TDS / Income Tax</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.tds)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Professional Tax (PT)</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(entry.professionalTax)}</span>
                </div>
                {entry.advanceRecovery > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Advance Recovery</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(entry.advanceRecovery)}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-2.5 font-bold text-slate-900 border-t border-slate-200 flex justify-between">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono text-rose-600">{formatINR(entry.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Payable Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                NET SALARY PAYABLE
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Disbursement via ICICI Direct Corporate Banking
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono tracking-tight text-white block">
                {formatINR(entry.netPayable)}
              </span>
            </div>
          </div>

          {/* Footer & Signatures */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-slate-500 text-[11px]">
            <div>
              <p>This is a computer-generated salary slip and does not require a physical signature.</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">
                Ref: {entry.id} · FunScholar Edutech Solutions Pvt. Ltd.
              </p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-slate-300 w-40 mb-1"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
