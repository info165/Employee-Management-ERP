import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings } from '../../types';
import {
  Settings,
  Save,
  Building2,
  Clock,
  MapPin,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const { systemSettings, updateSystemSettings, isSuperAdmin } = useAuth();

  const [companyName, setCompanyName] = useState(systemSettings.companyName);
  const [companyAddress, setCompanyAddress] = useState(systemSettings.companyAddress);
  const [employeeNumberPrefix, setEmployeeNumberPrefix] = useState(systemSettings.employeeNumberPrefix);
  const [standardWorkStartTime, setStandardWorkStartTime] = useState(systemSettings.standardWorkStartTime);
  const [standardWorkEndTime, setStandardWorkEndTime] = useState(systemSettings.standardWorkEndTime);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(systemSettings.gracePeriodMinutes);
  const [officeLatitude, setOfficeLatitude] = useState(systemSettings.officeLatitude);
  const [officeLongitude, setOfficeLongitude] = useState(systemSettings.officeLongitude);
  const [officeGeofenceRadiusMeters, setOfficeGeofenceRadiusMeters] = useState(systemSettings.officeGeofenceRadiusMeters);
  const [officeAddress, setOfficeAddress] = useState(systemSettings.officeAddress);
  const [unpaidLeaveDeductionEnabled, setUnpaidLeaveDeductionEnabled] = useState(systemSettings.unpaidLeaveDeductionEnabled);
  const [lateArrivalDeductionEnabled, setLateArrivalDeductionEnabled] = useState(systemSettings.lateArrivalDeductionEnabled);
  const [lateDeductionThresholdMinutes, setLateDeductionThresholdMinutes] = useState(systemSettings.lateDeductionThresholdMinutes);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">System policies and configurations are restricted to the Super Admin role.</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      unpaidLeaveDeductionEnabled,
      lateArrivalDeductionEnabled,
      lateDeductionThresholdMinutes: Number(lateDeductionThresholdMinutes),
    });
    alert('System settings and attendance policies saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Organization Policies & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure corporate identifiers, attendance geofence thresholds, and payroll deduction rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
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

        {/* Office Geofence & Timings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-sm">
              Office Geofence & Standard Working Hours
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Work Start Time (IST)</label>
              <input
                type="time"
                value={standardWorkStartTime}
                onChange={(e) => setStandardWorkStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Work End Time (IST)</label>
              <input
                type="time"
                value={standardWorkEndTime}
                onChange={(e) => setStandardWorkEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

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

        {/* Salary Deductions Policy (Mandatory Invariant Check) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-slate-900 text-sm">
              Salary Deductions & Attendance Penalty Controls
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={unpaidLeaveDeductionEnabled}
                onChange={(e) => setUnpaidLeaveDeductionEnabled(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Enable Pro-Rata Deductions for Unpaid Leaves (LWP)
                </span>
                <span className="text-[11px] text-slate-500">
                  Deducts pro-rata daily salary for recorded absent days and half-days.
                </span>
              </div>
            </label>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lateArrivalDeductionEnabled}
                  onChange={(e) => setLateArrivalDeductionEnabled(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300"
                />
                <div>
                  <span className="font-semibold text-amber-950 block">
                    Activate Late-Arrival Salary Penalty Deductions
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Mandatory Policy Guard: As required by specifications, late arrival salary deductions remain disabled by default until explicitly enabled here by the Super Admin.
                  </span>
                </div>
              </label>

              {lateArrivalDeductionEnabled && (
                <div className="pt-2 pl-7 flex items-center gap-2">
                  <span className="text-slate-700">Late deduction threshold:</span>
                  <input
                    type="number"
                    value={lateDeductionThresholdMinutes}
                    onChange={(e) => setLateDeductionThresholdMinutes(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-center"
                  />
                  <span className="text-slate-500">minutes past grace window</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Organization Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
