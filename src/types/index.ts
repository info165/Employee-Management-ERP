/**
 * Staff Management & Payroll Portal - Core Data Models
 */

export type UserRole = 'SUPER_ADMIN' | 'DATA_OPERATOR' | 'EMPLOYEE';

export type WorkMode = 'OFFICE' | 'WFH' | 'FIELD';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'LATE'
  | 'LEAVE'
  | 'WFH'
  | 'FIELD_WORK'
  | 'HOLIDAY'
  | 'WEEKLY_OFF'
  | 'INCOMPLETE';

export type OnboardingStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'APPROVED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'INACTIVE';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PHOTOGRAPH'
  | 'CANCELLED_CHEQUE'
  | 'EDUCATION'
  | 'ADDRESS_PROOF'
  | 'EXPERIENCE'
  | 'OFFER_LETTER'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type RequestType =
  | 'WFH'
  | 'CASUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'ATTENDANCE_CORRECTION'
  | 'MISSED_PUNCH';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PayrollRunStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'EXPORTED'
  | 'PAID';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  employeeNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  userId?: string;
  docType: DocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;
  maskedIdentifier?: string; // e.g. Aadhaar XXXX-XXXX-4589, PAN ABCDE****F
  verificationStatus: VerificationStatus;
  verificationRemarks?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Employee {
  id: string;
  employeeNumber?: string; // e.g. EMP-2026-0001
  userId?: string; // linked Firebase Auth UID
  fullName: string;
  email: string;
  mobile: string;
  dob?: string;
  photoUrl?: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Employment details
  department: string;
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: string;
  workLocation: string;
  reportingManager: string;
  assignedWorkMode: WorkMode;
  standardWorkingHours: number; // default 8 or 9
  weeklyOff: string[]; // e.g. ['Sunday']
  probationMonths?: number;
  employmentStatus: EmploymentStatus;
  
  // Onboarding workflow
  onboardingStatus: OnboardingStatus;
  rejectionRemarks?: string;
  accountActivated: boolean;
  
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AttendanceLocation {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  address?: string;
  flagLowAccuracy?: boolean;
  flagLocationDenied?: boolean;
}

export interface CorrectionAuditItem {
  id: string;
  fieldModified: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
  supportingNote?: string;
  correctedBy: string;
  correctedByName: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  workMode: WorkMode;
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  durationMinutes: number;
  lateArrivalMinutes: number;
  status: AttendanceStatus;
  checkInLocation?: AttendanceLocation;
  checkOutLocation?: AttendanceLocation;
  remarks?: string;
  isCorrected: boolean;
  correctionAudit: CorrectionAuditItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRequest {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  userId: string;
  type: RequestType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  details?: {
    proposedCheckIn?: string;
    proposedCheckOut?: string;
    targetAttendanceDate?: string;
  };
  status: RequestStatus;
  approverId?: string;
  approverName?: string;
  approverComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;
  
  // Earnings (Monthly in INR)
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherEarnings: number;
  
  // Statutory and deductions
  pfApplicable: boolean;
  pfDeduction: number;
  esiApplicable: boolean;
  esiDeduction: number;
  tdsDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  
  // Bank Details for Salary disbursement
  bankName: string;
  bankAccountNumber: string; // masked in UI for non-superadmin
  bankIfsc: string;
  accountHolderName: string;
  
  grossSalary: number;
  netSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  designation: string;
  department: string;
  userId?: string;
  month: number; // 1-12
  year: number;
  
  totalMonthDays: number;
  payableDays: number;
  presentDays: number;
  wfhDays: number;
  fieldDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffsAndHolidays: number;
  
  // Earnings
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medical: number;
  bonus: number;
  reimbursement: number;
  otherEarnings: number;
  grossEarnings: number;
  
  // Deductions
  unpaidLeaveDeduction: number;
  lateArrivalDeduction: number; // 0 by default until policy activated
  pf: number;
  esi: number;
  tds: number;
  professionalTax: number;
  advanceRecovery: number;
  otherDeductions: number;
  totalDeductions: number;
  
  netPayable: number;
  
  // Bank details
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  accountHolderName: string;
  
  payslipReleased: boolean;
  releasedAt?: string;
  paymentStatus: 'PENDING' | 'PROCESSED' | 'PAID';
  createdAt: string;
}

export interface PayrollRun {
  id: string; // PR_2026_09
  month: number;
  year: number;
  periodLabel: string; // e.g. September 2026
  status: PayrollRunStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPayable: number;
  calculatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IciciBankExportConfig {
  id: string;
  clientCode: string;
  debitAccountNumber: string;
  productCode: string; // default: SALPAY
  fileFormat: 'CSV' | 'PIPE_DELIMITED' | 'FIXED_WIDTH';
  includeHeader: boolean;
  includeFooter: boolean;
  isConfigured: boolean;
  updatedAt: string;
  history: Array<{
    id: string;
    timestamp: string;
    fileName: string;
    payrollPeriod: string;
    totalRows: number;
    totalAmount: number;
    exportedBy: string;
  }>;
}

export interface SystemSettings {
  companyName: string;
  companyLogoUrl?: string;
  companyAddress: string;
  employeeNumberPrefix: string; // 'EMP'
  employeeNumberSequence: number;
  
  // Attendance policy
  standardWorkStartTime: string; // '09:30'
  standardWorkEndTime: string; // '18:30'
  gracePeriodMinutes: number; // 15
  halfDayDurationMinutes: number; // 240
  fullDayDurationMinutes: number; // 480
  
  // Office Geofence
  officeLatitude: number;
  officeLongitude: number;
  officeGeofenceRadiusMeters: number; // 200
  officeAddress: string;
  
  // Salary policies
  unpaidLeaveDeductionEnabled: boolean; // default: true
  lateArrivalDeductionEnabled: boolean; // MUST be false by default
  lateDeductionThresholdMinutes: number;
  includeApprovedReimbursementsInPayroll?: boolean; // default: false
  
  holidays: Array<{ date: string; name: string }>;
  weeklyOffDays: string[]; // ['Sunday']
}

export interface School {
  id: string;
  name: string;
  category: string; // e.g. "Class", "Lab", "Institution"
  city: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export type TransportMode =
  | 'Own Vehicle'
  | 'Bus'
  | 'Train'
  | 'Taxi/Cab'
  | 'Auto'
  | 'Metro'
  | 'Other';

export interface TransportLeg {
  id: string;
  mode: TransportMode;
  amount: number;
  receiptName?: string;
  receiptUrl?: string;
  notes?: string;
}

export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type ExpensePaymentStatus = 'UNPAID' | 'PENDING_PAYMENT' | 'PAID';

export interface ExpenseClaim {
  id: string; // e.g. EXP-2026-0001
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  userId?: string;
  schoolId: string;
  schoolName: string;
  schoolCategory?: string;
  visitDate: string; // YYYY-MM-DD
  purposeOfVisit: string;
  notes?: string;
  transportLegs: TransportLeg[];
  totalAmount: number;
  status: ExpenseStatus;
  paymentStatus: ExpensePaymentStatus;
  receiptUrls?: string[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerComments?: string;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IciciTxtBatchConfig {
  corporateId: string; // e.g. FUNSCHOL03072019
  debitAccountNumber: string; // 12-digit, e.g. 627505030081
  externalReference: string; // e.g. Cut-off
  transactionDate: string; // YYYY-MM-DD
  batchRemarks: string; // Max 30 chars, e.g. Salary Payment for September
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  dateFormatConfirmed: boolean;
}

export interface AuditLog {
  id: string;
  actingUserId: string;
  actingUserName: string;
  actingUserRole: UserRole;
  action: string;
  targetType: string; // 'EMPLOYEE' | 'ATTENDANCE' | 'PAYROLL' | 'BANK_EXPORT' | 'SETTINGS'
  targetId?: string;
  outcome: 'SUCCESS' | 'FAILURE';
  summary: string;
  timestamp: string;
}
