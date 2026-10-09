import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  Employee,
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
} from '../lib/seedData';
import { auth, db, testConnection } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  activeRole: UserRole;
  isSuperAdmin: boolean;
  isDataOperator: boolean;
  isEmployee: boolean;
  currentEmployee: Employee | null;
  
  // Role switching for rapid evaluation & testing
  switchRole: (role: UserRole, targetEmployeeId?: string) => void;
  signInWithGoogle: () => Promise<void>;
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

  // Mutators
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'accountActivated'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  approveOnboarding: (id: string, customNumber?: string) => Promise<{ employeeNumber: string }>;
  uploadDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => Promise<void>;
  updateDocumentStatus: (docId: string, status: 'VERIFIED' | 'REJECTED', remarks?: string) => Promise<void>;
  
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

  // Test Firestore on boot per Firebase guidelines
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
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
    });

    return () => unsubscribe();
  }, []);

  const isSuperAdmin = activeRole === 'SUPER_ADMIN';
  const isDataOperator = activeRole === 'DATA_OPERATOR';
  const isEmployee = activeRole === 'EMPLOYEE';

  const currentEmployee = employees.find((e) => e.id === activeEmployeeId) || employees[0] || null;

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

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      switchRole('SUPER_ADMIN');
      logAction('USER_LOGOUT', 'AUTH', 'User signed out');
    } catch (err) {
      console.error('Sign out error:', err);
    }
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
    logAction('EMPLOYEE_ONBOARD_SUBMITTED', 'EMPLOYEE', `New employee onboarding record created for ${newEmp.fullName}`, id);
    return newEmp;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    );
    logAction('EMPLOYEE_UPDATED', 'EMPLOYEE', `Employee record ${id} modified`, id);
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

    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            employeeNumber: generatedNumber,
            onboardingStatus: 'APPROVED',
            employmentStatus: 'ACTIVE',
            accountActivated: true,
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser?.email || 'info@funscholar.com',
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      })
    );

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
    logAction('DOCUMENT_UPLOADED', 'DOCUMENT', `Uploaded ${docData.title} (${docData.docType})`, newDoc.id);
  };

  const updateDocumentStatus = async (
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    remarks?: string
  ) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              verificationStatus: status,
              verificationRemarks: remarks,
              verifiedAt: new Date().toISOString(),
              verifiedBy: currentUser?.email,
            }
          : d
      )
    );
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

    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            [field]: newValue,
            isCorrected: true,
            correctionAudit: [auditItem, ...(r.correctionAudit || [])],
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

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
    logAction('REQUEST_SUBMITTED', 'REQUEST', `Submitted ${reqData.type} request by ${currentEmployee.fullName}`, newReq.id);
  };

  const reviewRequest = async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    comment?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              approverId: currentUser?.email,
              approverName: currentUser?.displayName,
              approverComment: comment,
              reviewedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
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
      setSalaryStructures((prev) =>
        prev.map((s, idx) =>
          idx === existingIdx
            ? { ...s, ...structure, updatedAt: nowIso }
            : s
        )
      );
    } else {
      const newStruct: SalaryStructure = {
        ...structure,
        id: `sal-${structure.employeeId}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setSalaryStructures((prev) => [newStruct, ...prev]);
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
      calculatedAt: new Date().toISOString(),
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPayrollRuns((prev) => [newRun, ...prev.filter((r) => r.id !== runId)]);
    setPayrollEntries((prev) => [...entries, ...prev.filter((e) => e.payrollRunId !== runId)]);

    logAction('PAYROLL_CALCULATED', 'PAYROLL', `Calculated payroll for ${periodLabel} (${entries.length} employees, Net: ₹${totalNetPayable})`, runId);
    return newRun;
  };

  const updatePayrollStatus = async (runId: string, status: PayrollRun['status']) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const isLocking = status === 'APPROVED' || status === 'EXPORTED' || status === 'PAID';
    setPayrollRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              status,
              locked: isLocking,
              approvedAt: status === 'APPROVED' ? new Date().toISOString() : r.approvedAt,
              approvedBy: status === 'APPROVED' ? currentUser?.email : r.approvedBy,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    logAction('PAYROLL_STATUS_CHANGED', 'PAYROLL', `Payroll run ${runId} status changed to ${status}`, runId);
  };

  const releasePayslips = async (runId: string) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setPayrollEntries((prev) =>
      prev.map((e) =>
        e.payrollRunId === runId
          ? { ...e, payslipReleased: true, releasedAt: new Date().toISOString() }
          : e
      )
    );
    logAction('PAYSLIPS_RELEASED', 'PAYROLL', `Released employee payslips for payroll run ${runId}`, runId);
  };

  const saveIciciConfig = async (cfg: Partial<IciciBankExportConfig>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setIciciConfig((prev) => ({
      ...prev,
      ...cfg,
      updatedAt: new Date().toISOString(),
    }));
    logAction('ICICI_CONFIG_SAVED', 'BANK_EXPORT', 'Updated ICICI salary payment configuration');
  };

  const recordBankExport = async (exportItem: IciciBankExportConfig['history'][0]) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setIciciConfig((prev) => ({
      ...prev,
      history: [exportItem, ...(prev.history || [])],
    }));
    logAction(
      'ICICI_EXPORT_RECORDED',
      'BANK_EXPORT',
      `Exported ICICI bulk salary file ${exportItem.fileName} (${exportItem.totalRows} rows, ₹${exportItem.totalAmount})`,
      exportItem.id
    );
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setSystemSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
    logAction('SETTINGS_UPDATED', 'SETTINGS', 'System & Attendance settings updated');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        activeRole,
        isSuperAdmin,
        isDataOperator,
        isEmployee,
        currentEmployee,
        switchRole,
        signInWithGoogle,
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
        addEmployee,
        updateEmployee,
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
