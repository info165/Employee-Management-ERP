import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PayrollRun, PayrollEntry, PayrollRunStatus } from '../../types';
import { calculateEmployeePayroll } from '../../lib/salaryCalculator';
import { formatINR, formatDateIndian } from '../../lib/exportUtils';
import { generateIciciTxtFile, IciciTxtValidationResult } from '../../lib/iciciTxtGenerator';
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
  Landmark,
  Download,
  Copy,
  Check,
  X,
  Info,
  Calendar,
  Users,
  AlertCircle,
  BadgeAlert,
  Receipt,
  FileText,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { PayslipModal } from './PayslipModal';

export const PayrollRuns: React.FC = () => {
  const {
    payrollRuns,
    payrollEntries,
    salaryStructures,
    attendanceRecords,
    systemSettings,
    expenses,
    employees,
    iciciTxtConfig,
    createPayrollRun,
    updatePayrollStatus,
    releasePayslips,
    markExpensePaid,
    logAction,
    isSuperAdmin,
  } = useAuth();

  // Selection states
  const [calcMonth, setCalcMonth] = useState<number>(10);
  const [calcYear, setCalcYear] = useState<number>(2026);
  const [calculating, setCalculating] = useState(false);

  // Modals
  const [selectedEntryForPayslip, setSelectedEntryForPayslip] = useState<PayrollEntry | null>(null);
  const [selectedEntryForAudit, setSelectedEntryForAudit] = useState<PayrollEntry | null>(null);
  const [showIciciModal, setShowIciciModal] = useState(false);
  const [txtCopied, setTxtCopied] = useState(false);

  // Active run strictly based on selected month & year (no silent fallback to prior period)
  const activeRun = useMemo(() => {
    return payrollRuns.find((r) => r.month === calcMonth && r.year === calcYear) || null;
  }, [payrollRuns, calcMonth, calcYear]);

  // Entries for the active run
  const activeEntries = useMemo(() => {
    if (!activeRun) return [];
    return payrollEntries.filter((e) => e.payrollRunId === activeRun.id);
  }, [payrollEntries, activeRun]);

  // Exception analysis for active run entries
  const exceptionsList = useMemo(() => {
    return activeEntries
      .map((entry) => {
        const issues: string[] = [];
        if (!entry.bankAccountNumber || entry.bankAccountNumber.trim().length < 8) {
          issues.push('Missing or invalid bank account number');
        }
        if (!entry.bankIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(entry.bankIfsc.trim().toUpperCase())) {
          issues.push('Invalid IFSC code format');
        }
        if (entry.payableDays === 0) {
          issues.push('Zero payable days calculated');
        }
        return { entry, issues };
      })
      .filter((item) => item.issues.length > 0);
  }, [activeEntries]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (!activeRun || activeEntries.length === 0) {
      return {
        totalGross: activeRun?.totalGross || 0,
        totalUnpaidLeaveDed: 0,
        totalLateDed: 0,
        totalStatutoryDed: 0,
        totalOtherDed: 0,
        totalDeductions: activeRun?.totalDeductions || 0,
        totalNetPayable: activeRun?.totalNetPayable || 0,
        totalReimbursements: 0,
        totalEmployees: activeRun?.totalEmployees || 0,
        exceptionCount: 0,
      };
    }

    const totalGross = activeEntries.reduce((sum, e) => sum + e.grossEarnings, 0);
    const totalUnpaidLeaveDed = activeEntries.reduce((sum, e) => sum + (e.unpaidLeaveDeduction || 0), 0);
    const totalLateDed = activeEntries.reduce((sum, e) => sum + (e.lateArrivalDeduction || 0), 0);
    const totalStatutoryDed = activeEntries.reduce(
      (sum, e) => sum + (e.pf || 0) + (e.esi || 0) + (e.tds || 0) + (e.professionalTax || 0),
      0
    );
    const totalOtherDed = activeEntries.reduce(
      (sum, e) => sum + (e.advanceRecovery || 0) + (e.otherDeductions || 0),
      0
    );
    const totalDeductions = activeEntries.reduce((sum, e) => sum + e.totalDeductions, 0);
    const totalNetPayable = activeEntries.reduce((sum, e) => sum + e.netPayable, 0);
    const totalReimbursements = activeEntries.reduce((sum, e) => sum + (e.reimbursement || 0), 0);

    return {
      totalGross,
      totalUnpaidLeaveDed,
      totalLateDed,
      totalStatutoryDed,
      totalOtherDed,
      totalDeductions,
      totalNetPayable,
      totalReimbursements,
      totalEmployees: activeEntries.length,
      exceptionCount: exceptionsList.length,
    };
  }, [activeRun, activeEntries, exceptionsList]);

  // ICICI TXT Generation result
  const iciciTxtResult: IciciTxtValidationResult = useMemo(() => {
    if (!activeRun || activeEntries.length === 0) {
      return {
        isValid: false,
        totalRecords: 0,
        fhrRecordCount: 0,
        totalAmount: 0,
        wibCount: 0,
        mcoCount: 0,
        errors: ['No approved payroll entries available.'],
        beneficiaries: [],
        rawTxtContent: '',
        fileName: 'Salary_Payment.txt',
      };
    }

    return generateIciciTxtFile(
      {
        ...iciciTxtConfig,
        transactionDate: `${calcYear}-${String(calcMonth).padStart(2, '0')}-05`,
        batchRemarks: `Salary Payment for ${new Date(calcYear, calcMonth - 1, 1).toLocaleDateString('en-US', { month: 'long' })}`,
      },
      activeEntries.map((e) => ({
        employeeNumber: e.employeeNumber,
        employeeName: e.employeeName,
        bankAccountNumber: e.bankAccountNumber,
        bankIfsc: e.bankIfsc,
        netPayable: e.netPayable,
        remarks: 'Salary',
      }))
    );
  }, [activeRun, activeEntries, iciciTxtConfig, calcYear, calcMonth]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">
          Payroll calculations and ICICI Bank disbursement files are strictly segregated to Super Administrators.
        </p>
      </div>
    );
  }

  // Trigger calculation connecting Attendance, Salary Structures, and Approved Expenses
  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const activeEmployees = employees.filter(
        (e) => e.employmentStatus === 'ACTIVE' || e.onboardingStatus === 'APPROVED'
      );

      const entries: PayrollEntry[] = [];

      for (const emp of activeEmployees) {
        // Find existing salary structure or synthesize one from employee defaults
        let struct = salaryStructures.find(
          (s) => s.employeeId === emp.id || s.employeeNumber === emp.employeeNumber
        );

        if (!struct) {
          const defaultGross = emp.designation?.toLowerCase().includes('senior') ? 48000 : 38000;
          struct = {
            id: `sal-auto-${emp.id}`,
            employeeId: emp.id,
            employeeNumber: emp.employeeNumber || 'UNASSIGNED',
            employeeName: emp.fullName,
            effectiveFrom: emp.dateOfJoining || '2024-04-01',
            basicSalary: Math.round(defaultGross * 0.5),
            hra: Math.round(defaultGross * 0.25),
            specialAllowance: Math.round(defaultGross * 0.15),
            conveyanceAllowance: 2500,
            medicalAllowance: 1500,
            otherEarnings: 0,
            pfApplicable: true,
            pfDeduction: 1800,
            esiApplicable: false,
            esiDeduction: 0,
            tdsDeduction: 500,
            professionalTax: 200,
            otherDeductions: 0,
            grossSalary: defaultGross,
            netSalary: defaultGross - 2500,
            bankName: emp.bankDetails?.bankName || 'ICICI Bank',
            bankAccountNumber: emp.bankDetails?.bankAccountNumber || '000201594102',
            bankIfsc: emp.bankDetails?.bankIfsc || 'ICIC0000002',
            accountHolderName: emp.bankDetails?.accountHolderName || emp.fullName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        // Collect approved travel expense claims for this employee
        const empApprovedExpenses = expenses.filter(
          (exp) =>
            (exp.employeeId === emp.id || exp.employeeNumber === emp.employeeNumber) &&
            exp.status === 'APPROVED' &&
            exp.paymentStatus !== 'PAID'
        );

        const entry = calculateEmployeePayroll({
          employee: emp,
          month: calcMonth,
          year: calcYear,
          salaryStructure: struct,
          attendanceRecords,
          approvedExpenses: empApprovedExpenses,
          bonus: 0,
          advanceRecovery: 0,
          settings: systemSettings,
        });

        entries.push(entry);
      }

      const newRun = await createPayrollRun(calcMonth, calcYear, entries);
      const totalReimbursements = entries.reduce((sum, e) => sum + (e.reimbursement || 0), 0);
      logAction(
        'PAYROLL_RECALCULATED',
        'PAYROLL',
        `Recalculated attendance-linked payroll for ${newRun.periodLabel} (${entries.length} staff members, Reimbursements: ₹${totalReimbursements})`,
        newRun.id
      );
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleStageChange = async (newStatus: PayrollRunStatus) => {
    if (!activeRun) return;
    await updatePayrollStatus(activeRun.id, newStatus);
    logAction(
      'PAYROLL_STAGE_UPDATED',
      'PAYROLL',
      `Payroll ${activeRun.id} stage changed to ${newStatus}`,
      activeRun.id
    );
  };

  const handleRelease = async () => {
    if (!activeRun) return;
    await releasePayslips(activeRun.id);
    alert('Employee payslips successfully released for portal download.');
  };

  const handleDownloadTxt = () => {
    if (!iciciTxtResult.rawTxtContent) return;

    const blob = new Blob([iciciTxtResult.rawTxtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = iciciTxtResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update status to EXPORTED if currently APPROVED
    if (activeRun && activeRun.status === 'APPROVED') {
      updatePayrollStatus(activeRun.id, 'EXPORTED');
    }

    logAction(
      'ICICI_TXT_DOWNLOADED',
      'BANK_EXPORT',
      `Downloaded ICICI Salary TXT file ${iciciTxtResult.fileName} (${iciciTxtResult.totalRecords} beneficiaries, ₹${iciciTxtResult.totalAmount})`,
      activeRun?.id
    );
  };

  const handleCopyTxt = () => {
    if (!iciciTxtResult.rawTxtContent) return;
    navigator.clipboard.writeText(iciciTxtResult.rawTxtContent);
    setTxtCopied(true);
    setTimeout(() => setTxtCopied(false), 2000);
  };

  const handleReconcileAndMarkPaid = async () => {
    if (!activeRun) return;
    const confirm = window.confirm(
      `Confirm bank disbursement reconciliation for ${activeRun.periodLabel}?\nThis will mark payroll as PAID and mark associated approved expense claims as PAID.`
    );
    if (!confirm) return;

    await updatePayrollStatus(activeRun.id, 'PAID');

    // Mark all included approved expenses as PAID
    for (const entry of activeEntries) {
      if (entry.reimbursement > 0) {
        const empApprovedExpenses = expenses.filter(
          (exp) =>
            (exp.employeeId === entry.employeeId || exp.employeeNumber === entry.employeeNumber) &&
            exp.status === 'APPROVED' &&
            exp.paymentStatus !== 'PAID'
        );
        for (const exp of empApprovedExpenses) {
          await markExpensePaid(exp.id, `PAYROLL_${activeRun.id}`);
        }
      }
    }

    alert(`Payroll ${activeRun.id} successfully marked as PAID. All employee expense claims reconciled.`);
  };

  // Helper to get late count for employee from attendance
  const getEmployeeLateCount = (empId: string) => {
    return attendanceRecords.filter((rec) => {
      if (rec.employeeId !== empId) return false;
      const d = new Date(rec.date);
      return (
        d.getMonth() + 1 === calcMonth &&
        d.getFullYear() === calcYear &&
        rec.lateArrivalMinutes > 0
      );
    }).length;
  };

  const STAGES: Array<{ key: PayrollRunStatus; label: string }> = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'CALCULATED', label: 'Calculated' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'APPROVED', label: 'Approved & Locked' },
    { key: 'EXPORTED', label: 'TXT Generated' },
    { key: 'PAID', label: 'Payment Reconciled' },
  ];

  const currentStageIndex = STAGES.findIndex((s) => s.key === activeRun?.status);

  return (
    <div className="space-y-6">
      {/* Top Header & Calculation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 font-semibold uppercase tracking-wider">
            <span>Automated Attendance-To-Payroll Engine</span>
            <span>·</span>
            <span>Direct ICICI Bank TXT Integration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Monthly Payroll Processing & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dynamic salary computation from approved attendance registers, travel expenses, and salary structures.
          </p>
        </div>

        {/* Period Selector & Run Trigger */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-slate-500 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">Period:</span>
          </div>
          <select
            value={calcMonth}
            onChange={(e) => setCalcMonth(Number(e.target.value))}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none"
          >
            <option value={9}>September (09)</option>
            <option value={10}>October (10)</option>
            <option value={11}>November (11)</option>
            <option value={12}>December (12)</option>
          </select>
          <select
            value={calcYear}
            onChange={(e) => setCalcYear(Number(e.target.value))}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={handleRunCalculation}
            disabled={calculating}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{calculating ? 'Calculating...' : 'Run Calculation'}</span>
          </button>
        </div>
      </div>

      {/* Workflow Stage Progress Bar */}
      {activeRun && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Workflow Lifecycle:
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-900 text-amber-400">
                {activeRun.periodLabel.toUpperCase()} · BATCH {activeRun.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Stage Transition Actions */}
              {activeRun.status === 'CALCULATED' && (
                <button
                  onClick={() => handleStageChange('UNDER_REVIEW')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  Submit for Review
                </button>
              )}
              {activeRun.status === 'UNDER_REVIEW' && (
                <button
                  onClick={() => handleStageChange('APPROVED')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Lock className="w-3 h-3" />
                  <span>Approve & Lock Payroll</span>
                </button>
              )}
              {(activeRun.status === 'APPROVED' || activeRun.status === 'EXPORTED') && (
                <>
                  <button
                    onClick={() => setShowIciciModal(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Download ICICI Salary TXT</span>
                  </button>
                  <button
                    onClick={handleRelease}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Release Payslips</span>
                  </button>
                  <button
                    onClick={handleReconcileAndMarkPaid}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Reconcile Payment</span>
                  </button>
                </>
              )}
              {activeRun.status === 'PAID' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reconciled & Paid</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={s.key}
                  className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="text-[10px] uppercase font-mono opacity-80">Step {idx + 1}</div>
                  <div className="mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payroll Executive Summary Cards */}
      {activeRun && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Net Salary Payable */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-amber-400 text-xs font-mono uppercase tracking-wider">
              <span>Total Net Payable</span>
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {formatINR(summaryMetrics.totalNetPayable)}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>{summaryMetrics.totalEmployees} Employees</span>
              <span className="text-emerald-400 font-semibold">{activeRun.status}</span>
            </div>
          </div>

          {/* Card 2: Gross Earnings & Reimbursements */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Total Gross Earned</span>
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatINR(summaryMetrics.totalGross)}
            </div>
            <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Incl. Travel Claims:</span>
              <span className="font-semibold text-emerald-700 font-mono">
                {formatINR(summaryMetrics.totalReimbursements)}
              </span>
            </div>
          </div>

          {/* Card 3: Deductions Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Total Deductions</span>
              <BadgeAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600">
              {formatINR(summaryMetrics.totalDeductions)}
            </div>
            <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 space-y-0.5">
              <div className="flex justify-between">
                <span>Unpaid Leave (LWP):</span>
                <span className="font-mono text-slate-700">{formatINR(summaryMetrics.totalUnpaidLeaveDed)}</span>
              </div>
              <div className="flex justify-between">
                <span>Statutory (PF/TDS/PT):</span>
                <span className="font-mono text-slate-700">{formatINR(summaryMetrics.totalStatutoryDed)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Audit & Exceptions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Exceptions & Validation</span>
              <AlertTriangle className={`w-4 h-4 ${summaryMetrics.exceptionCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{summaryMetrics.exceptionCount}</span>
              <span className="text-xs text-slate-500">Exceptions flagged</span>
            </div>
            <div className="text-xs pt-1 border-t border-slate-100">
              {summaryMetrics.exceptionCount === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>All banking & attendance verified</span>
                </div>
              ) : (
                <div className="text-amber-700 font-medium">
                  Review employee banking or attendance before lock
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exception Banner if exceptions exist */}
      {exceptionsList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{exceptionsList.length} Staff Record(s) Require Administrative Attention</span>
          </div>
          <div className="space-y-1 pl-6">
            {exceptionsList.map(({ entry, issues }) => (
              <div key={entry.id} className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{entry.employeeName} ({entry.employeeNumber}):</span>
                <span className="text-amber-800">{issues.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Salary Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Staff Salary & Attendance Ledger ({activeRun?.periodLabel || `${calcMonth}/${calcYear}`})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Payable days proration, attendance units, statutory deductions, travel reimbursements, and net payable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIciciModal(true)}
              disabled={activeEntries.length === 0}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Download ICICI Salary TXT</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-3 font-semibold">Staff Member</th>
                <th className="py-3 px-2 font-semibold">Emp ID</th>
                <th className="py-3 px-2 font-semibold">Payable Days</th>
                <th className="py-3 px-2 font-semibold">Present</th>
                <th className="py-3 px-2 font-semibold">Paid Leave</th>
                <th className="py-3 px-2 font-semibold">Unpaid Leave</th>
                <th className="py-3 px-2 font-semibold">Late Count</th>
                <th className="py-3 px-2 font-semibold">Late Ded.</th>
                <th className="py-3 px-3 font-semibold">Gross Earnings</th>
                <th className="py-3 px-2 font-semibold">Travel Claims</th>
                <th className="py-3 px-2 font-semibold">Statutory Ded.</th>
                <th className="py-3 px-2 font-semibold">Other Ded.</th>
                <th className="py-3 px-2 font-semibold">Total Ded.</th>
                <th className="py-3 px-3 font-semibold">Net Salary</th>
                <th className="py-3 px-2 font-semibold">Payslip</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeEntries.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-600">No payroll calculated for this period.</p>
                    <p className="text-xs text-slate-400">
                      Click the "Run Calculation" button above to dynamically compute payroll from attendance and salary structures.
                    </p>
                  </td>
                </tr>
              ) : (
                activeEntries.map((entry) => {
                  const lateCount = getEmployeeLateCount(entry.employeeId);
                  const statutoryTotal =
                    (entry.pf || 0) + (entry.esi || 0) + (entry.tds || 0) + (entry.professionalTax || 0);
                  const otherDedTotal = (entry.advanceRecovery || 0) + (entry.otherDeductions || 0);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedEntryForAudit(entry)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {entry.employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {entry.department || 'Academics'}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-700">
                        {entry.employeeNumber}
                      </td>
                      <td className="py-3 px-2 font-mono font-medium text-slate-800">
                        {entry.payableDays} / {entry.totalMonthDays}
                      </td>
                      <td className="py-3 px-2 font-mono text-emerald-700">
                        {entry.presentDays + (entry.wfhDays || 0) + (entry.fieldDays || 0)}
                      </td>
                      <td className="py-3 px-2 font-mono text-blue-700">
                        {entry.paidLeaveDays || 0}
                      </td>
                      <td className="py-3 px-2 font-mono text-rose-600">
                        {entry.unpaidLeaveDays || 0}
                      </td>
                      <td className="py-3 px-2 font-mono text-amber-700">
                        {lateCount}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">
                        {entry.lateArrivalDeduction > 0 ? formatINR(entry.lateArrivalDeduction) : '₹0'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        <div>{formatINR(entry.grossEarnings)}</div>
                      </td>
                      <td className="py-3 px-2 font-mono">
                        {entry.reimbursement > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Receipt className="w-2.5 h-2.5" />
                            <span>+{formatINR(entry.reimbursement)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">
                        {formatINR(statutoryTotal)}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">
                        {formatINR(entry.unpaidLeaveDeduction + otherDedTotal)}
                      </td>
                      <td className="py-3 px-2 font-mono font-medium text-rose-600">
                        {formatINR(entry.totalDeductions)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(entry.netPayable)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            entry.payslipReleased
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.payslipReleased ? 'Released' : 'Locked'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEntryForAudit(entry)}
                            className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                            title="Audit formula and breakdown"
                          >
                            <Info className="w-3 h-3 text-slate-500" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => setSelectedEntryForPayslip(entry)}
                            className="px-2 py-1 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors flex items-center gap-1"
                            title="View / Print Payslip"
                          >
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ICICI Salary TXT Generation Modal */}
      {showIciciModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">ICICI Bank CIB Salary Payment TXT</h3>
                  <p className="text-[11px] text-slate-400">
                    Direct Corporate Internet Banking Bulk Text File Generation ({activeRun?.periodLabel})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIciciModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Batch Configuration Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Debit Account</div>
                  <div className="font-bold text-slate-900">{iciciTxtConfig.debitAccountNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Corporate ID</div>
                  <div className="font-bold text-slate-900">{iciciTxtConfig.corporateId}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Beneficiaries</div>
                  <div className="font-bold text-slate-900">{iciciTxtResult.totalRecords} Records</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase">Total Batch Amount</div>
                  <div className="font-bold text-emerald-700">{formatINR(iciciTxtResult.totalAmount)}</div>
                </div>
              </div>

              {/* Routing Breakdown: WIB (Internal) vs MCO (NEFT) */}
              <div className="flex items-center gap-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex-1">
                  <span className="font-bold text-amber-950 block">Bank Routing Analysis:</span>
                  <div className="flex items-center gap-4 text-amber-900 mt-1">
                    <span>
                      Within ICICI (WIB / MCW): <strong>{iciciTxtResult.wibCount} transfers</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Other Bank NEFT (NFT / MCO): <strong>{iciciTxtResult.mcoCount} transfers</strong>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 font-mono block">FHR Total Count</span>
                  <span className="font-bold font-mono text-amber-950 text-sm">
                    {iciciTxtResult.fhrRecordCount} (Header + Records)
                  </span>
                </div>
              </div>

              {/* Validation Warnings / Errors */}
              {iciciTxtResult.errors.length > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Validation Issues Detected</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {iciciTxtResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-xs">
                    File Structure Validated: Ready for direct upload to ICICI Corporate Internet Banking.
                  </span>
                </div>
              )}

              {/* TXT Output Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-900 text-xs">
                    Raw TXT Content Preview ({iciciTxtResult.fileName})
                  </span>
                  <button
                    onClick={handleCopyTxt}
                    className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    {txtCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy TXT</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={iciciTxtResult.rawTxtContent}
                  className="w-full font-mono text-[11px] p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none resize-none leading-relaxed select-all"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  CRLF line endings · Windows format · No Excel conversion needed
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowIciciModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    disabled={!iciciTxtResult.isValid}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {iciciTxtResult.fileName}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Calculation Details Modal */}
      {selectedEntryForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Payroll Calculation Audit · {selectedEntryForAudit.employeeName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedEntryForAudit.employeeNumber} · Period: {activeRun?.periodLabel}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntryForAudit(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              {/* Attendance Inputs Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attendance Inputs & Payable Factor</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-700">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Total Month Days</span>
                    <span className="font-bold">{selectedEntryForAudit.totalMonthDays}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Payable Days</span>
                    <span className="font-bold text-emerald-700">{selectedEntryForAudit.payableDays}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Present / WFH / Field</span>
                    <span className="font-bold">
                      {selectedEntryForAudit.presentDays} / {selectedEntryForAudit.wfhDays} / {selectedEntryForAudit.fieldDays}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Unpaid Leave (LWP)</span>
                    <span className="font-bold text-rose-600">{selectedEntryForAudit.unpaidLeaveDays}</span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Eligible Earnings & Allowances</span>
                  <span className="font-mono text-emerald-700">
                    Gross: {formatINR(selectedEntryForAudit.grossEarnings)}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>{formatINR(selectedEntryForAudit.basic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Rent Allowance (HRA):</span>
                    <span>{formatINR(selectedEntryForAudit.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Allowance:</span>
                    <span>{formatINR(selectedEntryForAudit.specialAllowance)}</span>
                  </div>
                  {selectedEntryForAudit.conveyance > 0 && (
                    <div className="flex justify-between">
                      <span>Conveyance Allowance:</span>
                      <span>{formatINR(selectedEntryForAudit.conveyance)}</span>
                    </div>
                  )}
                  {selectedEntryForAudit.reimbursement > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/70 p-1.5 rounded">
                        <span className="flex items-center gap-1 font-sans">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Approved Travel Expense Claims Reimbursement:</span>
                        </span>
                        <span>+{formatINR(selectedEntryForAudit.reimbursement)}</span>
                      </div>
                      {/* Linked claims details */}
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">
                          Included Expense Claims ({selectedEntryForAudit.reimbursementClaimIds?.length || 0})
                        </span>
                        {expenses
                          .filter((exp) => (selectedEntryForAudit.reimbursementClaimIds || []).includes(exp.id))
                          .map((claim) => (
                            <div key={claim.id} className="flex items-center justify-between text-[11px] text-slate-700 font-sans py-0.5 border-b border-slate-100 last:border-0">
                              <div>
                                <span className="font-mono font-bold text-slate-900">{claim.id}</span>
                                <span className="text-slate-500"> · {claim.schoolName} ({claim.visitDate})</span>
                              </div>
                              <span className="font-mono font-semibold text-emerald-700">{formatINR(claim.totalAmount)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Deductions & Statutory Recoveries</span>
                  <span className="font-mono text-rose-600">
                    Total: {formatINR(selectedEntryForAudit.totalDeductions)}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Unpaid Leave (LWP Deduction):</span>
                    <span className="text-rose-600">
                      {formatINR(selectedEntryForAudit.unpaidLeaveDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Arrival Penalty Deduction:</span>
                    <span>{formatINR(selectedEntryForAudit.lateArrivalDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund (PF):</span>
                    <span>{formatINR(selectedEntryForAudit.pf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Deducted at Source (TDS):</span>
                    <span>{formatINR(selectedEntryForAudit.tds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax (PT):</span>
                    <span>{formatINR(selectedEntryForAudit.professionalTax)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Payable & Banking Target */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-mono">Net Salary Payable</div>
                  <div className="text-xl font-bold font-mono">{formatINR(selectedEntryForAudit.netPayable)}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono text-slate-300">
                    A/C: {selectedEntryForAudit.bankAccountNumber || 'NOT CONFIGURED'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    IFSC: {selectedEntryForAudit.bankIfsc || 'N/A'} · {selectedEntryForAudit.bankName}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedEntryForAudit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {selectedEntryForPayslip && (
        <PayslipModal
          entry={selectedEntryForPayslip}
          onClose={() => setSelectedEntryForPayslip(null)}
        />
      )}
    </div>
  );
};
