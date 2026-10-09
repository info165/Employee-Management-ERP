import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import { formatDateIndian, formatTimeIndian, downloadCsv, downloadXlsx } from '../../lib/exportUtils';
import {
  Calendar,
  Filter,
  Download,
  MapPin,
  Edit3,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { FieldWorkMapModal } from './FieldWorkMapModal';

export const AttendanceRegister: React.FC = () => {
  const {
    attendanceRecords,
    employees,
    isSuperAdmin,
    isDataOperator,
    isEmployee,
    currentEmployee,
  } = useAuth();

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForMap, setSelectedRecordForMap] = useState<AttendanceRecord | null>(null);

  // If role is EMPLOYEE, restrict view strictly to their own records per security mandate
  const recordsToFilter = isEmployee
    ? attendanceRecords.filter((r) => r.employeeId === currentEmployee?.id)
    : attendanceRecords;

  const filteredRecords = recordsToFilter.filter((r) => {
    const matchesEmp = employeeFilter === 'ALL' || r.employeeId === employeeFilter;
    const matchesMode = modeFilter === 'ALL' || r.workMode === modeFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesEmp && matchesMode && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = 'Employee_ID,Employee_Name,Date,Work_Mode,Check_In,Check_Out,Duration_Min,Late_Min,Status,Location_Address,Is_Corrected\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.employeeNumber}","${r.employeeName}","${r.date}","${r.workMode}","${r.checkInTime}","${r.checkOutTime || ''}",${r.durationMinutes},${r.lateArrivalMinutes},"${r.status}","${r.checkInLocation?.address || ''}",${r.isCorrected}`
      )
      .join('\n');
    downloadCsv(`Attendance_Register_${new Date().toISOString().split('T')[0]}.csv`, headers + rows);
  };

  const handleExportXlsx = () => {
    const data = filteredRecords.map((r) => ({
      'Employee ID': r.employeeNumber,
      'Employee Name': r.employeeName,
      'Date': formatDateIndian(r.date),
      'Work Mode': r.workMode,
      'Check In': formatTimeIndian(r.checkInTime),
      'Check Out': formatTimeIndian(r.checkOutTime),
      'Duration (Minutes)': r.durationMinutes,
      'Late Arrival (Minutes)': r.lateArrivalMinutes,
      'Status': r.status,
      'Location / Site': r.checkInLocation?.address || 'N/A',
      'Corrected': r.isCorrected ? 'Yes' : 'No',
    }));
    downloadXlsx(`Attendance_Register_${new Date().toISOString().split('T')[0]}.xlsx`, 'Attendance', data);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isEmployee ? 'My Attendance History' : 'Organizational Attendance Register'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Office geofenced punches, WFH records, and GPS school visit timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportXlsx}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        {!isEmployee && (
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Staff Member</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Staff Members</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeNumber || 'Pending'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Work Mode</label>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Work Modes</option>
            <option value="OFFICE">Office</option>
            <option value="FIELD">Field Visit</option>
            <option value="WFH">WFH</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Attendance Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="FIELD_WORK">FIELD_WORK</option>
            <option value="WFH">WFH</option>
            <option value="LATE">LATE</option>
            <option value="HALF_DAY">HALF_DAY</option>
            <option value="LEAVE">LEAVE</option>
            <option value="ABSENT">ABSENT</option>
          </select>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                {!isEmployee && <th className="py-3 px-4 font-semibold">Staff Member</th>}
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold">Check In</th>
                <th className="py-3 px-4 font-semibold">Check Out</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Location / Site Details</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {(isSuperAdmin || isDataOperator) && (
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {formatDateIndian(rec.date)}
                    </td>
                    {!isEmployee && (
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.employeeNumber}</div>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {rec.workMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {formatTimeIndian(rec.checkInTime)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {rec.checkOutTime ? formatTimeIndian(rec.checkOutTime) : (
                        <span className="text-amber-600 italic">In progress</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {rec.durationMinutes > 0
                        ? `${Math.floor(rec.durationMinutes / 60)}h ${rec.durationMinutes % 60}m`
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {rec.checkInLocation ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForMap(rec)}
                            className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                            title="Inspect GPS Coordinates & Accuracy"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className="truncate max-w-[200px] text-[11px] text-slate-600"
                            title={rec.checkInLocation.address}
                          >
                            {rec.checkInLocation.address || `${rec.checkInLocation.lat.toFixed(4)}, ${rec.checkInLocation.lng.toFixed(4)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Office Hub Punch</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            rec.status === 'PRESENT' || rec.status === 'FIELD_WORK'
                              ? 'bg-emerald-50 text-emerald-700'
                              : rec.status === 'WFH'
                              ? 'bg-purple-50 text-purple-700'
                              : rec.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700'
                              : rec.status === 'HALF_DAY'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {rec.status.replace('_', ' ')}
                        </span>
                        {rec.isCorrected && (
                          <span
                            className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono"
                            title="This record was audited and corrected"
                          >
                            Audited
                          </span>
                        )}
                      </div>
                    </td>
                    {(isSuperAdmin || isDataOperator) && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRecordForCorrection(rec)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Correct</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Modal */}
      {selectedRecordForCorrection && (
        <AttendanceCorrectionModal
          record={selectedRecordForCorrection}
          onClose={() => setSelectedRecordForCorrection(null)}
        />
      )}

      {/* GPS Map Modal */}
      {selectedRecordForMap && (
        <FieldWorkMapModal
          record={selectedRecordForMap}
          onClose={() => setSelectedRecordForMap(null)}
        />
      )}
    </div>
  );
};
