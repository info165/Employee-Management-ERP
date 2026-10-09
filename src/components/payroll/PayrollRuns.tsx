import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PayrollRun, PayrollEntry } from '../../types';
import { calculateEmployeePayroll } from '../../lib/salaryCalculator';
import { formatINR, formatDateIndian } from '../../lib/exportUtils';
import {
  FileSpreadsheet,
  Play,
  CheckCircle,
  Lock,
  Eye,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { PayslipModal } from './PayslipModal';

export const PayrollRuns: React.FC = () => {
  const {
    payrollRuns,
    payrollEntries,
    salaryStructures,
    attendanceRecords,
    systemSettings,
    createPayrollRun,
    updatePayrollStatus,
    releasePayslips,
    isSuperAdmin,
  } = useAuth();

  const [selectedRun, setSelectedRun] = useState<PayrollRun>(payrollRuns[0] || null);
  const [calculating, setCalculating] = useState(false);
  const [selectedEntryForPayslip, setSelectedEntryForPayslip] = useState<PayrollEntry | null>(null);

  // New calculation month / year selector
  const [calcMonth, setCalcMonth] = useState(10);
  const [calcYear, setCalcYear] = useState(2026);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">Payroll calculations and disbursement ledgers are strictly segregated.</p>
      </div>
    );
  }

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const entries: PayrollEntry[] = [];

      for (const struct of salaryStructures) {
        const entry = calculateEmployeePayroll({
          employeeId: struct.employeeId,
          month: calcMonth,
          year: calcYear,
          salaryStructure: struct,
          attendanceRecords,
          bonus: 0,
          reimbursement: 0,
          advanceRecovery: 0,
          settings: systemSettings,
        });
        entries.push(entry);
      }

      const newRun = await createPayrollRun(calcMonth, calcYear, entries);
      setSelectedRun(newRun);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleStatusChange = async (newStatus: PayrollRun['status']) => {
    if (!selectedRun) return;
    await updatePayrollStatus(selectedRun.id, newStatus);
    setSelectedRun({ ...selectedRun, status: newStatus, locked: newStatus === 'APPROVED' || newStatus === 'EXPORTED' || newStatus === 'PAID' });
  };

  const handleRelease = async () => {
    if (!selectedRun) return;
    await releasePayslips(selectedRun.id);
    alert('Employee payslips successfully released for self-service download.');
  };

  const currentRunEntries = payrollEntries.filter(
    (e) => e.payrollRunId === selectedRun?.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Monthly Payroll Processing & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Attendance-linked monthly payroll calculation, review, approval lock, and payslip release.
          </p>
        </div>

        {/* New Calculation Trigger */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <select
            value={calcMonth}
            onChange={(e) => setCalcMonth(Number(e.target.value))}
            className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700"
          >
            <option value={9}>September (09)</option>
            <option value={10}>October (10)</option>
            <option value={11}>November (11)</option>
            <option value={12}>December (12)</option>
          </select>
          <select
            value={calcYear}
            onChange={(e) => setCalcYear(Number(e.target.value))}
            className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={handleRunCalculation}
            disabled={calculating}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors flex items-center gap-1 shadow-xs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{calculating ? 'Processing...' : 'Run Calculation'}</span>
          </button>
        </div>
      </div>

      {/* Selected Payroll Run Dashboard */}
      {selectedRun && (
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <span>PAYROLL PERIOD: {selectedRun.periodLabel.toUpperCase()}</span>
                <span>·</span>
                <span>BATCH: {selectedRun.id}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                Total Net Salary: {formatINR(selectedRun.totalNetPayable)}
              </h2>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Gross: {formatINR(selectedRun.totalGross)}</span>
                <span>·</span>
                <span>Deductions: {formatINR(selectedRun.totalDeductions)}</span>
                <span>·</span>
                <span>Staff: {selectedRun.totalEmployees}</span>
              </div>
            </div>

            {/* Workflow Stage Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                  selectedRun.status === 'APPROVED' || selectedRun.status === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                Stage: {selectedRun.status}
              </span>

              {selectedRun.status !== 'APPROVED' && selectedRun.status !== 'PAID' && (
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Approve & Lock Payroll</span>
                </button>
              )}

              {selectedRun.status === 'APPROVED' && (
                <button
                  onClick={handleRelease}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Release Employee Payslips</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payroll Entries Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Employee Salary Breakdown ({selectedRun?.periodLabel})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance payable days factor, allowances, statutory deductions, and net payable.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Payable Days</th>
                <th className="py-3 px-4 font-semibold">Gross Earnings</th>
                <th className="py-3 px-4 font-semibold">Unpaid Leave Ded.</th>
                <th className="py-3 px-4 font-semibold">Statutory (PF/TDS)</th>
                <th className="py-3 px-4 font-semibold">Total Deductions</th>
                <th className="py-3 px-4 font-semibold">Net Salary</th>
                <th className="py-3 px-4 font-semibold">Payslip Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRunEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payroll entries generated for this period. Click "Run Calculation" above.
                  </td>
                </tr>
              ) : (
                currentRunEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{entry.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{entry.employeeNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {entry.payableDays} / {entry.totalMonthDays} days
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {formatINR(entry.grossEarnings)}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600">
                      {entry.unpaidLeaveDeduction > 0 ? formatINR(entry.unpaidLeaveDeduction) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatINR(entry.pf + entry.tds + entry.professionalTax + entry.esi)}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-medium">
                      {formatINR(entry.totalDeductions)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(entry.netPayable)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          entry.payslipReleased
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.payslipReleased ? 'Released' : 'Locked'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntryForPayslip(entry)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedEntryForPayslip && (
        <PayslipModal
          entry={selectedEntryForPayslip}
          onClose={() => setSelectedEntryForPayslip(null)}
        />
      )}
    </div>
  );
};
