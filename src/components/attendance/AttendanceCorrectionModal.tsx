import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import { formatDateIndian, formatTimeIndian } from '../../lib/exportUtils';
import { Edit3, X, AlertCircle, History, Check } from 'lucide-react';

interface Props {
  record: AttendanceRecord;
  onClose: () => void;
}

export const AttendanceCorrectionModal: React.FC<Props> = ({ record, onClose }) => {
  const { correctAttendance, isSuperAdmin, isDataOperator } = useAuth();

  const [fieldToCorrect, setFieldToCorrect] = useState<'checkInTime' | 'checkOutTime' | 'status'>('checkOutTime');
  const [newValue, setNewValue] = useState(
    record.checkOutTime || new Date().toISOString()
  );
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mandatory audit note: Please provide a valid justification reason for this correction.');
      return;
    }

    setSubmitting(true);
    try {
      await correctAttendance(record.id, fieldToCorrect, newValue, reason, note);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
              Authorized Attendance Correction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Correction Audited & Saved</h3>
              <p className="text-slate-600">
                The original record has been preserved and an immutable correction audit item has been logged.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCorrection} className="space-y-4">
              {/* Record Summary */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-semibold text-slate-900">{record.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-800">{formatDateIndian(record.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Work Mode:</span>
                  <span className="font-medium text-slate-800">{record.workMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Check-In:</span>
                  <span className="font-mono">{formatTimeIndian(record.checkInTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Check-Out:</span>
                  <span className="font-mono">
                    {record.checkOutTime ? formatTimeIndian(record.checkOutTime) : 'Not punched'}
                  </span>
                </div>
              </div>

              {/* Field Selection */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Field to Modify *
                </label>
                <select
                  value={fieldToCorrect}
                  onChange={(e) => setFieldToCorrect(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="checkOutTime">Check Out Timestamp</option>
                  <option value="checkInTime">Check In Timestamp</option>
                  <option value="status">Attendance Status</option>
                </select>
              </div>

              {/* New Value */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Corrected Value *
                </label>
                {fieldToCorrect === 'status' ? (
                  <select
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="FIELD_WORK">FIELD_WORK</option>
                    <option value="WFH">WFH</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                    <option value="LEAVE">LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                ) : (
                  <input
                    type="datetime-local"
                    required
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewValue(new Date(e.target.value).toISOString());
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Correction Reason (Mandatory Audit Requirement) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verified security desk log out record / Battery drain at school site"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Supporting Note / Verification Evidence
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional audit notes or approved ticket references..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Previous Correction History if any */}
              {record.correctionAudit && record.correctionAudit.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-[11px]">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Previous Audit Trail ({record.correctionAudit.length} edits)</span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {record.correctionAudit.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px]"
                      >
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{item.fieldModified}</span>
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">Reason: {item.reason}</p>
                        <p className="text-[10px] text-slate-400">By: {item.correctedByName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  {submitting ? 'Auditing...' : 'Save Correction with Audit Trail'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
