import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  Employee,
  EmployeeBankDetails,
  EmployeeDocument,
  AttendanceRecord,
  SalaryStructure,
  PayrollRun,
  PayrollEntry,
  IciciBankExportConfig,
  SystemSettings,
  AuditLog,
  EmployeeRequest,
  WorkMode,
  AttendanceLocation,
  School,
  ExpenseClaim,
  IciciTxtBatchConfig,
} from '../types';
import {
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_DOCUMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_REQUESTS,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_PAYROLL_RUNS,
  INITIAL_PAYROLL_ENTRIES,
  INITIAL_ICICI_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHOOLS,
  INITIAL_EXPENSES,
  INITIAL_ICICI_TXT_CONFIG,
} from '../lib/seedData';
import { auth, testConnection } from '../lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  updatePassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { provisionFirebaseUser } from '../lib/accountProvisioning';
import { watchCollection, watchDoc, saveDoc } from '../lib/firestoreSync';
import { PendingAccount } from '../types';

// Firestore collection / doc names, matching firestore.rules exactly.
const COL = {
  employees: 'employees',
  documents: 'employee_documents',
  attendance: 'attendance_records',
  requests: 'requests',
  salaryStructures: 'salary_structures',
  payrollRuns: 'payroll_runs',
  payrollEntries: 'payroll_entries',
  schools: 'schools',
  expenses: 'expenses',
  auditLogs: 'audit_logs',
  pendingAccounts: 'pending_accounts',
} as const;
const SETTINGS_COL = 'system_settings';
const SETTINGS_DOC_ID = 'main';
const BANK_CONFIG_COL = 'bank_export_configs';
const ICICI_DOC_ID = 'icici';
const ICICI_TXT_DOC_ID = 'icici_txt';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  isDbConnected: boolean;
  authReady: boolean;
  activeRole: UserRole;
  isSuperAdmin: boolean;
  isDataOperator: boolean;
  isEmployee: boolean;
  currentEmployee: Employee | null;
  
  // Pending account & self-service state
  pendingAccounts: PendingAccount[];
  currentPendingAccount: PendingAccount | null;
  createEmployeeLogin: (email: string, password: string) => Promise<{ uid: string }>;
  completePasswordChange: (newPassword: string) => Promise<void>;
  markOnboardingSubmitted: (uid: string) => Promise<void>;
  
  // Role switching for rapid evaluation & testing
  switchRole: (role: UserRole, targetEmployeeId?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Data state
  employees: Employee[];
  documents: EmployeeDocument[];
  attendanceRecords: AttendanceRecord[];
  requests: EmployeeRequest[];
  salaryStructures: SalaryStructure[]; // Hidden from Data Operator & Employee
  payrollRuns: PayrollRun[];           // Hidden from Data Operator & Employee
  payrollEntries: PayrollEntry[];
  iciciConfig: IciciBankExportConfig;
  systemSettings: SystemSettings;
  auditLogs: AuditLog[];
  schools: School[];
  expenses: ExpenseClaim[];
  iciciTxtConfig: IciciTxtBatchConfig;

  // Mutators
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'accountActivated'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  updateEmployeeBankDetails: (employeeId: string, bankDetails: Partial<EmployeeBankDetails>, reason?: string) => Promise<void>;
  verifyEmployeeBankDetails: (employeeId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => Promise<void>;
  approveOnboarding: (id: string, customNumber?: string) => Promise<{ employeeNumber: string }>;
  uploadDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => Promise<void>;
  updateDocumentStatus: (docId: string, status: 'VERIFIED' | 'REJECTED', remarks?: string) => Promise<void>;

  // Schools & Expenses
  addSchool: (school: Omit<School, 'id' | 'createdAt'>) => Promise<School>;
  updateSchool: (id: string, updates: Partial<School>) => Promise<void>;
  submitExpense: (claim: Omit<ExpenseClaim, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'totalAmount' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'>) => Promise<ExpenseClaim>;
  saveExpenseDraft: (claim: Omit<ExpenseClaim, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'totalAmount' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'>) => Promise<ExpenseClaim>;
  reviewExpense: (expenseId: string, status: 'APPROVED' | 'REJECTED', comments?: string) => Promise<void>;
  markExpensePaid: (expenseId: string, paymentRef?: string) => Promise<void>;
  updateIciciTxtConfig: (cfg: Partial<IciciTxtBatchConfig>) => Promise<void>;

  // Attendance actions
  clockIn: (workMode: WorkMode, location?: AttendanceLocation, remarks?: string) => Promise<AttendanceRecord>;
  clockOut: (location?: AttendanceLocation, remarks?: string) => Promise<AttendanceRecord>;
  correctAttendance: (
    recordId: string,
    field: string,
    newValue: string,
    reason: string,
    note?: string
  ) => Promise<void>;

  // Requests
  submitRequest: (req: Omit<EmployeeRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'>) => Promise<void>;
  reviewRequest: (requestId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void>;

  // Salary & Payroll (Super Admin Only)
  saveSalaryStructure: (structure: Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createPayrollRun: (month: number, year: number, entries: PayrollEntry[]) => Promise<PayrollRun>;
  updatePayrollStatus: (runId: string, status: PayrollRun['status']) => Promise<void>;
  releasePayslips: (runId: string) => Promise<void>;
  
  // ICICI Bank Generator
  saveIciciConfig: (cfg: Partial<IciciBankExportConfig>) => Promise<void>;
  recordBankExport: (exportItem: IciciBankExportConfig['history'][0]) => Promise<void>;

  // Settings & Audit
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  logAction: (
    action: string,
    targetType: string,
    summary: string,
    targetId?: string,
    outcome?: 'SUCCESS' | 'FAILURE'
  ) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'info@funscholar.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Default state seeded
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [documents, setDocuments] = useState<EmployeeDocument[]>(INITIAL_DOCUMENTS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [requests, setRequests] = useState<EmployeeRequest[]>(INITIAL_REQUESTS);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(INITIAL_SALARY_STRUCTURES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(INITIAL_PAYROLL_RUNS);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>(INITIAL_PAYROLL_ENTRIES);
  const [iciciConfig, setIciciConfig] = useState<IciciBankExportConfig>(INITIAL_ICICI_CONFIG);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(INITIAL_EXPENSES);
  const [iciciTxtConfig, setIciciTxtConfig] = useState<IciciTxtBatchConfig>(INITIAL_ICICI_TXT_CONFIG);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [currentPendingAccount, setCurrentPendingAccount] = useState<PendingAccount | null>(null);

  // Active current profile
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    uid: 'admin-master',
    email: BOOTSTRAP_ADMIN_EMAIL,
    displayName: 'Super Administrator',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  });

  const [activeRole, setActiveRole] = useState<UserRole>('SUPER_ADMIN');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('emp-001');

  // True once Firebase has told us whether a saved sign-in exists. Until then
  // we don't know if we'll end up showing local demo data or real Firestore
  // data, so the UI should wait rather than flash the demo numbers first.
  const [authReady, setAuthReady] = useState(false);

  // Test Firestore on boot per Firebase guidelines
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log(`[auth] onAuthStateChanged fired: ${fbUser ? `signed in as ${fbUser.email}` : 'signed out / no user'}`);
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Force a token refresh so a session that's actually invalid (expired,
        // revoked, blocked by a Workspace policy, etc.) fails loudly right
        // here with a specific reason, instead of silently reverting later.
        try {
          await fbUser.getIdToken(true);
          console.log('[auth] token refresh OK, session is genuinely valid');
        } catch (tokenErr) {
          console.error('[auth] token refresh FAILED — this is why the session is being dropped:', tokenErr);
        }

        const isEmailAdmin = fbUser.email === BOOTSTRAP_ADMIN_EMAIL;
        const role: UserRole = isEmailAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE';

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Authorized User',
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(profile);
        setActiveRole(role);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Once signed in, mirror every collection from Firestore into local state in
  // real time. Until then the app keeps using the local demo/seed data above,
  // unchanged from before — signing in is what switches this app from a demo
  // to a persisted, multi-device instance.
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribers = [
      watchCollection<Employee>(COL.employees, setEmployees, INITIAL_EMPLOYEES),
      watchCollection<EmployeeDocument>(COL.documents, setDocuments, INITIAL_DOCUMENTS),
      watchCollection<AttendanceRecord>(COL.attendance, setAttendanceRecords, INITIAL_ATTENDANCE),
      watchCollection<EmployeeRequest>(COL.requests, setRequests, INITIAL_REQUESTS),
      watchCollection<SalaryStructure>(COL.salaryStructures, setSalaryStructures, INITIAL_SALARY_STRUCTURES),
      watchCollection<PayrollRun>(COL.payrollRuns, setPayrollRuns, INITIAL_PAYROLL_RUNS),
      watchCollection<PayrollEntry>(COL.payrollEntries, setPayrollEntries, INITIAL_PAYROLL_ENTRIES),
      watchCollection<School>(COL.schools, setSchools, INITIAL_SCHOOLS),
      watchCollection<ExpenseClaim>(COL.expenses, setExpenses, INITIAL_EXPENSES),
      watchCollection<AuditLog>(
        COL.auditLogs,
        (items) => setAuditLogs([...items].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))),
        INITIAL_AUDIT_LOGS
      ),
      watchDoc<SystemSettings>(
        SETTINGS_COL,
        SETTINGS_DOC_ID,
        (data) => setSystemSettings({ ...INITIAL_SYSTEM_SETTINGS, ...data }),
        INITIAL_SYSTEM_SETTINGS
      ),
      watchDoc<IciciBankExportConfig>(
        BANK_CONFIG_COL,
        ICICI_DOC_ID,
        (data) => setIciciConfig({ ...INITIAL_ICICI_CONFIG, ...data }),
        INITIAL_ICICI_CONFIG
      ),
      watchDoc<IciciTxtBatchConfig>(
        BANK_CONFIG_COL,
        ICICI_TXT_DOC_ID,
        (data) => setIciciTxtConfig({ ...INITIAL_ICICI_TXT_CONFIG, ...data }),
        INITIAL_ICICI_TXT_CONFIG
      ),
    ];

    const isEmailAdmin = firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL;
    if (isEmailAdmin) {
      unsubscribers.push(
        watchCollection<PendingAccount>(COL.pendingAccounts, setPendingAccounts)
      );
    } else {
      unsubscribers.push(
        watchDoc<PendingAccount>(COL.pendingAccounts, firebaseUser.uid, (data) => {
          setCurrentPendingAccount(data);
        })
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      // Signing out stops saving anything, so leaving the last-synced real
      // data frozen on screen would be misleading (it would look live and
      // editable while actually going nowhere). Switch back to the local
      // demo data instead, matching the "Local only" badge the UI now shows.
      setEmployees(INITIAL_EMPLOYEES);
      setDocuments(INITIAL_DOCUMENTS);
      setAttendanceRecords(INITIAL_ATTENDANCE);
      setRequests(INITIAL_REQUESTS);
      setSalaryStructures(INITIAL_SALARY_STRUCTURES);
      setPayrollRuns(INITIAL_PAYROLL_RUNS);
      setPayrollEntries(INITIAL_PAYROLL_ENTRIES);
      setIciciConfig(INITIAL_ICICI_CONFIG);
      setSystemSettings(INITIAL_SYSTEM_SETTINGS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setSchools(INITIAL_SCHOOLS);
      setExpenses(INITIAL_EXPENSES);
      setIciciTxtConfig(INITIAL_ICICI_TXT_CONFIG);
      setPendingAccounts([]);
      setCurrentPendingAccount(null);
    };
  }, [firebaseUser]);

  const isDbConnected = !!firebaseUser;
  const isRealNonAdmin = !!firebaseUser && firebaseUser.email !== BOOTSTRAP_ADMIN_EMAIL;
  const isSuperAdmin = !isRealNonAdmin && activeRole === 'SUPER_ADMIN';
  const isDataOperator = !isRealNonAdmin && activeRole === 'DATA_OPERATOR';
  const isEmployee = isRealNonAdmin || activeRole === 'EMPLOYEE';

  // Requirement 7:
  // For a real signed-in non-admin user, currentEmployee resolves by matching
  // employees.userId === firebaseUser.uid — not by the demo switcher.
  // Keep the demo switcher working as-is for the Super Admin's own internal testing/preview use.
  const currentEmployee = isRealNonAdmin
    ? (employees.find((e) => e.userId === firebaseUser.uid) || null)
    : (employees.find((e) => e.id === activeEmployeeId) || employees[0] || null);

  const logAction = (
    action: string,
    targetType: string,
    summary: string,
    targetId?: string,
    outcome: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actingUserId: currentUser?.email || 'system',
      actingUserName: currentUser?.displayName || 'System Admin',
      actingUserRole: activeRole,
      action,
      targetType,
      targetId,
      outcome,
      summary,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    if (firebaseUser) saveDoc(COL.auditLogs, newLog.id, newLog);
  };

  const switchRole = (role: UserRole, targetEmployeeId?: string) => {
    setActiveRole(role);
    if (role === 'SUPER_ADMIN') {
      setCurrentUser({
        uid: 'admin-master',
        email: BOOTSTRAP_ADMIN_EMAIL,
        displayName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      });
      logAction('ROLE_SWITCH', 'SECURITY', 'Switched session role to SUPER_ADMIN');
    } else if (role === 'DATA_OPERATOR') {
      setCurrentUser({
        uid: 'op-001',
        email: 'operator@funscholar.com',
        displayName: 'Anjali Sharma (Data Operator)',
        role: 'DATA_OPERATOR',
        isActive: true,
        createdAt: '2024-02-01T00:00:00Z',
      });
      logAction('ROLE_SWITCH', 'SECURITY', 'Switched session role to DATA_OPERATOR');
    } else {
      const empId = targetEmployeeId || 'emp-001';
      setActiveEmployeeId(empId);
      const emp = employees.find((e) => e.id === empId) || employees[0];
      setCurrentUser({
        uid: emp.userId || `user-${emp.id}`,
        email: emp.email,
        displayName: emp.fullName,
        role: 'EMPLOYEE',
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        isActive: true,
        createdAt: emp.createdAt,
      });
      logAction('ROLE_SWITCH', 'SECURITY', `Switched session role to EMPLOYEE (${emp.fullName})`);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      logAction('USER_LOGIN', 'AUTH', `Google login success: ${res.user.email}`);
    } catch (err) {
      console.error('Sign in error:', err);
      logAction('USER_LOGIN', 'AUTH', `Google login failed: ${err instanceof Error ? err.message : String(err)}`, undefined, 'FAILURE');
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      logAction('USER_LOGIN', 'AUTH', `Email login success: ${res.user.email}`);
    } catch (err) {
      console.error('Sign in error:', err);
      logAction('USER_LOGIN', 'AUTH', `Email login failed: ${err instanceof Error ? err.message : String(err)}`, undefined, 'FAILURE');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCurrentPendingAccount(null);
      switchRole('SUPER_ADMIN');
      logAction('USER_LOGOUT', 'AUTH', 'User signed out');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const createEmployeeLogin = async (email: string, password: string): Promise<{ uid: string }> => {
    if (!isSuperAdmin) throw new Error('Unauthorized: Only Super Admin can issue employee logins');
    const trimmedEmail = email.trim().toLowerCase();

    // Call the isolated secondary Firebase App instance so the Super Admin's
    // primary session is NEVER disturbed
    const uid = await provisionFirebaseUser(trimmedEmail, password);

    const pendingDoc: PendingAccount = {
      id: uid,
      uid,
      email: trimmedEmail,
      invitedBy: currentUser?.email || BOOTSTRAP_ADMIN_EMAIL,
      invitedAt: new Date().toISOString(),
      mustChangePassword: true,
      onboardingSubmitted: false,
    };

    setPendingAccounts((prev) => [pendingDoc, ...prev.filter((p) => p.uid !== uid)]);
    if (firebaseUser) {
      saveDoc(COL.pendingAccounts, uid, pendingDoc);
    }

    logAction(
      'EMPLOYEE_LOGIN_ISSUED',
      'AUTH',
      `Issued new employee login for ${trimmedEmail} (UID: ${uid}) with initial temporary password`,
      uid
    );

    return { uid };
  };

  const completePasswordChange = async (newPassword: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('No authenticated user session found');
    await updatePassword(auth.currentUser, newPassword);

    const uid = auth.currentUser.uid;
    const patch = { mustChangePassword: false };

    if (firebaseUser) {
      saveDoc(COL.pendingAccounts, uid, patch);
    }

    setCurrentPendingAccount((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
    setPendingAccounts((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, mustChangePassword: false } : p))
    );

    logAction('PASSWORD_UPDATED', 'AUTH', `User ${auth.currentUser.email} set permanent password`, uid);
  };

  const markOnboardingSubmitted = async (uid: string): Promise<void> => {
    const patch = { onboardingSubmitted: true };
    if (firebaseUser) {
      saveDoc(COL.pendingAccounts, uid, patch);
    }
    setCurrentPendingAccount((prev) => (prev ? { ...prev, onboardingSubmitted: true } : null));
    setPendingAccounts((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, onboardingSubmitted: true } : p))
    );
  };

  const addEmployee = async (
    empData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'accountActivated'>
  ): Promise<Employee> => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...empData,
      id,
      accountActivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEmployees((prev) => [newEmp, ...prev]);
    if (firebaseUser) saveDoc(COL.employees, id, newEmp);
    logAction('EMPLOYEE_ONBOARD_SUBMITTED', 'EMPLOYEE', `New employee onboarding record created for ${newEmp.fullName}`, id);
    return newEmp;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const patch = { ...updates, updatedAt: new Date().toISOString() };
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    if (firebaseUser) saveDoc(COL.employees, id, patch);
    logAction('EMPLOYEE_UPDATED', 'EMPLOYEE', `Employee record ${id} modified`, id);
  };

  const updateEmployeeBankDetails = async (
    employeeId: string,
    bankDetails: Partial<EmployeeBankDetails>,
    reason?: string
  ): Promise<void> => {
    if (!isSuperAdmin) throw new Error('Unauthorized: Bank profile modifications require Super Admin access');
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');

    const oldBank = emp.bankDetails;
    const historyEntry = {
      timestamp: new Date().toISOString(),
      changedBy: currentUser?.email || 'info@funscholar.com',
      field: 'bankDetails',
      oldValue: oldBank ? `${oldBank.bankName} - ${oldBank.bankAccountNumber} (${oldBank.bankIfsc})` : 'None',
      newValue: `${bankDetails.bankName || oldBank?.bankName || ''} - ${bankDetails.bankAccountNumber || oldBank?.bankAccountNumber || ''} (${bankDetails.bankIfsc || oldBank?.bankIfsc || ''})`,
      reason: reason || 'Administrative correction',
    };

    const updatedBank: EmployeeBankDetails = {
      accountHolderName: bankDetails.accountHolderName || oldBank?.accountHolderName || emp.fullName,
      bankName: bankDetails.bankName || oldBank?.bankName || 'ICICI Bank',
      bankAccountNumber: String(bankDetails.bankAccountNumber || oldBank?.bankAccountNumber || ''),
      bankIfsc: (bankDetails.bankIfsc || oldBank?.bankIfsc || '').toUpperCase().trim(),
      transactionRoute: bankDetails.transactionRoute || oldBank?.transactionRoute || (bankDetails.bankIfsc?.startsWith('ICIC') ? 'WIB' : 'NEFT'),
      verificationStatus: bankDetails.verificationStatus || oldBank?.verificationStatus || 'VERIFIED',
      verifiedAt: bankDetails.verificationStatus === 'VERIFIED' ? new Date().toISOString() : oldBank?.verifiedAt,
      verifiedBy: bankDetails.verificationStatus === 'VERIFIED' ? (currentUser?.email || 'info@funscholar.com') : oldBank?.verifiedBy,
      effectiveDate: bankDetails.effectiveDate || oldBank?.effectiveDate || new Date().toISOString().split('T')[0],
      changeHistory: [...(oldBank?.changeHistory || []), historyEntry],
    };

    const patch = { bankDetails: updatedBank, updatedAt: new Date().toISOString() };
    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, ...patch } : e)));
    if (firebaseUser) saveDoc(COL.employees, employeeId, patch);

    logAction(
      'EMPLOYEE_BANK_UPDATED',
      'EMPLOYEE',
      `Updated bank profile for ${emp.fullName} (${updatedBank.bankName} A/C ${updatedBank.bankAccountNumber}, Route: ${updatedBank.transactionRoute}): ${reason || 'Admin update'}`,
      employeeId
    );
  };

  const verifyEmployeeBankDetails = async (
    employeeId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ): Promise<void> => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp || !emp.bankDetails) throw new Error('Employee or bank details not found');

    const updatedBank: EmployeeBankDetails = {
      ...emp.bankDetails,
      verificationStatus: status,
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.email || 'info@funscholar.com',
      changeHistory: [
        ...(emp.bankDetails.changeHistory || []),
        {
          timestamp: new Date().toISOString(),
          changedBy: currentUser?.email || 'info@funscholar.com',
          field: 'verificationStatus',
          oldValue: emp.bankDetails.verificationStatus,
          newValue: status,
          reason: notes || `Marked ${status} by Super Admin`,
        },
      ],
    };

    const patch = { bankDetails: updatedBank, updatedAt: new Date().toISOString() };
    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, ...patch } : e)));
    if (firebaseUser) saveDoc(COL.employees, employeeId, patch);

    logAction(
      status === 'VERIFIED' ? 'BANK_VERIFIED' : 'BANK_REJECTED',
      'EMPLOYEE',
      `Bank details for ${emp.fullName} marked as ${status}${notes ? `: ${notes}` : ''}`,
      employeeId
    );
  };

  // Transactionally generate Employee ID in format EMP-YYYY-0001
  const approveOnboarding = async (id: string, customNumber?: string): Promise<{ employeeNumber: string }> => {
    const year = new Date().getFullYear();
    const nextSeq = systemSettings.employeeNumberSequence + 1;
    const generatedNumber =
      customNumber || `${systemSettings.employeeNumberPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

    setSystemSettings((prev) => ({
      ...prev,
      employeeNumberSequence: nextSeq,
    }));
    if (firebaseUser) saveDoc(SETTINGS_COL, SETTINGS_DOC_ID, { employeeNumberSequence: nextSeq });

    const approvalPatch = {
      employeeNumber: generatedNumber,
      onboardingStatus: 'APPROVED' as const,
      employmentStatus: 'ACTIVE' as const,
      accountActivated: true,
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.email || 'info@funscholar.com',
      updatedAt: new Date().toISOString(),
    };
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...approvalPatch } : e)));
    if (firebaseUser) saveDoc(COL.employees, id, approvalPatch);

    logAction(
      'ONBOARDING_APPROVED',
      'EMPLOYEE',
      `Approved onboarding for employee record ${id} with generated ID ${generatedNumber}`,
      id
    );

    return { employeeNumber: generatedNumber };
  };

  const uploadDocument = async (docData: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: EmployeeDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    if (firebaseUser) saveDoc(COL.documents, newDoc.id, newDoc);
    logAction('DOCUMENT_UPLOADED', 'DOCUMENT', `Uploaded ${docData.title} (${docData.docType})`, newDoc.id);
  };

  const updateDocumentStatus = async (
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    remarks?: string
  ) => {
    const patch = {
      verificationStatus: status,
      verificationRemarks: remarks,
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.email,
    };
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, ...patch } : d)));
    if (firebaseUser) saveDoc(COL.documents, docId, patch);
    logAction('DOCUMENT_VERIFIED', 'DOCUMENT', `Document ${docId} status set to ${status}${remarks ? `: ${remarks}` : ''}`, docId);
  };

  // Check In for current employee
  const clockIn = async (
    workMode: WorkMode,
    location?: AttendanceLocation,
    remarks?: string
  ): Promise<AttendanceRecord> => {
    if (!currentEmployee) throw new Error('No employee active');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const nowIso = today.toISOString();

    // Check if late arrival (after 09:45)
    const [startH, startM] = systemSettings.standardWorkStartTime.split(':').map(Number);
    const scheduledStart = new Date(today);
    scheduledStart.setHours(startH, startM, 0, 0);
    const graceStart = new Date(scheduledStart.getTime() + systemSettings.gracePeriodMinutes * 60000);
    
    let lateArrivalMinutes = 0;
    if (today > graceStart) {
      lateArrivalMinutes = Math.floor((today.getTime() - scheduledStart.getTime()) / 60000);
    }

    let status: AttendanceRecord['status'] = 'PRESENT';
    if (workMode === 'FIELD') status = 'FIELD_WORK';
    else if (workMode === 'WFH') status = 'WFH';
    else if (lateArrivalMinutes > 0) status = 'LATE';

    const newRecord: AttendanceRecord = {
      id: `att-${currentEmployee.id}-${dateStr}`,
      employeeId: currentEmployee.id,
      employeeNumber: currentEmployee.employeeNumber || 'UNASSIGNED',
      employeeName: currentEmployee.fullName,
      userId: currentEmployee.userId || currentUser?.uid,
      date: dateStr,
      workMode,
      checkInTime: nowIso,
      durationMinutes: 0,
      lateArrivalMinutes,
      status,
      checkInLocation: location,
      remarks,
      isCorrected: false,
      correctionAudit: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    if (firebaseUser) saveDoc(COL.attendance, newRecord.id, newRecord);
    logAction(
      'ATTENDANCE_CHECK_IN',
      'ATTENDANCE',
      `Checked in (${workMode}) by ${currentEmployee.fullName}${location?.address ? ` at ${location.address}` : ''}`,
      newRecord.id
    );

    return newRecord;
  };

  // Check Out for current employee
  const clockOut = async (
    location?: AttendanceLocation,
    remarks?: string
  ): Promise<AttendanceRecord> => {
    if (!currentEmployee) throw new Error('No employee active');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const nowIso = today.toISOString();

    let updatedRecord: AttendanceRecord | null = null;

    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId === currentEmployee.id && rec.date === dateStr) {
          const checkIn = new Date(rec.checkInTime);
          const duration = Math.max(1, Math.floor((today.getTime() - checkIn.getTime()) / 60000));
          
          let finalStatus = rec.status;
          if (duration < systemSettings.halfDayDurationMinutes && rec.status === 'PRESENT') {
            finalStatus = 'HALF_DAY';
          }

          updatedRecord = {
            ...rec,
            checkOutTime: nowIso,
            durationMinutes: duration,
            status: finalStatus,
            checkOutLocation: location,
            remarks: remarks || rec.remarks,
            updatedAt: nowIso,
          };
          return updatedRecord;
        }
        return rec;
      })
    );

    if (updatedRecord) {
      if (firebaseUser) saveDoc(COL.attendance, (updatedRecord as AttendanceRecord).id, updatedRecord as AttendanceRecord);
      logAction(
        'ATTENDANCE_CHECK_OUT',
        'ATTENDANCE',
        `Checked out by ${currentEmployee.fullName} (Duration: ${Math.round((updatedRecord as AttendanceRecord).durationMinutes / 60)} hrs)`,
        (updatedRecord as AttendanceRecord).id
      );
      return updatedRecord;
    }
    throw new Error('No active check-in found for today');
  };

  // Correct Attendance record with strict audit requirement
  const correctAttendance = async (
    recordId: string,
    field: string,
    newValue: string,
    reason: string,
    note?: string
  ) => {
    const rec = attendanceRecords.find((r) => r.id === recordId);
    if (!rec) throw new Error('Record not found');

    const originalVal = String((rec as any)[field] ?? '');
    const auditItem = {
      id: `audit-${Date.now()}`,
      fieldModified: field,
      originalValue: originalVal,
      correctedValue: newValue,
      reason,
      supportingNote: note,
      correctedBy: currentUser?.email || 'operator',
      correctedByName: currentUser?.displayName || 'Operator',
      timestamp: new Date().toISOString(),
    };

    const correctionPatch = {
      [field]: newValue,
      isCorrected: true,
      correctionAudit: [auditItem, ...(rec.correctionAudit || [])],
      updatedAt: new Date().toISOString(),
    };
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...correctionPatch } : r))
    );
    if (firebaseUser) saveDoc(COL.attendance, recordId, correctionPatch);

    logAction(
      'ATTENDANCE_CORRECTED',
      'ATTENDANCE',
      `Corrected ${field} on record ${recordId} from "${originalVal}" to "${newValue}". Reason: ${reason}`,
      recordId
    );
  };

  const submitRequest = async (
    reqData: Omit<EmployeeRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'>
  ) => {
    if (!currentEmployee) throw new Error('No employee active');
    const newReq: EmployeeRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      employeeId: currentEmployee.id,
      employeeNumber: currentEmployee.employeeNumber || 'UNASSIGNED',
      employeeName: currentEmployee.fullName,
      userId: currentEmployee.userId || currentUser?.uid || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests((prev) => [newReq, ...prev]);
    if (firebaseUser) saveDoc(COL.requests, newReq.id, newReq);
    logAction('REQUEST_SUBMITTED', 'REQUEST', `Submitted ${reqData.type} request by ${currentEmployee.fullName}`, newReq.id);
  };

  const reviewRequest = async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    comment?: string
  ) => {
    const patch = {
      status,
      approverId: currentUser?.email,
      approverName: currentUser?.displayName,
      approverComment: comment,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...patch } : r)));
    if (firebaseUser) saveDoc(COL.requests, requestId, patch);
    logAction('REQUEST_REVIEWED', 'REQUEST', `Request ${requestId} ${status}${comment ? `: ${comment}` : ''}`, requestId);
  };

  // Salary Structure (SUPER_ADMIN ONLY)
  const saveSalaryStructure = async (
    structure: Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const existingIdx = salaryStructures.findIndex((s) => s.employeeId === structure.employeeId);
    const nowIso = new Date().toISOString();

    if (existingIdx >= 0) {
      const patch = { ...structure, updatedAt: nowIso };
      setSalaryStructures((prev) =>
        prev.map((s, idx) => (idx === existingIdx ? { ...s, ...patch } : s))
      );
      // Firestore doc id is the employeeId itself, per firestore.rules (salary_structures/{employeeId}).
      if (firebaseUser) saveDoc(COL.salaryStructures, structure.employeeId, patch);
    } else {
      const newStruct: SalaryStructure = {
        ...structure,
        id: `sal-${structure.employeeId}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setSalaryStructures((prev) => [newStruct, ...prev]);
      if (firebaseUser) saveDoc(COL.salaryStructures, structure.employeeId, newStruct);
    }
    logAction('SALARY_STRUCTURE_SAVED', 'SALARY', `Saved salary structure for employee ${structure.employeeName}`, structure.employeeId);
  };

  // Payroll Runs (SUPER_ADMIN ONLY)
  const createPayrollRun = async (
    month: number,
    year: number,
    entries: PayrollEntry[]
  ): Promise<PayrollRun> => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const runId = `PR_${year}_${String(month).padStart(2, '0')}`;
    const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const totalGross = entries.reduce((sum, e) => sum + e.grossEarnings, 0);
    const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
    const totalNetPayable = entries.reduce((sum, e) => sum + e.netPayable, 0);
    const totalReimbursements = entries.reduce((sum, e) => sum + (e.reimbursement || 0), 0);
    const totalUnpaidLeaveDeductions = entries.reduce((sum, e) => sum + (e.unpaidLeaveDeduction || 0), 0);
    const totalLateDeductions = entries.reduce((sum, e) => sum + (e.lateArrivalDeduction || 0), 0);
    const totalStatutoryDeductions = entries.reduce(
      (sum, e) => sum + (e.pf || 0) + (e.esi || 0) + (e.tds || 0) + (e.professionalTax || 0),
      0
    );
    const exceptionCount = entries.filter(
      (e) => (e.exceptions && e.exceptions.length > 0) || e.bankVerificationStatus !== 'VERIFIED'
    ).length;

    const newRun: PayrollRun = {
      id: runId,
      month,
      year,
      periodLabel,
      status: 'CALCULATED',
      totalEmployees: entries.length,
      totalGross,
      totalDeductions,
      totalNetPayable,
      totalReimbursements,
      totalUnpaidLeaveDeductions,
      totalLateDeductions,
      totalStatutoryDeductions,
      exceptionCount,
      calculatedAt: new Date().toISOString(),
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPayrollRuns((prev) => [newRun, ...prev.filter((r) => r.id !== runId)]);
    setPayrollEntries((prev) => [...entries, ...prev.filter((e) => e.payrollRunId !== runId)]);
    if (firebaseUser) {
      saveDoc(COL.payrollRuns, runId, newRun);
      entries.forEach((entry) => saveDoc(COL.payrollEntries, entry.id, entry));
    }

    logAction('PAYROLL_CALCULATED', 'PAYROLL', `Calculated payroll for ${periodLabel} (${entries.length} employees, Net: ₹${totalNetPayable})`, runId);
    return newRun;
  };

  const updatePayrollStatus = async (runId: string, status: PayrollRun['status']) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const isLocking = status === 'APPROVED' || status === 'EXPORTED' || status === 'PAID';
    const existingRun = payrollRuns.find((r) => r.id === runId);
    const patch = {
      status,
      locked: isLocking,
      approvedAt: status === 'APPROVED' ? new Date().toISOString() : existingRun?.approvedAt,
      approvedBy: status === 'APPROVED' ? currentUser?.email : existingRun?.approvedBy,
      updatedAt: new Date().toISOString(),
    };
    setPayrollRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, ...patch } : r)));
    if (firebaseUser) saveDoc(COL.payrollRuns, runId, patch);
    logAction('PAYROLL_STATUS_CHANGED', 'PAYROLL', `Payroll run ${runId} status changed to ${status}`, runId);
  };

  const releasePayslips = async (runId: string) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const releasedAt = new Date().toISOString();
    const affectedIds = payrollEntries.filter((e) => e.payrollRunId === runId).map((e) => e.id);
    setPayrollEntries((prev) =>
      prev.map((e) => (e.payrollRunId === runId ? { ...e, payslipReleased: true, releasedAt } : e))
    );
    if (firebaseUser) {
      affectedIds.forEach((entryId) => saveDoc(COL.payrollEntries, entryId, { payslipReleased: true, releasedAt }));
    }
    logAction('PAYSLIPS_RELEASED', 'PAYROLL', `Released employee payslips for payroll run ${runId}`, runId);
  };

  const saveIciciConfig = async (cfg: Partial<IciciBankExportConfig>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const patch = { ...cfg, updatedAt: new Date().toISOString() };
    setIciciConfig((prev) => ({ ...prev, ...patch }));
    if (firebaseUser) saveDoc(BANK_CONFIG_COL, ICICI_DOC_ID, patch);
    logAction('ICICI_CONFIG_SAVED', 'BANK_EXPORT', 'Updated ICICI salary payment configuration');
  };

  const recordBankExport = async (exportItem: IciciBankExportConfig['history'][0]) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const newHistory = [exportItem, ...(iciciConfig.history || [])];
    setIciciConfig((prev) => ({ ...prev, history: newHistory }));
    if (firebaseUser) saveDoc(BANK_CONFIG_COL, ICICI_DOC_ID, { history: newHistory });
    logAction(
      'ICICI_EXPORT_RECORDED',
      'BANK_EXPORT',
      `Exported ICICI bulk salary file ${exportItem.fileName} (${exportItem.totalRows} rows, ₹${exportItem.totalAmount})`,
      exportItem.id
    );
  };

  const addSchool = async (schoolData: Omit<School, 'id' | 'createdAt'>): Promise<School> => {
    if (isEmployee) throw new Error('Unauthorized');
    const newSchool: School = {
      ...schoolData,
      id: `sch-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setSchools((prev) => [newSchool, ...prev]);
    if (firebaseUser) saveDoc(COL.schools, newSchool.id, newSchool);
    logAction('SCHOOL_ADDED', 'SCHOOL', `Added school partner record: ${newSchool.name}`, newSchool.id);
    return newSchool;
  };

  const updateSchool = async (id: string, updates: Partial<School>): Promise<void> => {
    if (isEmployee) throw new Error('Unauthorized');
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    if (firebaseUser) saveDoc(COL.schools, id, updates);
    logAction('SCHOOL_UPDATED', 'SCHOOL', `Updated school record`, id);
  };

  const submitExpense = async (
    claimData: Omit<
      ExpenseClaim,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'totalAmount' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'
    >
  ): Promise<ExpenseClaim> => {
    const emp = currentEmployee;
    const totalAmount = claimData.transportLegs.reduce((sum, leg) => sum + (Number(leg.amount) || 0), 0);
    const nextSeq = expenses.length + 1;
    const newClaim: ExpenseClaim = {
      ...claimData,
      id: `EXP-2026-${String(nextSeq).padStart(4, '0')}`,
      employeeId: emp?.id || 'emp-sanjeet',
      employeeNumber: emp?.employeeNumber || 'EMP-2026-0005',
      employeeName: emp?.fullName || currentUser?.displayName || 'SANJEET SINGH',
      userId: currentUser?.uid,
      totalAmount,
      status: 'SUBMITTED',
      paymentStatus: 'PENDING_PAYMENT',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newClaim, ...prev]);
    if (firebaseUser) saveDoc(COL.expenses, newClaim.id, newClaim);
    logAction(
      'EXPENSE_SUBMITTED',
      'EXPENSE',
      `Submitted expense claim ${newClaim.id} for ₹${totalAmount} (${newClaim.schoolName})`,
      newClaim.id
    );
    return newClaim;
  };

  const saveExpenseDraft = async (
    claimData: Omit<
      ExpenseClaim,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'totalAmount' | 'employeeId' | 'employeeNumber' | 'employeeName' | 'userId'
    >
  ): Promise<ExpenseClaim> => {
    const emp = currentEmployee;
    const totalAmount = claimData.transportLegs.reduce((sum, leg) => sum + (Number(leg.amount) || 0), 0);
    const nextSeq = expenses.length + 1;
    const draftClaim: ExpenseClaim = {
      ...claimData,
      id: `EXP-2026-${String(nextSeq).padStart(4, '0')}`,
      employeeId: emp?.id || 'emp-sanjeet',
      employeeNumber: emp?.employeeNumber || 'EMP-2026-0005',
      employeeName: emp?.fullName || currentUser?.displayName || 'SANJEET SINGH',
      userId: currentUser?.uid,
      totalAmount,
      status: 'DRAFT',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses((prev) => [draftClaim, ...prev]);
    if (firebaseUser) saveDoc(COL.expenses, draftClaim.id, draftClaim);
    logAction('EXPENSE_DRAFT_SAVED', 'EXPENSE', `Saved expense claim draft ${draftClaim.id}`, draftClaim.id);
    return draftClaim;
  };

  const reviewExpense = async (
    expenseId: string,
    status: 'APPROVED' | 'REJECTED',
    comments?: string
  ): Promise<void> => {
    if (isEmployee) throw new Error('Unauthorized');
    const patch = {
      status,
      paymentStatus: status === 'APPROVED' ? 'PENDING_PAYMENT' as const : 'UNPAID' as const,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.email || 'operator@funscholar.com',
      reviewerComments: comments,
      updatedAt: new Date().toISOString(),
    };
    setExpenses((prev) => prev.map((c) => (c.id === expenseId ? { ...c, ...patch } : c)));
    if (firebaseUser) saveDoc(COL.expenses, expenseId, patch);
    logAction(
      status === 'APPROVED' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
      'EXPENSE',
      `${status} expense claim ${expenseId}${comments ? `: ${comments}` : ''}`,
      expenseId
    );
  };

  const markExpensePaid = async (expenseId: string, paymentRef?: string): Promise<void> => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const patch = {
      paymentStatus: 'PAID' as const,
      paidAt: new Date().toISOString(),
      paidBy: currentUser?.email || 'info@funscholar.com',
      paymentReference: paymentRef || `ICICI-REF-${Date.now().toString(36).toUpperCase()}`,
      updatedAt: new Date().toISOString(),
    };
    setExpenses((prev) => prev.map((c) => (c.id === expenseId ? { ...c, ...patch } : c)));
    if (firebaseUser) saveDoc(COL.expenses, expenseId, patch);
    logAction('EXPENSE_PAID', 'EXPENSE', `Marked expense claim ${expenseId} as PAID`, expenseId);
  };

  const updateIciciTxtConfig = async (cfg: Partial<IciciTxtBatchConfig>): Promise<void> => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setIciciTxtConfig((prev) => ({ ...prev, ...cfg }));
    if (firebaseUser) saveDoc(BANK_CONFIG_COL, ICICI_TXT_DOC_ID, cfg);
    logAction('ICICI_TXT_CONFIG_UPDATED', 'BANK_EXPORT', 'Updated ICICI CIB TXT batch configuration');
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setSystemSettings((prev) => ({ ...prev, ...newSettings }));
    if (firebaseUser) saveDoc(SETTINGS_COL, SETTINGS_DOC_ID, newSettings);
    logAction('SETTINGS_UPDATED', 'SETTINGS', 'System & Attendance settings updated');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isDbConnected,
        authReady,
        activeRole,
        isSuperAdmin,
        isDataOperator,
        isEmployee,
        currentEmployee,
        pendingAccounts,
        currentPendingAccount,
        createEmployeeLogin,
        completePasswordChange,
        markOnboardingSubmitted,
        switchRole,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        employees,
        documents,
        attendanceRecords,
        requests,
        salaryStructures: isSuperAdmin ? salaryStructures : [], // Strict isolation from Data Operator & Employee
        payrollRuns: isSuperAdmin ? payrollRuns : [],           // Strict isolation
        payrollEntries,
        iciciConfig,
        systemSettings,
        auditLogs: isSuperAdmin ? auditLogs : [],               // Strict audit log viewing for Super Admin
        schools,
        expenses,
        iciciTxtConfig,
        addSchool,
        updateSchool,
        submitExpense,
        saveExpenseDraft,
        reviewExpense,
        markExpensePaid,
        updateIciciTxtConfig,
        addEmployee,
        updateEmployee,
        updateEmployeeBankDetails,
        verifyEmployeeBankDetails,
        approveOnboarding,
        uploadDocument,
        updateDocumentStatus,
        clockIn,
        clockOut,
        correctAttendance,
        submitRequest,
        reviewRequest,
        saveSalaryStructure,
        createPayrollRun,
        updatePayrollStatus,
        releasePayslips,
        saveIciciConfig,
        recordBankExport,
        updateSystemSettings,
        logAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
