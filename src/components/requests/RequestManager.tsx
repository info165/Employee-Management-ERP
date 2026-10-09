import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RequestType, EmployeeRequest } from '../../types';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  BadgeAlert,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Calendar,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const RequestManager: React.FC = () => {
  const {
    requests,
    submitRequest,
    reviewRequest,
    isEmployee,
    currentEmployee,
    isSuperAdmin,
    isDataOperator,
  } = useAuth();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('WFH');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [proposedCheckIn, setProposedCheckIn] = useState('');
  const [proposedCheckOut, setProposedCheckOut] = useState('');

  const [reviewingReq, setReviewingReq] = useState<EmployeeRequest | null>(null);
  const [decisionComment, setDecisionComment] = useState('');

  // Employees view only their requests; Admins/Operators view all
  const displayedRequests = isEmployee
    ? requests.filter((r) => r.employeeId === currentEmployee?.id)
    : requests;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRequest({
      type: requestType,
      startDate,
      endDate,
      reason,
      details:
        requestType === 'MISSED_PUNCH' || requestType === 'ATTENDANCE_CORRECTION'
          ? { proposedCheckIn, proposedCheckOut, targetAttendanceDate: startDate }
          : undefined,
    });
    setShowSubmitModal(false);
    setReason('');
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingReq) return;
    await reviewRequest(reviewingReq.id, status, decisionComment);
    setReviewingReq(null);
    setDecisionComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isEmployee ? 'My Requests & Permissions' : 'Permissions, Leaves & Attendance Exceptions'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Work-from-home authorizations, planned leave, and missed punch corrections.
          </p>
        </div>

        {isEmployee && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 self-start shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Request</span>
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Request Type</th>
                {!isEmployee && <th className="py-3 px-4 font-semibold">Staff Member</th>}
                <th className="py-3 px-4 font-semibold">Date / Period</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reviewer Notes</th>
                {(isSuperAdmin || isDataOperator) && (
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No requests submitted yet.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {req.type === 'WFH' && <Home className="w-3.5 h-3.5 text-purple-600" />}
                        {req.type === 'CASUAL_LEAVE' && <Calendar className="w-3.5 h-3.5 text-blue-600" />}
                        {req.type === 'SICK_LEAVE' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {(req.type === 'MISSED_PUNCH' || req.type === 'ATTENDANCE_CORRECTION') && (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{req.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    {!isEmployee && (
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{req.employeeNumber}</div>
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatDateIndian(req.startDate)}
                      {req.startDate !== req.endDate && ` to ${formatDateIndian(req.endDate)}`}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      <p className="truncate" title={req.reason}>
                        {req.reason}
                      </p>
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {req.approverComment ? (
                        <div className="italic">"{req.approverComment}"</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    {(isSuperAdmin || isDataOperator) && (
                      <td className="py-3 px-4 text-right">
                        {req.status === 'PENDING' ? (
                          <button
                            onClick={() => setReviewingReq(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Request Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                Submit Request / Permission
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Category *</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="WFH">Work from Home (WFH Permission)</option>
                  <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                  <option value="SICK_LEAVE">Sick Leave (SL)</option>
                  <option value="MISSED_PUNCH">Missed Punch Regularization</option>
                  <option value="ATTENDANCE_CORRECTION">Attendance Correction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Purpose *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide detailed justification..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                Review Permission Request
              </h2>
              <button
                onClick={() => setReviewingReq(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Member:</span>
                  <span className="font-semibold text-slate-900">{reviewingReq.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium text-slate-800">{reviewingReq.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dates:</span>
                  <span className="font-mono text-slate-700">
                    {formatDateIndian(reviewingReq.startDate)} to {formatDateIndian(reviewingReq.endDate)}
                  </span>
                </div>
                <div className="pt-1 text-slate-800">
                  <span className="text-slate-500 font-medium">Reason: </span>
                  "{reviewingReq.reason}"
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approver Remarks / Comments (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved per schedule..."
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReview('REJECTED')}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('APPROVED')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Permission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
