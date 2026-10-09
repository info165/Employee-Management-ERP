import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import { ShieldCheck, CheckCircle2, X, AlertTriangle, Key } from 'lucide-react';

interface Props {
  employee: Employee;
  onClose: () => void;
}

export const ApprovalModal: React.FC<Props> = ({ employee, onClose }) => {
  const { approveOnboarding, systemSettings } = useAuth();

  const year = new Date().getFullYear();
  const nextSeq = systemSettings.employeeNumberSequence + 1;
  const suggestedNumber = `${systemSettings.employeeNumberPrefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

  const [employeeNumber, setEmployeeNumber] = useState(suggestedNumber);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [approvedNumber, setApprovedNumber] = useState('');

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await approveOnboarding(employee.id, employeeNumber);
      setApprovedNumber(res.employeeNumber);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
              Approve Onboarding & Issue Employee ID
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Onboarding Successfully Approved</h3>
              <p className="text-slate-600">
                Official employee number issued:{' '}
                <strong className="font-mono text-emerald-700 font-bold">{approvedNumber}</strong>
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-left text-[11px] text-slate-600 space-y-1">
                <div>· User account initialized for <span className="font-semibold">{employee.email}</span></div>
                <div>· Linked UID generated and security permissions activated</div>
                <div>· Activation invitation link recorded in audit log</div>
              </div>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <>
              {/* Employee Summary Card */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate Name:</span>
                  <span className="font-semibold text-slate-900">{employee.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700">{employee.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-700">{employee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designation:</span>
                  <span className="text-slate-700">{employee.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Work Mode:</span>
                  <span className="font-medium text-slate-800">{employee.assignedWorkMode}</span>
                </div>
              </div>

              {/* Number Generation Field */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Assign Unique Employee ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setEmployeeNumber(suggestedNumber)}
                    className="px-2.5 py-2 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  >
                    Reset Auto
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sequentially generated per organization policy ({systemSettings.employeeNumberPrefix}-YYYY-XXXX).
                </p>
              </div>

              {/* Security Actions Info */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg text-amber-900 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <Key className="w-3.5 h-3.5" />
                  <span>Account Provisioning Protocol</span>
                </div>
                <p>
                  Upon approval, a secure employee login account is linked to this ID. The employee will receive an account activation token to establish their credentials.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApprove}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  {submitting ? 'Generating Account...' : 'Confirm Approval & Generate ID'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
