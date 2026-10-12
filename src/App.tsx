import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { OperatorDashboard } from './components/dashboard/OperatorDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { EmployeeDirectory } from './components/onboarding/EmployeeDirectory';
import { OnboardingForm } from './components/onboarding/OnboardingForm';
import { AttendancePunch } from './components/attendance/AttendancePunch';
import { AttendanceRegister } from './components/attendance/AttendanceRegister';
import { RequestManager } from './components/requests/RequestManager';
import { SalaryStructures } from './components/payroll/SalaryStructures';
import { PayrollRuns } from './components/payroll/PayrollRuns';
import { IciciBankManager } from './components/icici/IciciBankManager';
import { ReportsCenter } from './components/reports/ReportsCenter';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { SystemSettingsView } from './components/settings/SystemSettingsView';
import { MyDocuments } from './components/employee/MyDocuments';
import { MyPayslips } from './components/employee/MyPayslips';
import { ExpenseClaimsManager } from './components/expenses/ExpenseClaimsManager';
import { SchoolsDirectory } from './components/schools/SchoolsDirectory';
import { ShieldCheck, UserCheck, User } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeRole, isSuperAdmin, isDataOperator, isEmployee, authReady } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Wait until Firebase has told us whether a saved sign-in exists before
  // rendering anything. Otherwise the UI briefly shows local demo data and
  // then swaps to real Firestore data a moment later, which looks broken.
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* View Switching */}
            {currentTab === 'dashboard' && (
              <>
                {isSuperAdmin && <SuperAdminDashboard onNavigate={setCurrentTab} />}
                {isDataOperator && <OperatorDashboard onNavigate={setCurrentTab} />}
                {isEmployee && <EmployeeDashboard onNavigate={setCurrentTab} />}
              </>
            )}

            {currentTab === 'employees' && (
              <EmployeeDirectory onOpenNewOnboarding={() => setCurrentTab('onboard-new')} />
            )}

            {currentTab === 'schools' && <SchoolsDirectory />}

            {currentTab === 'onboard-new' && (
              <OnboardingForm
                onCancel={() => setCurrentTab('employees')}
                onSuccess={() => setCurrentTab('employees')}
              />
            )}

            {currentTab === 'clock-in' && <AttendancePunch />}

            {currentTab === 'attendance' && <AttendanceRegister />}

            {currentTab === 'requests' && <RequestManager />}

            {currentTab === 'expenses' && <ExpenseClaimsManager />}

            {currentTab === 'salary-structures' && <SalaryStructures />}

            {currentTab === 'payroll-runs' && <PayrollRuns />}

            {currentTab === 'icici-bank' && <IciciBankManager />}

            {currentTab === 'reports' && <ReportsCenter />}

            {currentTab === 'audit-logs' && <AuditLogViewer />}

            {currentTab === 'settings' && <SystemSettingsView />}

            {currentTab === 'my-documents' && <MyDocuments />}

            {currentTab === 'my-payslips' && <MyPayslips />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
