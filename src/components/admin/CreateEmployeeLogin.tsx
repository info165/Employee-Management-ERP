import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateSecurePassword } from '../../lib/accountProvisioning';
import { ApprovalModal } from '../onboarding/ApprovalModal';
import { Employee, PendingAccount } from '../../types';
import {
  KeyRound,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react';

export const CreateEmployeeLogin: React.FC = () => {
  const {
    createEmployeeLogin,
    pendingAccounts,
    employees,
    isSuperAdmin,
    currentUser,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success credential modal / banner state
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    uid: string;
  } | null>(null);
  const [copiedFullCredentials, setCopiedFullCredentials] = useState(false);

  // Approval modal state for submitted onboardings
  const [selectedEmployeeForReview, setSelectedEmployeeForReview] = useState<Employee | null>(null);

  // Filter or search in issued logins
  const [searchQuery, setSearchQuery] = useState('');

  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
        <ShieldCheck className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h2 className="text-base font-bold">Access Restricted</h2>
        <p className="text-xs text-red-600 mt-1">
          Only the Super Administrator may issue employee credentials and create employee accounts.
        </p>
      </div>
    );
  }

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword(12);
    setPassword(pwd);
    setCopiedPassword(false);
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleCopyFullCredentials = async () => {
    if (!createdCredentials) return;
    const text = `FunScholar Portal Employee Login Credentials\nPortal URL: ${window.location.origin}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\n\nPlease sign in and set your personal password on your first login, then complete your onboarding details.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFullCredentials(true);
      setTimeout(() => setCopiedFullCredentials(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid employee email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createEmployeeLogin(email.trim(), password);
      setCreatedCredentials({
        email: email.trim(),
        password,
        uid: res.uid,
      });
      setEmail('');
      setPassword('');
      setCopiedPassword(false);
    } catch (err: any) {
      console.error('Failed to issue login:', err);
      let msg = err?.message || 'Failed to create employee login.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email address already exists in Firebase Auth.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'The email address is not formatted correctly.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to resolve an account's state across pending_accounts and employees
  const getAccountStatusInfo = (account: PendingAccount) => {
    // Cross reference by uid or email
    const matchingEmp = employees.find(
      (e) =>
        (e.userId && e.userId === account.uid) ||
        e.email.toLowerCase() === account.email.toLowerCase()
    );

    if (matchingEmp && matchingEmp.onboardingStatus === 'APPROVED' && matchingEmp.accountActivated) {
      return {
        label: 'Active',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        employee: matchingEmp,
        canApprove: false,
      };
    }

    if (
      account.onboardingSubmitted ||
      (matchingEmp && matchingEmp.onboardingStatus === 'UNDER_REVIEW')
    ) {
      return {
        label: 'Onboarding submitted — needs your review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        employee: matchingEmp,
        canApprove: true,
      };
    }

    return {
      label: 'Waiting for first login',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      employee: matchingEmp,
      canApprove: false,
    };
  };

  const filteredAccounts = pendingAccounts.filter((acc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.email.toLowerCase().includes(q) ||
      acc.invitedBy.toLowerCase().includes(q) ||
      acc.uid.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Create Employee Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Issue credentials for new employees so they can sign in, set a personal password, and self-submit their onboarding profile.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 bg-amber-100/70 border border-amber-200 rounded-md text-amber-800 font-semibold">
            Super Admin Only
          </span>
        </div>
      </div>

      {/* Success Banner / Modal when credentials were just created */}
      {createdCredentials && (
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Employee Login Issued Successfully!
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hand these credentials to the employee. They will be forced to set their permanent password upon first login, and then complete their self-service onboarding details.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-emerald-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Employee Login Email
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 select-all">
                {createdCredentials.email}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Initial Temporary Password
              </span>
              <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all inline-block">
                {createdCredentials.password}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Session preserved: Your Super Admin login was never interrupted.</span>
            </div>
            <button
              type="button"
              onClick={handleCopyFullCredentials}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              {copiedFullCredentials ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Credentials to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Login Info for Employee</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Grid: Form on Top/Left, Info on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
              Issue New Login Credentials
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@funscholar.com or personal email"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This is the official identifier the employee will enter to sign in to the portal.
              </p>
            </div>

            {/* Password Field with Type or Generate Option */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Password</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Type a password or click 'Generate Password'"
                  className="w-full pl-9 pr-24 py-2 text-xs font-mono bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />

                <div className="absolute right-2 flex items-center gap-1">
                  {password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      title="Copy password to clipboard"
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Both typing your own password and random generation are supported.</span>
                {password && (
                  <span className="font-mono text-slate-600">{password.length} chars</span>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !email.trim() || !password}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors shadow-xs"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Auth Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create & Issue Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informational Workflow Summary */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Onboarding Architecture
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <strong className="text-slate-900 block">Admin Issues Login</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Account is registered in Firebase Auth without disturbing your active session. A record is added to <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded font-mono">pending_accounts</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <strong className="text-slate-900 block">Mandatory Password Reset</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upon first sign in, the employee is blocked until they set their own permanent password.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <strong className="text-slate-900 block">Self-Service Onboarding</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Employee fills in personal details, statutory numbers (PAN, Aadhaar), and uploads required documents.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <strong className="text-slate-900 block">Super Admin Review & Approval</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You review submitted documents, approve onboarding, and generate the official Employee ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issued Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Issued Employee Logins</span>
              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 font-mono rounded-full">
                {pendingAccounts.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time directory of all logins issued, verification progress, and approval states.
            </p>
          </div>

          {/* Search filter */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <KeyRound className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-500">
              {pendingAccounts.length === 0
                ? 'No employee logins issued yet. Use the form above to issue the first login.'
                : 'No accounts match your search filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Employee Email</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => {
                  const statusInfo = getAccountStatusInfo(account);
                  const emp = statusInfo.employee;

                  return (
                    <tr key={account.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{account.email}</div>
                        {emp && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">{emp.fullName}</span>
                            {emp.employeeNumber && (
                              <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 text-[10px]">
                                {emp.employeeNumber}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {account.invitedAt
                          ? new Date(account.invitedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {account.invitedBy || 'Admin'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {statusInfo.canApprove && emp ? (
                          <button
                            onClick={() => setSelectedEmployeeForReview(emp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review & Approve</span>
                          </button>
                        ) : statusInfo.label === 'Active' && emp ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Verified & Active</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Awaiting Login
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal when Super Admin clicks Review & Approve */}
      {selectedEmployeeForReview && (
        <ApprovalModal
          employee={selectedEmployeeForReview}
          onClose={() => setSelectedEmployeeForReview(null)}
        />
      )}
    </div>
  );
};
