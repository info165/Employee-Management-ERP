import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndian, formatTimeIndian } from '../../lib/exportUtils';
import {
  Clock,
  CalendarCheck,
  FileText,
  BadgeAlert,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
  onOpenPayslip?: (entryId: string) => void;
}

export const EmployeeDashboard: React.FC<Props> = ({ onNavigate, onOpenPayslip }) => {
  const {
    currentEmployee,
    attendanceRecords,
    requests,
    payrollEntries,
    expenses,
  } = useAuth();

  const emp = currentEmployee;
  const myClaims = expenses.filter(
    (c) => c.employeeId === emp?.id || c.employeeNumber === emp?.employeeNumber
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === emp?.id && r.date === todayStr
  );

  // Month stats for current employee
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const empMonthRecords = attendanceRecords.filter((r) => {
    if (r.employeeId !== emp?.id) return false;
    const d = new Date(r.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const presentDays = empMonthRecords.filter((r) => r.status === 'PRESENT').length;
  const fieldDays = empMonthRecords.filter((r) => r.workMode === 'FIELD').length;
  const wfhDays = empMonthRecords.filter((r) => r.workMode === 'WFH').length;
  const lateDays = empMonthRecords.filter((r) => r.lateArrivalMinutes > 0).length;

  // Personal requests
  const myRequests = requests.filter((r) => r.employeeId === emp?.id);
  const pendingRequests = myRequests.filter((r) => r.status === 'PENDING');

  // Released payslips for current employee only
  const myPayslips = payrollEntries.filter(
    (e) => (e.employeeId === emp?.id || e.userId === emp?.userId) && e.payslipReleased
  );

  return (
    <div className="space-y-6">
      {/* Employee Welcome Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {emp?.photoUrl ? (
              <img
                src={emp.photoUrl}
                alt={emp.fullName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xl border border-slate-700">
                {emp?.fullName?.charAt(0) || 'E'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>{emp?.employeeNumber || 'ID Pending'}</span>
                <span>·</span>
                <span>{emp?.assignedWorkMode} MODE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {emp?.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {emp?.designation} · {emp?.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('expenses')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs border border-slate-700"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Travel Claims ({myClaims.length})</span>
            </button>
            <button
              onClick={() => onNavigate('clock-in')}
              className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Clock className="w-4 h-4" />
              <span>{todayRecord ? 'View / Punch Out' : 'Punch In (GPS)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Punch Widget & Monthly Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (1 col): Today's Live Attendance Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Today's Punch Status
          </div>

          {todayRecord ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Punched In for Today ({todayRecord.workMode})</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in Time:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatTimeIndian(todayRecord.checkInTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out Time:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {todayRecord.checkOutTime ? formatTimeIndian(todayRecord.checkOutTime) : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-slate-800">
                    {todayRecord.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {todayRecord.checkInLocation && (
                <div className="text-xs text-slate-600 border border-blue-100 bg-blue-50/50 p-2.5 rounded-lg flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800">
                      {todayRecord.checkInLocation.address || 'Field Visit Location'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      GPS Accuracy: {todayRecord.checkInLocation.accuracy.toFixed(1)}m
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => onNavigate('clock-in')}
                className="w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Open Attendance Terminal
              </button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Not Checked In Yet</span>
              </div>
              <p className="text-xs text-slate-500">
                You have not recorded attendance for {formatDateIndian(todayStr)}. Please punch in with your current location.
              </p>
              <button
                onClick={() => onNavigate('clock-in')}
                className="w-full py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Right (2 cols): Monthly Stats & Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Present (Office)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{presentDays}</div>
              <span className="text-[10px] text-slate-400">days this month</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Field Visits</span>
              <div className="text-xl font-bold text-blue-600 mt-1">{fieldDays}</div>
              <span className="text-[10px] text-slate-400">school visits</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Work from Home</span>
              <div className="text-xl font-bold text-purple-600 mt-1">{wfhDays}</div>
              <span className="text-[10px] text-slate-400">remote days</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Late Arrivals</span>
              <div className="text-xl font-bold text-amber-600 mt-1">{lateDays}</div>
              <span className="text-[10px] text-slate-400">tracked</span>
            </div>
          </div>

          {/* Available Payslips & Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* My Payslips */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>My Released Payslips</span>
                </div>
                <button
                  onClick={() => onNavigate('my-payslips')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
                >
                  <span>All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {myPayslips.length > 0 ? (
                <div className="space-y-2">
                  {myPayslips.slice(0, 2).map((ps) => (
                    <div
                      key={ps.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {new Date(ps.year, ps.month - 1).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Net Pay: ₹{ps.netPayable.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('my-payslips')}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                      >
                        Download PDF
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No payslips released yet.</p>
              )}
            </div>

            {/* My Requests Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <BadgeAlert className="w-4 h-4 text-purple-600" />
                  <span>Pending Requests</span>
                </div>
                <button
                  onClick={() => onNavigate('requests')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
                >
                  <span>New</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {myRequests.length > 0 ? (
                <div className="space-y-2">
                  {myRequests.slice(0, 2).map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {req.type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateIndian(req.startDate)}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No pending requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
