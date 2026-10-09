import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatDateIndian, downloadCsv, downloadXlsx } from '../../lib/exportUtils';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  Building,
  ShieldAlert,
} from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const {
    employees,
    attendanceRecords,
    payrollRuns,
    payrollEntries,
    salaryStructures,
    isSuperAdmin,
    isDataOperator,
    isEmployee,
    currentEmployee,
  } = useAuth();

  const [activeReport, setActiveReport] = useState<
    'annual_statement' | 'monthly_register' | 'attendance_summary' | 'employee_master'
  >(isDataOperator ? 'attendance_summary' : 'annual_statement');

  const [selectedEmpId, setSelectedEmpId] = useState(
    isEmployee ? currentEmployee?.id || '' : employees[0]?.id || ''
  );
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9);

  // If Operator: strictly block financial reports per specifications
  if (isDataOperator && (activeReport === 'annual_statement' || activeReport === 'monthly_register')) {
    setActiveReport('attendance_summary');
  }

  // 1. Annual Statement data for selected employee
  const annualEntries = payrollEntries.filter(
    (e) => (e.employeeId === selectedEmpId || (isEmployee && e.employeeId === currentEmployee?.id)) && e.year === selectedYear
  );
  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || currentEmployee;

  // 2. Monthly Register data
  const monthlyEntries = payrollEntries.filter(
    (e) => e.month === selectedMonth && e.year === selectedYear
  );

  const handleExportAnnualCsv = () => {
    const headers = 'Month,Year,Payable_Days,Gross_Earnings,PF,ESI,TDS,Total_Deductions,Net_Payable\n';
    const rows = annualEntries
      .map(
        (e) =>
          `${e.month},${e.year},${e.payableDays},${e.grossEarnings},${e.pf},${e.esi},${e.tds},${e.totalDeductions},${e.netPayable}`
      )
      .join('\n');
    downloadCsv(`Annual_Statement_${selectedEmp?.employeeNumber}_${selectedYear}.csv`, headers + rows);
  };

  const handleExportAnnualXlsx = () => {
    const data = annualEntries.map((e) => ({
      Month: new Date(e.year, e.month - 1).toLocaleDateString('en-US', { month: 'long' }),
      Year: e.year,
      'Payable Days': e.payableDays,
      'Gross Earnings': e.grossEarnings,
      'PF Deduction': e.pf,
      'ESI Deduction': e.esi,
      'TDS Deduction': e.tds,
      'Total Deductions': e.totalDeductions,
      'Net Payable': e.netPayable,
    }));
    downloadXlsx(`Annual_Statement_${selectedEmp?.employeeNumber}_${selectedYear}.xlsx`, 'Annual_Salary', data);
  };

  const handleExportMonthlyXlsx = () => {
    const data = monthlyEntries.map((e) => ({
      'Employee ID': e.employeeNumber,
      'Employee Name': e.employeeName,
      'Payable Days': e.payableDays,
      Basic: e.basic,
      HRA: e.hra,
      Allowances: e.specialAllowance + e.conveyance + e.medical,
      'Gross Earnings': e.grossEarnings,
      'PF Deduction': e.pf,
      'ESI Deduction': e.esi,
      'TDS Deduction': e.tds,
      'PT Deduction': e.professionalTax,
      'Total Deductions': e.totalDeductions,
      'Net Payable': e.netPayable,
      'Bank Account': e.bankAccountNumber ? `...${e.bankAccountNumber.slice(-4)}` : '',
      'Bank IFSC': e.bankIfsc,
    }));
    downloadXlsx(`Monthly_Payroll_Register_${selectedMonth}_${selectedYear}.xlsx`, 'Payroll_Register', data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Payroll Registers & Statutory Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consolidated registers, individual annual salary statements, and attendance summaries.
          </p>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        {!isDataOperator && (
          <>
            <button
              onClick={() => setActiveReport('annual_statement')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeReport === 'annual_statement'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual Annual Salary Statement
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveReport('monthly_register')}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  activeReport === 'monthly_register'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Consolidated Monthly Payroll Register
              </button>
            )}
          </>
        )}

        <button
          onClick={() => setActiveReport('attendance_summary')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            activeReport === 'attendance_summary'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance Summary Register
        </button>

        <button
          onClick={() => setActiveReport('employee_master')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            activeReport === 'employee_master'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Employee Master Report
        </button>
      </div>

      {/* REPORT 1: Individual Annual Statement */}
      {activeReport === 'annual_statement' && !isDataOperator && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Annual Salary Statement (Financial Year / Calendar Year {selectedYear})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Month-by-month earnings, deductions, and tax withholdings for {selectedEmp?.fullName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEmployee && (
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeNumber || 'ID Pending'})
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>

              <button
                onClick={handleExportAnnualXlsx}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export XLSX</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Month</th>
                  <th className="py-2.5 px-3 font-semibold">Payable Days</th>
                  <th className="py-2.5 px-3 font-semibold">Gross Earnings</th>
                  <th className="py-2.5 px-3 font-semibold">PF</th>
                  <th className="py-2.5 px-3 font-semibold">TDS</th>
                  <th className="py-2.5 px-3 font-semibold">Total Deductions</th>
                  <th className="py-2.5 px-3 font-semibold font-bold">Net Salary (INR)</th>
                  <th className="py-2.5 px-3 font-semibold">Disbursement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annualEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payroll records found for this employee in {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  annualEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {new Date(e.year, e.month - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{e.payableDays} / {e.totalMonthDays}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{formatINR(e.grossEarnings)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatINR(e.pf)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatINR(e.tds)}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-600">{formatINR(e.totalDeductions)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-sm">{formatINR(e.netPayable)}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {e.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: Consolidated Monthly Register */}
      {activeReport === 'monthly_register' && isSuperAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Consolidated Monthly Payroll Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete employee wage sheet for all staff members.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value={9}>September (09)</option>
                <option value={10}>October (10)</option>
                <option value={8}>August (08)</option>
              </select>

              <button
                onClick={handleExportMonthlyXlsx}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export XLSX</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee ID</th>
                  <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                  <th className="py-2.5 px-3 font-semibold">Days</th>
                  <th className="py-2.5 px-3 font-semibold">Gross Earnings</th>
                  <th className="py-2.5 px-3 font-semibold">PF</th>
                  <th className="py-2.5 px-3 font-semibold">TDS</th>
                  <th className="py-2.5 px-3 font-semibold">Total Ded.</th>
                  <th className="py-2.5 px-3 font-semibold font-bold">Net Salary (INR)</th>
                  <th className="py-2.5 px-3 font-semibold">Bank A/C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{e.employeeNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{e.employeeName}</td>
                    <td className="py-2.5 px-3 font-mono">{e.payableDays}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{formatINR(e.grossEarnings)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatINR(e.pf)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatINR(e.tds)}</td>
                    <td className="py-2.5 px-3 font-mono text-rose-600">{formatINR(e.totalDeductions)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-sm">{formatINR(e.netPayable)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {e.bankAccountNumber ? `...${e.bankAccountNumber.slice(-4)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: Attendance Summary Register */}
      {activeReport === 'attendance_summary' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Organizational Attendance Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff punch statistics by work mode: Office, Field visits, and Work from Home.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Mode</th>
                  <th className="py-2.5 px-3 font-semibold">Total Punches</th>
                  <th className="py-2.5 px-3 font-semibold">Field Site Visits</th>
                  <th className="py-2.5 px-3 font-semibold">WFH Days</th>
                  <th className="py-2.5 px-3 font-semibold">Late Punches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const empRecords = attendanceRecords.filter((r) => r.employeeId === emp.id);
                  const fieldCount = empRecords.filter((r) => r.workMode === 'FIELD').length;
                  const wfhCount = empRecords.filter((r) => r.workMode === 'WFH').length;
                  const lateCount = empRecords.filter((r) => r.lateArrivalMinutes > 0).length;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{emp.employeeNumber || 'ID Pending'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{emp.assignedWorkMode}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{empRecords.length}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600">{fieldCount}</td>
                      <td className="py-2.5 px-3 font-mono text-purple-600">{wfhCount}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-600">{lateCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: Employee Master Report */}
      {activeReport === 'employee_master' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Employee Master Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff profile records {isDataOperator && '(Masked for Data Operator protection)'}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee ID</th>
                  <th className="py-2.5 px-3 font-semibold">Full Legal Name</th>
                  <th className="py-2.5 px-3 font-semibold">Department</th>
                  <th className="py-2.5 px-3 font-semibold">Designation</th>
                  <th className="py-2.5 px-3 font-semibold">Work Mode</th>
                  <th className="py-2.5 px-3 font-semibold">Date of Joining</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{emp.employeeNumber || 'Pending'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.department}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.designation}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{emp.assignedWorkMode}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatDateIndian(emp.dateOfJoining)}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {emp.employmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
