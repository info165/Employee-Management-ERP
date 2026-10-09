import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, User, LogOut, Building2, ChevronDown, Check } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeRole,
    switchRole,
    currentEmployee,
    employees,
    signOut,
  } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-xs">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Organization Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-lg tracking-wider shadow-xs">
            FS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                FunScholar Edutech Solutions
              </span>
              <span className="hidden md:inline text-xs font-mono text-slate-400">· IN</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Staff Lifecycle, Attendance & ICICI Payroll Portal
            </p>
          </div>
        </div>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher for Reviewers / Evaluators */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 transition-colors"
              title="Switch role for evaluation"
            >
              <div className="flex items-center gap-1.5">
                {activeRole === 'SUPER_ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                {activeRole === 'DATA_OPERATOR' && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                {activeRole === 'EMPLOYEE' && <User className="w-3.5 h-3.5 text-emerald-600" />}
                <span>
                  Role: <strong className="font-semibold">{activeRole.replace('_', ' ')}</strong>
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
                  <p className="font-medium text-slate-900">Evaluation Role Switcher</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Test role-specific access controls:</p>
                </div>

                <button
                  onClick={() => {
                    switchRole('SUPER_ADMIN');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                    activeRole === 'SUPER_ADMIN' ? 'bg-amber-50/60 font-semibold text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>SUPER ADMIN</span>
                      {activeRole === 'SUPER_ADMIN' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Full access: Salaries, ICICI file, Approvals</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRole('DATA_OPERATOR');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                    activeRole === 'DATA_OPERATOR' ? 'bg-blue-50/60 font-semibold text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>DATA OPERATOR</span>
                      {activeRole === 'DATA_OPERATOR' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Onboarding, Attendance corrections (No Salary/Bank)</p>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <div className="px-3 py-1 text-[11px] font-medium text-slate-400">
                  Switch Active Employee (Self-Service)
                </div>

                {employees.slice(0, 3).map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      switchRole('EMPLOYEE', emp.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      activeRole === 'EMPLOYEE' && currentEmployee?.id === emp.id
                        ? 'bg-emerald-50/60 font-semibold text-slate-900'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <span>{emp.fullName}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({emp.assignedWorkMode})</span>
                    </div>
                    {activeRole === 'EMPLOYEE' && currentEmployee?.id === emp.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Name & Details */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-900 leading-tight">
              {currentUser?.displayName || 'User'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {activeRole === 'EMPLOYEE' && currentEmployee
                ? currentEmployee.employeeNumber || currentEmployee.email
                : currentUser?.email}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            title="Reset or sign out"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
