import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Employee, EmployeeBankDetails } from '../../types';
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  History,
  Save,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

interface Props {
  employee: Employee;
  onClose: () => void;
}

export const BankProfileModal: React.FC<Props> = ({ employee, onClose }) => {
  const { updateEmployeeBankDetails, verifyEmployeeBankDetails, isSuperAdmin } = useAuth();

  const currentBank = employee.bankDetails;

  const [accountHolderName, setAccountHolderName] = useState(
    currentBank?.accountHolderName || employee.fullName
  );
  const [bankName, setBankName] = useState(currentBank?.bankName || 'ICICI Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState(currentBank?.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(currentBank?.bankIfsc || 'ICIC0000002');
  const [transactionRoute, setTransactionRoute] = useState<'WIB' | 'NEFT'>(
    currentBank?.transactionRoute || (currentBank?.bankIfsc?.startsWith('ICIC') ? 'WIB' : 'NEFT')
  );
  const [reason, setReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountNumber.trim() || !bankIfsc.trim()) {
      alert('Account number and IFSC code are mandatory.');
      return;
    }
    setSaving(true);
    try {
      await updateEmployeeBankDetails(
        employee.id,
        {
          accountHolderName: accountHolderName.trim() || employee.fullName,
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          transactionRoute,
          verificationStatus: 'VERIFIED',
          effectiveDate: new Date().toISOString().split('T')[0],
        },
        reason || 'Authorized bank profile update by Super Admin'
      );
      setStatusMessage('Bank profile updated and verified successfully.');
      setIsEditing(false);
      setReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    const note = prompt(`Enter reason or confirmation note for marking ${status}:`, status === 'VERIFIED' ? 'Verified against cancelled cheque / bank statement' : 'IFSC or account mismatch');
    if (note === null) return;
    setSaving(true);
    try {
      await verifyEmployeeBankDetails(employee.id, status, note);
      setStatusMessage(`Bank profile status updated to ${status}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to verify bank details');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = currentBank?.verificationStatus === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Beneficiary Bank Profile & ICICI Routing</h3>
              <p className="text-[11px] text-slate-400">
                {employee.fullName} ({employee.employeeNumber || 'Pending Onboarding'}) · {employee.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Current Status Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Bank Name</span>
              <span className="font-bold text-slate-900">{currentBank?.bankName || 'Not Set'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Account Route</span>
              <span className={`inline-block font-mono font-bold px-1.5 py-0.5 rounded text-[10px] mt-0.5 ${
                currentBank?.transactionRoute === 'WIB' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
              }`}>
                {currentBank?.transactionRoute === 'WIB' ? 'WIB (ICICI Internal)' : 'NEFT (Other Bank)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Verification</span>
              <span className={`inline-flex items-center gap-1 font-bold text-[10px] mt-0.5 ${
                isVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {isVerified ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VERIFIED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{currentBank?.verificationStatus || 'PENDING'}</span>
                  </>
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">Effective Date</span>
              <span className="font-mono text-slate-700">{currentBank?.effectiveDate || '—'}</span>
            </div>
          </div>

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-semibold text-slate-900">Registered Beneficiary Details</h4>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit Banking Details
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Beneficiary Name:</span>
                    <span className="font-semibold text-slate-900">{currentBank?.accountHolderName || employee.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Account Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isSuperAdmin ? currentBank?.bankAccountNumber || 'None' : `XXXX-XXXX-${currentBank?.bankAccountNumber?.slice(-4) || 'XXXX'}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IFSC Code:</span>
                    <span className="font-mono font-bold text-slate-900">{currentBank?.bankIfsc || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Verified By:</span>
                    <span className="text-slate-700">{currentBank?.verifiedBy || 'Not verified'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Super Admin */}
              {isSuperAdmin && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {!isVerified && (
                      <button
                        onClick={() => handleVerify('VERIFIED')}
                        disabled={saving}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify & Approve Banking Details</span>
                      </button>
                    )}
                    {isVerified && (
                      <button
                        onClick={() => handleVerify('REJECTED')}
                        disabled={saving}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Flag / Reject Details</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                  >
                    Modify Bank Account
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Edit Form for Super Admin */
            <form onSubmit={handleSaveBankDetails} className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-semibold text-slate-900">Modify Beneficiary Banking Profile</h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Beneficiary Name *</label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bank Name *</label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setBankName(sel);
                      if (sel === 'ICICI Bank') {
                        setTransactionRoute('WIB');
                      } else {
                        setTransactionRoute('NEFT');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Other Bank">Other Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bank Account Number (String) *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bankIfsc}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setBankIfsc(val);
                      if (val.startsWith('ICIC')) {
                        setTransactionRoute('WIB');
                      } else {
                        setTransactionRoute('NEFT');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transaction Route *</label>
                  <select
                    value={transactionRoute}
                    onChange={(e) => setTransactionRoute(e.target.value as 'WIB' | 'NEFT')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                  >
                    <option value="WIB">WIB — Within ICICI Bank Transfer</option>
                    <option value="NEFT">NEFT — Other Bank NEFT Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason for Change (Audit Trail) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee provided updated salary account passbook"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Verify Bank Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* Change History & Audit Trail */}
          {currentBank?.changeHistory && currentBank.changeHistory.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Authorized Change History ({currentBank.changeHistory.length} event(s))</span>
              </div>
              <div className="divide-y divide-slate-200/60 max-h-36 overflow-y-auto pr-1">
                {currentBank.changeHistory.map((item, idx) => (
                  <div key={idx} className="py-2 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Changed by {item.changedBy}</span>
                      <span className="font-mono">{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-slate-800">
                      <strong>{item.field}:</strong> {item.oldValue} → <span className="text-emerald-700 font-semibold">{item.newValue}</span>
                    </div>
                    {item.reason && (
                      <div className="text-[10px] text-slate-500 italic">Reason: {item.reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
