import {
  SalaryStructure,
  AttendanceRecord,
  PayrollEntry,
  SystemSettings,
} from '../types';

export interface CalculationInput {
  employeeId: string;
  month: number;
  year: number;
  salaryStructure: SalaryStructure;
  attendanceRecords: AttendanceRecord[];
  bonus?: number;
  reimbursement?: number;
  advanceRecovery?: number;
  settings: SystemSettings;
}

export function calculateEmployeePayroll(input: CalculationInput): PayrollEntry {
  const {
    employeeId,
    month,
    year,
    salaryStructure: sal,
    attendanceRecords,
    bonus = 0,
    reimbursement = 0,
    advanceRecovery = 0,
    settings,
  } = input;

  // Days in month
  const totalMonthDays = new Date(year, month, 0).getDate();

  // Analyze attendance for this month
  const monthRecords = attendanceRecords.filter((rec) => {
    if (rec.employeeId !== employeeId) return false;
    const d = new Date(rec.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  let presentDays = 0;
  let wfhDays = 0;
  let fieldDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let totalLateMinutes = 0;

  monthRecords.forEach((r) => {
    if (r.workMode === 'FIELD' || r.status === 'FIELD_WORK') {
      fieldDays++;
    } else if (r.workMode === 'WFH' || r.status === 'WFH') {
      wfhDays++;
    } else if (r.status === 'PRESENT') {
      presentDays++;
    } else if (r.status === 'HALF_DAY') {
      presentDays += 0.5;
      unpaidLeaveDays += 0.5;
    } else if (r.status === 'LEAVE') {
      paidLeaveDays++;
    } else if (r.status === 'ABSENT') {
      unpaidLeaveDays++;
    }

    if (r.lateArrivalMinutes > 0) {
      totalLateMinutes += r.lateArrivalMinutes;
    }
  });

  // Calculate weekly offs and holidays
  let weeklyOffsAndHolidays = 0;
  for (let day = 1; day <= totalMonthDays; day++) {
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = settings.holidays.some((h) => h.date === dateStr);
    const isWeeklyOff = settings.weeklyOffDays.includes(dayName);

    if (isHoliday || isWeeklyOff) {
      weeklyOffsAndHolidays++;
    }
  }

  // Work recorded days
  const activeWorkedDays = presentDays + wfhDays + fieldDays + paidLeaveDays;
  // If month records are partial (e.g. current month in progress), default payable to standard month minus explicit unpaid leave
  const payableDays = Math.max(0, totalMonthDays - unpaidLeaveDays);

  // Pro-rata factor for unpaid leave deductions
  const perDaySalary = sal.grossSalary / totalMonthDays;
  
  // Unpaid leave deduction (only if policy is enabled)
  const unpaidLeaveDeduction = settings.unpaidLeaveDeductionEnabled
    ? Math.round(unpaidLeaveDays * perDaySalary)
    : 0;

  // Late arrival deduction: STRICTLY 0 by default until policy is activated
  let lateArrivalDeduction = 0;
  if (
    settings.lateArrivalDeductionEnabled &&
    totalLateMinutes > settings.lateDeductionThresholdMinutes
  ) {
    const penaltyHours = Math.floor(
      (totalLateMinutes - settings.lateDeductionThresholdMinutes) / 60
    );
    const perHourSalary = perDaySalary / 8;
    lateArrivalDeduction = Math.round(penaltyHours * perHourSalary);
  }

  // Earnings breakdown
  const basic = sal.basicSalary;
  const hra = sal.hra;
  const specialAllowance = sal.specialAllowance;
  const conveyance = sal.conveyanceAllowance;
  const medical = sal.medicalAllowance;
  const otherEarnings = sal.otherEarnings;

  const grossEarnings = basic + hra + specialAllowance + conveyance + medical + otherEarnings + bonus + reimbursement;

  // Deductions breakdown
  const pf = sal.pfApplicable ? sal.pfDeduction : 0;
  const esi = sal.esiApplicable ? sal.esiDeduction : 0;
  const tds = sal.tdsDeduction;
  const pt = sal.professionalTax;
  const otherDeductions = sal.otherDeductions;

  const totalDeductions =
    unpaidLeaveDeduction +
    lateArrivalDeduction +
    pf +
    esi +
    tds +
    pt +
    advanceRecovery +
    otherDeductions;

  const netPayable = Math.max(0, grossEarnings - totalDeductions);

  return {
    id: `pe-${year}-${String(month).padStart(2, '0')}-${sal.employeeId}`,
    payrollRunId: `PR_${year}_${String(month).padStart(2, '0')}`,
    employeeId: sal.employeeId,
    employeeNumber: sal.employeeNumber,
    employeeName: sal.employeeName,
    designation: '',
    department: '',
    month,
    year,
    totalMonthDays,
    payableDays,
    presentDays,
    wfhDays,
    fieldDays,
    paidLeaveDays,
    unpaidLeaveDays,
    weeklyOffsAndHolidays,
    basic,
    hra,
    specialAllowance,
    conveyance,
    medical,
    bonus,
    reimbursement,
    otherEarnings,
    grossEarnings,
    unpaidLeaveDeduction,
    lateArrivalDeduction,
    pf,
    esi,
    tds,
    professionalTax: pt,
    advanceRecovery,
    otherDeductions,
    totalDeductions,
    netPayable,
    bankName: sal.bankName,
    bankAccountNumber: sal.bankAccountNumber,
    bankIfsc: sal.bankIfsc,
    accountHolderName: sal.accountHolderName,
    payslipReleased: false,
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}
