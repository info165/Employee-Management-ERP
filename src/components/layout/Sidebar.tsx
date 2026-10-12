import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Building,
  Landmark,
  BarChart3,
  ScrollText,
  Settings,
  CalendarCheck,
  FileText,
  BadgeAlert,
  Receipt,
  GraduationCap,
  KeyRound,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'employees'
  | 'schools'
  | 'onboard-new'
  | 'create-login'
  | 'attendance'
  | 'clock-in'
  | 'requests'
  | 'expenses'
  | 'salary-structures'
  | 'payroll-runs'
  | 'icici-bank'
  | 'reports'
  | 'audit-logs'
  | 'settings'
  | 'my-documents'
  | 'my-payslips';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeRole, isSuperAdmin, isDataOperator, isEmployee, expenses, pendingAccounts } = useAuth();

  const pendingExpensesCount = expenses.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW'
  ).length;

  const pendingReviewCount = pendingAccounts.filter(
    (a) => a.onboardingSubmitted
  ).length;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Navigation Workspace
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span>{activeRole.replace('_', ' ')} PORTAL</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Core Operations */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Overview
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Employee Lifecycle / Self-Service */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {isEmployee ? 'Personal Profile' : 'Staff Lifecycle'}
          </div>
          <div className="space-y-1">
            {!isEmployee && (
              <>
                <button
                  onClick={() => onSelectTab('employees')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentTab === 'employees'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Employee Directory</span>
                </button>

                <button
                  onClick={() => onSelectTab('schools')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentTab === 'schools'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>Schools & Field Sites</span>
                </button>

                <button
                  onClick={() => onSelectTab('onboard-new')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentTab === 'onboard-new'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-slate-400" />
                  <span>New Onboarding</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => onSelectTab('create-login')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      currentTab === 'create-login'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Issue Employee Login</span>
                    </div>
                    {pendingReviewCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full font-mono">
                        {pendingReviewCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            {isEmployee && (
              <button
                onClick={() => onSelectTab('my-documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'my-documents'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-4 h-4 text-slate-400" />
                <span>My Documents</span>
              </button>
            )}
          </div>
        </div>

        {/* Attendance & Leave */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Attendance & Time
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('clock-in')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'clock-in'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{isEmployee ? 'Punch Attendance (GPS)' : 'Live Punch Terminal'}</span>
            </button>

            <button
              onClick={() => onSelectTab('attendance')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'attendance'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-slate-400" />
              <span>{isEmployee ? 'My Attendance Log' : 'Attendance Register'}</span>
            </button>

            <button
              onClick={() => onSelectTab('requests')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'requests'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BadgeAlert className="w-4 h-4 text-slate-400" />
              <span>{isEmployee ? 'My Leave & WFH' : 'Requests & Approvals'}</span>
            </button>

            <button
              onClick={() => onSelectTab('expenses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'expenses'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>{isEmployee ? 'My Travel Claims' : 'Travel Expenses'}</span>
              </div>
              {!isEmployee && pendingExpensesCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full font-mono">
                  {pendingExpensesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Payroll & Banking (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <span>Payroll & ICICI Bank</span>
              <span className="text-[9px] bg-amber-400/10 text-amber-300 px-1 py-0.5 rounded">Admin</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSelectTab('salary-structures')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'salary-structures'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4 text-amber-400" />
                <span>Salary Structures</span>
              </button>

              <button
                onClick={() => onSelectTab('payroll-runs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'payroll-runs'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>Monthly Payroll Runs</span>
              </button>

              <button
                onClick={() => onSelectTab('icici-bank')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'icici-bank'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>ICICI Bank File Generator</span>
              </button>
            </div>
          </div>
        )}

        {/* Employee Payslips (Employee Only) */}
        {isEmployee && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Compensation
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSelectTab('my-payslips')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  currentTab === 'my-payslips'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>My Payslips & Statements</span>
              </button>
            </div>
          </div>
        )}

        {/* Reports & Governance */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Governance
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'reports'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Reports & Registers</span>
            </button>

            {isSuperAdmin && (
              <>
                <button
                  onClick={() => onSelectTab('audit-logs')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentTab === 'audit-logs'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <ScrollText className="w-4 h-4 text-slate-400" />
                  <span>Audit Logs</span>
                </button>

                <button
                  onClick={() => onSelectTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentTab === 'settings'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>System Settings</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Timezone: Asia/Kolkata</span>
          <span className="font-mono">INR (₹)</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Format: DD-MM-YYYY
        </div>
      </div>
    </aside>
  );
};
