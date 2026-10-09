import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PayrollEntry } from '../../types';
import { formatINR, formatDateIndian, downloadCsv, downloadXlsx } from '../../lib/exportUtils';
import { FileText, Download, Printer, Eye, Lock } from 'lucide-react';
import { PayslipModal } from '../payroll/PayslipModal';

export const MyPayslips: React.FC = () => {
  const { currentEmployee, payrollEntries, isEmployee } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);

  // Strictly filter for current employee and only released payslips per security mandate
  const myEntries = payrollEntries.filter(
    (e) => (e.employeeId === currentEmployee?.id || e.userId === currentEmployee?.userId) && e.payslipReleased
  );

  const handleExportAnnualCsv = () => {
    const headers = 'Month,Year,Payable_Days,Gross_Earnings,PF,TDS,Total_Deductions,Net_Payable\n';
    const rows = myEntries
      .map(
        (e) =>
          `${e.month},${e.year},${e.payableDays},${e.grossEarnings},${e.pf},${e.tds},${e.totalDeductions},${e.netPayable}`
      )
      .join('\n');
    downloadCsv(`My_Annual_Salary_Statement_${currentEmployee?.employeeNumber || 'emp'}.csv`, headers + rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Monthly Payslips & Salary Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Download print-ready monthly salary slips and tax deduction summaries.
          </p>
        </div>

        {myEntries.length > 0 && (
          <button
            onClick={handleExportAnnualCsv}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shadow-xs self-start"
          >
            <Download className="w-4 h-4" />
            <span>Download Annual Salary Statement (CSV)</span>
          </button>
        )}
      </div>

      {/* Payslips List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Pay Period</th>
                <th className="py-3 px-4 font-semibold">Payable Days</th>
                <th className="py-3 px-4 font-semibold">Gross Salary</th>
                <th className="py-3 px-4 font-semibold">Total Deductions</th>
                <th className="py-3 px-4 font-semibold font-bold">Net Salary Payable</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Lock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No released payslips available yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Payslips appear here once finalized and approved by the finance department.
                    </p>
                  </td>
                </tr>
              ) : (
                myEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {new Date(entry.year, entry.month - 1).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {entry.payableDays} / {entry.totalMonthDays} Days
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {formatINR(entry.grossEarnings)}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600">
                      {formatINR(entry.totalDeductions)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(entry.netPayable)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {entry.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View / Print Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Viewer Modal */}
      {selectedEntry && (
        <PayslipModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};
