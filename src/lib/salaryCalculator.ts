import {
  SalaryStructure,
  AttendanceRecord,
  PayrollEntry,
  SystemSettings,
  Employee,
  ExpenseClaim,
} from '../types';

export interface CalculationInput {
  employee: Employee;
  month: number;
  year: number;
  salaryStructure: SalaryStructure;
  attendanceRecords: AttendanceRecord[];
  bonus?: number;
  approvedExpenses?: ExpenseClaim[];
  reimbursement?: number;
  advanceRecovery?: number;
  settings: SystemSettings;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function calculateEmployeePayroll(input: CalculationInput): PayrollEntry {
  const {
    employee,
    month,
    year,
    salaryStructure: sal,
    attendanceRecords,
    bonus = 0,
    approvedExpenses = [],
    advanceRecovery = 0,
    settings,
  } = input;

  const exceptions: string[] = [];

  // Total calendar days in the selected month
  const totalMonthDays = new Date(year, month, 0).getDate();

  // Calculate calendar scheduled working days (excluding configured holidays and weekly offs)
  let scheduledWorkingDays = 0;
  let weeklyOffsAndHolidays = 0;

  for (let day = 1; day <= totalMonthDays; day++) {
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = (settings.holidays || []).some((h) => h.date === dateStr);
    const isWeeklyOff = (settings.weeklyOffDays || ['Sunday']).includes(dayName);

    if (isHoliday || isWeeklyOff) {
      weeklyOffsAndHolidays++;
    } else {
      scheduledWorkingDays++;
    }
  }

  // Proration denominator based on Super Admin configured policy
  const prorationMethod = settings.salaryProrationMethod || 'CALENDAR_DAYS';
  const payableDaysDenominator =
    prorationMethod === 'SCHEDULED_WORKING_DAYS'
      ? Math.max(1, scheduledWorkingDays)
      : totalMonthDays;

  // Filter attendance records for this employee and period
  const monthRecords = attendanceRecords.filter((rec) => {
    if (rec.employeeId !== employee.id && rec.employeeNumber !== employee.employeeNumber) {
      return false;
    }
    const d = new Date(rec.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  let presentDays = 0;
  let wfhDays = 0;
  let fieldDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let lateArrivalCount = 0;
  let totalLateMinutes = 0;

  monthRecords.forEach((r) => {
    // Treat approved field work, WFH, and office consistently
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
    } else if (r.status === 'INCOMPLETE') {
      // Incomplete punch: flag exception rather than blind absence deduction
      exceptions.push(`Incomplete punch recorded on ${r.date} (check-out missing)`);
    }

    if (r.lateArrivalMinutes > 0) {
      lateArrivalCount++;
      totalLateMinutes += r.lateArrivalMinutes;
    }
  });

  // Check date of joining & leaving proration
  let activeCalendarDaysInMonth = totalMonthDays;
  if (employee.dateOfJoining) {
    const joinDate = new Date(employee.dateOfJoining);
    if (joinDate.getFullYear() === year && joinDate.getMonth() + 1 === month) {
      const joinDay = joinDate.getDate();
      activeCalendarDaysInMonth = totalMonthDays - joinDay + 1;
      exceptions.push(`Joined mid-month on ${employee.dateOfJoining} (${activeCalendarDaysInMonth} active days)`);
    } else if (joinDate > new Date(year, month - 1, totalMonthDays)) {
      exceptions.push(`Employee joining date ${employee.dateOfJoining} is after this payroll period`);
      activeCalendarDaysInMonth = 0;
    }
  }

  if (employee.dateOfLeaving) {
    const leaveDate = new Date(employee.dateOfLeaving);
    if (leaveDate.getFullYear() === year && leaveDate.getMonth() + 1 === month) {
      const leaveDay = leaveDate.getDate();
      activeCalendarDaysInMonth = Math.min(activeCalendarDaysInMonth, leaveDay);
      exceptions.push(`Relieved on ${employee.dateOfLeaving}`);
    }
  }

  // Calculate payable days: active recorded days or standard month minus recorded unpaid leaves
  let payableDays = Math.max(0, activeCalendarDaysInMonth - unpaidLeaveDays);

  if (prorationMethod === 'SCHEDULED_WORKING_DAYS') {
    payableDays = Math.max(0, scheduledWorkingDays - unpaidLeaveDays);
  }

  if (payableDays === 0) {
    exceptions.push('Zero payable days calculated for this period');
  }

  // Divisor for per-day deduction
  const unpaidLeaveBaseDivisor =
    settings.unpaidLeaveBase === 'SCHEDULED_WORKING_DAYS'
      ? Math.max(1, scheduledWorkingDays)
      : totalMonthDays;

  const perDaySalary = sal.grossSalary / unpaidLeaveBaseDivisor;

  // Unpaid leave deduction (only if policy is enabled)
  const unpaidLeaveDeduction = settings.unpaidLeaveDeductionEnabled
    ? Math.round(unpaidLeaveDays * perDaySalary)
    : 0;

  // Late arrival deduction: STRICTLY 0 by default until policy is activated
  let lateArrivalDeduction = 0;
  const latePolicy = settings.lateDeductionPolicy;

  if (settings.lateArrivalDeductionEnabled && latePolicy?.enabled) {
    if (latePolicy.ruleType === 'OCCURRENCES' || latePolicy.ruleType === 'OCCURRENCE_TIER') {
      const allowedCount = latePolicy.graceLateCountAllowed ?? latePolicy.thresholdMinutesOrCount ?? 3;
      const amountPerOcc = latePolicy.deductionAmountPerOccurrence ?? latePolicy.ratePerUnit ?? 150;
      const chargeableOccurrences = Math.max(0, lateArrivalCount - allowedCount);
      lateArrivalDeduction = Math.round(chargeableOccurrences * amountPerOcc);
    } else if (latePolicy.ruleType === 'PER_MINUTE') {
      const allowedMinutes = latePolicy.thresholdMinutesOrCount ?? 15;
      const ratePerMin = latePolicy.deductionRatePerMinute ?? latePolicy.ratePerUnit ?? 5;
      const chargeableMinutes = Math.max(0, totalLateMinutes - allowedMinutes);
      lateArrivalDeduction = Math.round(chargeableMinutes * ratePerMin);
    } else if (latePolicy.ruleType === 'PER_HOUR') {
      const threshold = settings.lateDeductionThresholdMinutes || 30;
      if (totalLateMinutes > threshold) {
        const penaltyHours = Math.floor((totalLateMinutes - threshold) / 60);
        const perHourSalary = perDaySalary / (employee.standardWorkingHours || 8);
        lateArrivalDeduction = Math.round(penaltyHours * perHourSalary);
      }
    } else if (latePolicy.ruleType === 'HALF_DAY_PENALTY') {
      const penaltyInterval = latePolicy.graceLateCountAllowed ?? 3;
      const halfDaysDeducted = Math.floor(lateArrivalCount / Math.max(1, penaltyInterval));
      lateArrivalDeduction = Math.round(halfDaysDeducted * (perDaySalary / 2));
    }
  }

  // Travel expense reimbursement integration
  const matchedExpenses = approvedExpenses.filter((exp) => {
    return (
      (exp.employeeId === employee.id || exp.employeeNumber === employee.employeeNumber) &&
      exp.status === 'APPROVED' &&
      exp.paymentStatus !== 'PAID'
    );
  });

  const reimbursement = settings.includeApprovedReimbursementsInPayroll !== false
    ? (input.reimbursement !== undefined
        ? input.reimbursement
        : matchedExpenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0))
    : 0;

  const reimbursementClaimIds = matchedExpenses.map((exp) => exp.id);

  // Earnings calculation
  const basic = sal.basicSalary;
  const hra = sal.hra;
  const specialAllowance = sal.specialAllowance;
  const conveyance = sal.conveyanceAllowance;
  const medical = sal.medicalAllowance;
  const otherEarnings = sal.otherEarnings;

  const grossEarnings =
    basic + hra + specialAllowance + conveyance + medical + otherEarnings + bonus + reimbursement;

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

  // Beneficiary banking validation
  const bankAcc = (sal.bankAccountNumber || employee.bankDetails?.bankAccountNumber || '').trim();
  const bankIfsc = (sal.bankIfsc || employee.bankDetails?.bankIfsc || '').trim().toUpperCase();
  const bankName = sal.bankName || employee.bankDetails?.bankName || 'ICICI Bank';
  const accountHolderName = sal.accountHolderName || employee.bankDetails?.accountHolderName || employee.fullName;

  const isWib = bankIfsc.startsWith('ICIC');
  const transactionRoute: 'WIB' | 'NEFT' =
    employee.bankDetails?.transactionRoute || (isWib ? 'WIB' : 'NEFT');

  if (!bankAcc || bankAcc.length < 8) {
    exceptions.push('Missing or invalid bank account number');
  }
  if (!bankIfsc || !IFSC_REGEX.test(bankIfsc)) {
    exceptions.push(`Invalid IFSC code (${bankIfsc})`);
  }
  if (employee.bankDetails && employee.bankDetails.verificationStatus !== 'VERIFIED') {
    exceptions.push('Bank account verification status is PENDING/UNVERIFIED');
  }

  // Construct audit formula explanation
  const calculationFormula = `Gross ₹${grossEarnings.toLocaleString('en-IN')} (Basic ₹${basic} + HRA ₹${hra} + Allowances ₹${specialAllowance + conveyance + medical} + Reimbursement ₹${reimbursement} [${reimbursementClaimIds.length} claims]) - Deductions ₹${totalDeductions.toLocaleString('en-IN')} (Unpaid Leave ₹${unpaidLeaveDeduction} [${unpaidLeaveDays}d] + Late ₹${lateArrivalDeduction} [${lateArrivalCount} late] + Statutory ₹${pf + esi + tds + pt}) = Net ₹${netPayable.toLocaleString('en-IN')}`;

  return {
    id: `pe-${year}-${String(month).padStart(2, '0')}-${employee.id}`,
    payrollRunId: `PR_${year}_${String(month).padStart(2, '0')}`,
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber || sal.employeeNumber,
    employeeName: employee.fullName || sal.employeeName,
    designation: employee.designation,
    department: employee.department,
    userId: employee.userId,
    month,
    year,
    totalMonthDays,
    payableDays,
    payableDaysDenominator,
    presentDays,
    wfhDays,
    fieldDays,
    paidLeaveDays,
    unpaidLeaveDays,
    weeklyOffsAndHolidays,
    lateArrivalCount,
    lateArrivalMinutes: totalLateMinutes,
    basic,
    hra,
    specialAllowance,
    conveyance,
    medical,
    bonus,
    reimbursement,
    reimbursementClaimIds,
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
    bankName,
    bankAccountNumber: bankAcc,
    bankIfsc,
    accountHolderName,
    transactionRoute,
    bankVerificationStatus: employee.bankDetails?.verificationStatus || 'VERIFIED',
    exceptions,
    calculationFormula,
    calculationTimestamp: new Date().toISOString(),
    payslipReleased: false,
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}
