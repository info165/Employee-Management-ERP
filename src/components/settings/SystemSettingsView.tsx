import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, SalaryProrationMethod, LateDeductionRuleType } from '../../types';
import {
  Settings,
  Save,
  Building2,
  Clock,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Landmark,
  CheckCircle2,
  Sliders,
  CalendarCheck,
  FileText,
  BadgeAlert,
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, updateIciciTxtConfig, iciciTxtConfig, isSuperAdmin } = useAuth();

  // Tab navigation within Settings
  const [activeTab, setActiveTab] = useState<'rules' | 'late' | 'bank' | 'company'>('rules');

  // Corporate Profile
  const [companyName, setCompanyName] = useState(systemSettings.companyName);
  const [companyAddress, setCompanyAddress] = useState(systemSettings.companyAddress);
  const [employeeNumberPrefix, setEmployeeNumberPrefix] = useState(systemSettings.employeeNumberPrefix);

  // Office & Geofence
  const [standardWorkStartTime, setStandardWorkStartTime] = useState(systemSettings.standardWorkStartTime || '09:30');
  const [standardWorkEndTime, setStandardWorkEndTime] = useState(systemSettings.standardWorkEndTime || '18:30');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(systemSettings.gracePeriodMinutes ?? 15);
  const [officeLatitude, setOfficeLatitude] = useState(systemSettings.officeLatitude);
  const [officeLongitude, setOfficeLongitude] = useState(systemSettings.officeLongitude);
  const [officeGeofenceRadiusMeters, setOfficeGeofenceRadiusMeters] = useState(systemSettings.officeGeofenceRadiusMeters ?? 200);
  const [officeAddress, setOfficeAddress] = useState(systemSettings.officeAddress);

  // Attendance-to-Payroll Rules Engine
  const [salaryProrationMethod, setSalaryProrationMethod] = useState<SalaryProrationMethod>(
    systemSettings.salaryProrationMethod || 'CALENDAR_DAYS'
  );
  const [unpaidLeaveBase, setUnpaidLeaveBase] = useState<'TOTAL_MONTH_DAYS' | 'SCHEDULED_WORKING_DAYS'>(
    systemSettings.unpaidLeaveBase || 'TOTAL_MONTH_DAYS'
  );
  const [unpaidLeaveDeductionEnabled, setUnpaidLeaveDeductionEnabled] = useState(
    systemSettings.unpaidLeaveDeductionEnabled ?? true
  );
  const [includeApprovedReimbursementsInPayroll, setIncludeApprovedReimbursementsInPayroll] = useState(
    systemSettings.includeApprovedReimbursementsInPayroll ?? true
  );

  // Late Arrival Policy Configuration
  const [lateArrivalDeductionEnabled, setLateArrivalDeductionEnabled] = useState(
    systemSettings.lateArrivalDeductionEnabled ?? false
  );
  const [lateDeductionThresholdMinutes, setLateDeductionThresholdMinutes] = useState(
    systemSettings.lateDeductionThresholdMinutes ?? 15
  );
  const [lateRuleType, setLateRuleType] = useState<LateDeductionRuleType>(
    systemSettings.lateDeductionPolicy?.ruleType || 'OCCURRENCES'
  );
  const [graceLateCountAllowed, setGraceLateCountAllowed] = useState(
    systemSettings.lateDeductionPolicy?.graceLateCountAllowed ?? 3
  );
  const [deductionAmountPerOccurrence, setDeductionAmountPerOccurrence] = useState(
    systemSettings.lateDeductionPolicy?.deductionAmountPerOccurrence ?? 150
  );
  const [deductionRatePerMinute, setDeductionRatePerMinute] = useState(
    systemSettings.lateDeductionPolicy?.deductionRatePerMinute ?? 5
  );
  const [approvedPermissionExcludesLate, setApprovedPermissionExcludesLate] = useState(
    systemSettings.lateDeductionPolicy?.approvedPermissionExcludesLate ?? true
  );

  // Company ICICI Bank TXT Parameters
  const [corporateId, setCorporateId] = useState(
    systemSettings.corporateId || iciciTxtConfig.corporateId || 'FUNSCHOLAR'
  );
  const [debitAccountNumber, setDebitAccountNumber] = useState(
    systemSettings.debitAccountNumber || iciciTxtConfig.debitAccountNumber || '000205004819'
  );
  const [defaultBatchRemarks, setDefaultBatchRemarks] = useState(
    systemSettings.defaultBatchRemarks || iciciTxtConfig.batchRemarks || 'FUNSCHOLAR SALARY DISBURSEMENT'
  );
  const [confirmedDateFormat, setConfirmedDateFormat] = useState<'MM/DD/YYYY' | 'DD/MM/YYYY'>(
    systemSettings.confirmedDateFormat || iciciTxtConfig.dateFormat || 'DD/MM/YYYY'
  );
  const [clientCode, setClientCode] = useState(iciciTxtConfig.clientCode || 'FUNSCHOLAR');
  const [productCode, setProductCode] = useState(iciciTxtConfig.productCode || 'SALPAY');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">System policies and payroll calculation rules are restricted to the Super Admin role.</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    // Update system settings
    await updateSystemSettings({
      companyName,
      companyAddress,
      employeeNumberPrefix,
      standardWorkStartTime,
      standardWorkEndTime,
      gracePeriodMinutes: Number(gracePeriodMinutes),
      officeLatitude: Number(officeLatitude),
      officeLongitude: Number(officeLongitude),
      officeGeofenceRadiusMeters: Number(officeGeofenceRadiusMeters),
      officeAddress,
      salaryProrationMethod,
      unpaidLeaveBase,
      unpaidLeaveDeductionEnabled,
      includeApprovedReimbursementsInPayroll,
      lateArrivalDeductionEnabled,
      lateDeductionThresholdMinutes: Number(lateDeductionThresholdMinutes),
      lateDeductionPolicy: {
        enabled: lateArrivalDeductionEnabled,
        ruleType: lateRuleType,
        graceLateCountAllowed: Number(graceLateCountAllowed),
        deductionAmountPerOccurrence: Number(deductionAmountPerOccurrence),
        deductionRatePerMinute: Number(deductionRatePerMinute),
        approvedPermissionExcludesLate,
        effectiveDate: new Date().toISOString().split('T')[0],
        approvedBy: 'info@funscholar.com',
      },
      corporateId,
      debitAccountNumber,
      defaultBatchRemarks,
      confirmedDateFormat,
    });

    // Also sync company bank parameters into IciciTxtBatchConfig
    await updateIciciTxtConfig({
      corporateId,
      clientCode,
      debitAccountNumber,
      batchRemarks: defaultBatchRemarks,
      dateFormat: confirmedDateFormat,
      productCode,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Payroll Policy Engine & Organization Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure attendance-to-payroll conversion, late-arrival deduction rules, and ICICI Bank TXT parameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved & Applied</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Attendance-to-Payroll Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('late')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'late'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Late-Arrival Policy</span>
          {lateArrivalDeductionEnabled ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ) : (
            <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 text-slate-600 rounded">Disabled</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'bank'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4 text-amber-500" />
          <span>Company ICICI CIB Config</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'company'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organization & Geofence</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* TAB 1: Attendance-to-Payroll Rules Engine */}
        {activeTab === 'rules' && (
          <div className="space-y-5 animate-in fade-in duration-100">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-blue-600" />
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">
                    Salary Proration & Payable Days Method
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Control how employee salaries are prorated across months with 28, 29, 30, or 31 days.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-semibold text-slate-900">
                    Monthly Salary Proration Method *
                  </label>
                  <select
                    value={salaryProrationMethod}
                    onChange={(e) => setSalaryProrationMethod(e.target.value as SalaryProrationMethod)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-medium"
                  >
                    <option value="CALENDAR_DAYS">Calendar Days Method (Total Days in Month, e.g. 30 or 31)</option>
                    <option value="SCHEDULED_WORKING_DAYS">Scheduled Working Days (Excludes Weekly Offs & Holidays)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {salaryProrationMethod === 'CALENDAR_DAYS'
                      ? 'Gross salary is divided by total calendar days (e.g. 31 for October). Weekly offs and paid holidays are treated as payable days.'
                      : 'Gross salary is divided by scheduled working days only. Daily rate is higher and applies only to scheduled working days.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-semibold text-slate-900">
                    Unpaid Leave (LWP) Base Divisor *
                  </label>
                  <select
                    value={unpaidLeaveBase}
                    onChange={(e) => setUnpaidLeaveBase(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-medium"
                  >
                    <option value="TOTAL_MONTH_DAYS">Total Month Days (e.g. Basic / 31 for October)</option>
                    <option value="SCHEDULED_WORKING_DAYS">Working Days in Period (e.g. Basic / 26)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Determines the daily salary rate deducted for unapproved absences and leaves without pay (LWP).
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Status Payable Weights Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Configured Attendance Status Payable Treatments
                </h3>
                <p className="text-[11px] text-slate-500">
                  Defines how each punch record status affects payable days in monthly payroll calculations.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Attendance Status</th>
                      <th className="py-2.5 px-3">Treatment in Payroll</th>
                      <th className="py-2.5 px-3 font-mono">Payable Unit</th>
                      <th className="py-2.5 px-3">Policy Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Present (Office)</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Full Salary Payable</td>
                      <td className="py-2.5 px-3 font-mono font-bold">1.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Verified via office terminal punch or GPS within geofence</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Approved Work from Home (WFH)</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Full Salary Payable</td>
                      <td className="py-2.5 px-3 font-mono font-bold">1.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Requires approved WFH request in Requests & Approvals</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Approved Field Work (School Visits)</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Full Salary Payable</td>
                      <td className="py-2.5 px-3 font-mono font-bold">1.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Trained staff at partner schools; eligible for travel claim reimbursement</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Half Day</td>
                      <td className="py-2.5 px-3 text-amber-700 font-medium">Half Day Salary</td>
                      <td className="py-2.5 px-3 font-mono font-bold">0.5 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Worked &gt; 4 hours but &lt; standard full day</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Paid Leave</td>
                      <td className="py-2.5 px-3 text-blue-700 font-medium">Full Salary Payable</td>
                      <td className="py-2.5 px-3 font-mono font-bold">1.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Approved Casual Leave (CL) / Sick Leave (SL) / Earned Leave (EL)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Unpaid Leave (LWP) / Absent</td>
                      <td className="py-2.5 px-3 text-rose-700 font-medium">Pro-Rata Deducted</td>
                      <td className="py-2.5 px-3 font-mono font-bold">0.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Deducted via approved salary divisor</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Weekly Off (Sunday) &amp; Holidays</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">Payable</td>
                      <td className="py-2.5 px-3 font-mono font-bold">1.0 Day</td>
                      <td className="py-2.5 px-3 text-slate-500">Automatic credit under calendar days proration method</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Incomplete Attendance / Missing Punch</td>
                      <td className="py-2.5 px-3 text-amber-800 font-medium">Pending Review</td>
                      <td className="py-2.5 px-3 font-mono font-bold">Review Required</td>
                      <td className="py-2.5 px-3 text-slate-500">Not automatically marked absent; flagged as exception for administrative review</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Operational Policies & Disbursal Integrations
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unpaidLeaveDeductionEnabled}
                    onChange={(e) => setUnpaidLeaveDeductionEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Enforce Pro-Rata Deductions for Unpaid Leave (LWP)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      When enabled, unapproved absences and unpaid leaves deduct pro-rata base salary. Respects joining and leaving dates.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeApprovedReimbursementsInPayroll}
                    onChange={(e) => setIncludeApprovedReimbursementsInPayroll(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-400"
                  />
                  <div>
                    <span className="font-semibold text-emerald-950 block">
                      Include Approved Travel Expense Claims in Monthly Salary Disbursement
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Approved staff school demonstration &amp; field travel claims are automatically added to Net Salary Payable and marked PAID upon bank reconciliation.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Late-Arrival Policy Configuration */}
        {activeTab === 'late' && (
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Guard Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Mandatory Policy Guard: Late Deductions are Disabled by Default</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                As required by system specification, late-based salary deductions remain strictly disabled until the Super Admin explicitly configures and approves the deduction policy below.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Late Arrival Policy Activation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated automatically from punch-in timestamps against scheduled shift start times.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lateArrivalDeductionEnabled}
                    onChange={(e) => setLateArrivalDeductionEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  <span className="ml-2 font-semibold text-xs text-slate-900">
                    {lateArrivalDeductionEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Official Work Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={standardWorkStartTime}
                    onChange={(e) => setStandardWorkStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    value={gracePeriodMinutes}
                    onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Arrival before {standardWorkStartTime} + {gracePeriodMinutes}m is not counted as late.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Late Deduction Threshold (Minutes)
                  </label>
                  <input
                    type="number"
                    value={lateDeductionThresholdMinutes}
                    onChange={(e) => setLateDeductionThresholdMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              {lateArrivalDeductionEnabled && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="font-semibold text-slate-900">Deduction Calculation Formula</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Deduction Rule Type</label>
                      <select
                        value={lateRuleType}
                        onChange={(e) => setLateRuleType(e.target.value as LateDeductionRuleType)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                      >
                        <option value="OCCURRENCES">Occurrences (Fixed ₹ per late day after grace count)</option>
                        <option value="PER_MINUTE">Per Minute (₹ Rate per late minute beyond grace)</option>
                        <option value="HALF_DAY_PENALTY">Half-Day Penalty (Every N late arrivals = 0.5 Day)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Allowed Free Late Occurrences / Month
                      </label>
                      <input
                        type="number"
                        value={graceLateCountAllowed}
                        onChange={(e) => setGraceLateCountAllowed(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        First {graceLateCountAllowed} late marks incur zero salary deduction.
                      </p>
                    </div>

                    {lateRuleType === 'OCCURRENCES' ? (
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Deduction Amount per Excess Late Occurrence (₹)
                        </label>
                        <input
                          type="number"
                          value={deductionAmountPerOccurrence}
                          onChange={(e) => setDeductionAmountPerOccurrence(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Rate per Late Minute (₹/min)
                        </label>
                        <input
                          type="number"
                          value={deductionRatePerMinute}
                          onChange={(e) => setDeductionRatePerMinute(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvedPermissionExcludesLate}
                      onChange={(e) => setApprovedPermissionExcludesLate(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span className="text-slate-700 text-xs font-medium">
                      Exclude approved late permissions / waivers from salary deductions
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Company ICICI Bank TXT Parameters */}
        {activeTab === 'bank' && (
          <div className="space-y-5 animate-in fade-in duration-100">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Landmark className="w-4 h-4 text-amber-500" />
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">
                    Corporate Banking Identifiers & Direct TXT Configuration
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Saved once by Super Admin and reused for every monthly payroll run to generate validated ICICI CIB text files.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Corporate ID / Client Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={corporateId}
                    onChange={(e) => {
                      setCorporateId(e.target.value.toUpperCase());
                      setClientCode(e.target.value.toUpperCase());
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Provided by ICICI Bank for Corporate Internet Banking (CIB).
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Corporate Debit Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={debitAccountNumber}
                    onChange={(e) => setDebitAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Funscholar corporate salary disbursement account at ICICI Bank.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Default Batch Remarks (FHR Header) *
                  </label>
                  <input
                    type="text"
                    required
                    value={defaultBatchRemarks}
                    onChange={(e) => setDefaultBatchRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Confirmed Transaction Date Format *
                  </label>
                  <select
                    value={confirmedDateFormat}
                    onChange={(e) => setConfirmedDateFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Standard ICICI CIB Indian Format)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Product Code Identifier
                  </label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Standard ICICI salary bulk product code (e.g. SALPAY / CMS).
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Approved TXT Template
                  </label>
                  <input
                    type="text"
                    disabled
                    value="ICICI CIB Format: FHR Header + WIB/MCO Records + FDR Footer"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed"
                  />
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                    Validated against confirmed ICICI Bank specifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Organization Profile & Geofence */}
        {activeTab === 'company' && (
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Company Profile */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-slate-600" />
                <h2 className="font-semibold text-slate-900 text-sm">
                  Corporate Legal Identity & Numbering
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Employee Number Format Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeNumberPrefix}
                    onChange={(e) => setEmployeeNumberPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Generates identifiers in format: {employeeNumberPrefix}-YYYY-XXXX
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Registered Office Address (Appears on Payslips) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Office Geofence */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-slate-900 text-sm">
                  Office Attendance Geofence Coordinates
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Office Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={officeLatitude}
                    onChange={(e) => setOfficeLatitude(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Office Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={officeLongitude}
                    onChange={(e) => setOfficeLongitude(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={officeGeofenceRadiusMeters}
                    onChange={(e) => setOfficeGeofenceRadiusMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-[11px] text-slate-400">
            Changes take effect immediately for all subsequent payroll calculations and bank TXT generations.
          </p>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save System &amp; Payroll Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
