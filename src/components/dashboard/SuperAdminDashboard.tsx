import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatINR, formatDateIndian } from '../../lib/exportUtils';
import {
  Users,
  Clock,
  Landmark,
  BadgeAlert,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Calendar,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
}

export const SuperAdminDashboard: React.FC<Props> = ({ onNavigate }) => {
  const {
    employees,
    attendanceRecords,
    requests,
    payrollRuns,
    auditLogs,
    systemSettings,
    expenses,
  } = useAuth();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employmentStatus === 'ACTIVE').length;
  const pendingOnboarding = employees.filter((e) => e.onboardingStatus === 'UNDER_REVIEW' || e.onboardingStatus === 'SUBMITTED').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const presentOffice = todayRecords.filter((r) => r.workMode === 'OFFICE' && r.status === 'PRESENT').length;
  const activeWfh = todayRecords.filter((r) => r.workMode === 'WFH').length;
  const activeField = todayRecords.filter((r) => r.workMode === 'FIELD').length;
  const lateCount = todayRecords.filter((r) => r.lateArrivalMinutes > 0).length;

  const latestPayroll = payrollRuns[0];
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const pendingExpenses = expenses.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <span>Super Administrator Console</span>
              <span>·</span>
              <span>{systemSettings.companyName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Executive Headcount, Attendance & Payroll Overview
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Authorized oversight of staff lifecycle, field GPS visits, and ICICI Bank salary disbursement files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('expenses')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4 text-slate-300" />
              <span>Travel Claims</span>
              {pendingExpenses > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-full text-[10px]">
                  {pendingExpenses}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('icici-bank')}
              className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Landmark className="w-4 h-4" />
              <span>ICICI Bank File Generator</span>
            </button>
            <button
              onClick={() => onNavigate('payroll-runs')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Payroll Runs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Total Staff Headcount</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span className="font-semibold text-emerald-600">{activeEmployees} Active</span>
            <span>·</span>
            <span className="text-amber-600">{pendingOnboarding} Pending Approval</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Today's Attendance</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{todayRecords.length} Punches</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap">
            <span>{presentOffice} Office</span>
            <span>·</span>
            <span>{activeWfh} WFH</span>
            <span>·</span>
            <span className="text-blue-600 font-medium">{activeField} Field</span>
            {lateCount > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-medium">{lateCount} Late</span>
              </>
            )}
          </div>
        </div>

        {/* Latest Payroll */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Latest Payroll ({latestPayroll?.periodLabel})</span>
            <Landmark className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatINR(latestPayroll?.totalNetPayable || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span className="font-semibold text-emerald-600">
              Status: {latestPayroll?.status || 'N/A'}
            </span>
            <span>·</span>
            <span>{latestPayroll?.totalEmployees} Employees</span>
          </div>
        </div>

        {/* Requests & Action Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Pending Approvals</span>
            <BadgeAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingRequests + pendingOnboarding + pendingExpenses}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap">
            <span onClick={() => onNavigate('requests')} className="cursor-pointer hover:underline text-slate-700">{pendingRequests} Leave/WFH</span>
            <span>·</span>
            <span onClick={() => onNavigate('employees')} className="cursor-pointer hover:underline text-slate-700">{pendingOnboarding} Onboard</span>
            {pendingExpenses > 0 && (
              <>
                <span>·</span>
                <span onClick={() => onNavigate('expenses')} className="cursor-pointer hover:underline text-indigo-600 font-semibold">{pendingExpenses} Travel Claims</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Field & Office Attendance + Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Today's Active Attendance Register */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Today's Real-Time Attendance Register ({formatDateIndian(todayStr)})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Office, WFH, and School Site Field attendance punches
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Full Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee</th>
                  <th className="py-2.5 px-3 font-semibold">Mode</th>
                  <th className="py-2.5 px-3 font-semibold">Punch Time</th>
                  <th className="py-2.5 px-3 font-semibold">Location / Site</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div>{rec.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rec.employeeNumber}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {rec.workMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {new Date(rec.checkInTime).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {rec.checkInLocation ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={rec.checkInLocation.address}>
                            {rec.checkInLocation.address || `${rec.checkInLocation.lat.toFixed(4)}, ${rec.checkInLocation.lng.toFixed(4)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Office Punch</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium text-slate-700">
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): System Audit Trail & Security Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Security Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-0.5">Immutable record of sensitive actions</p>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-slate-300 pl-3 py-0.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="font-mono">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-800 leading-snug">{log.summary}</p>
                <div className="text-[10px] text-slate-500 mt-1">
                  Actor: <span className="font-medium text-slate-700">{log.actingUserName}</span> ({log.actingUserRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
