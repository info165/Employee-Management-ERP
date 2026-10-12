import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  LogOut,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

export const ForcePasswordChange: React.FC = () => {
  const { firebaseUser, completePasswordChange, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!passwordsMatch) {
        setError('Passwords do not match. Please re-enter.');
      } else {
        setError('Please satisfy all password security criteria.');
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await completePasswordChange(password);
    } catch (err: any) {
      console.error('Password change failed:', err);
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Organization Brand */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl tracking-wider shadow-sm">
            FS
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              FunScholar Edutech Solutions
            </h1>
            <p className="text-xs text-slate-500">Employee Self-Service Portal</p>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full mb-1">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>First-Time Sign In Detected</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Set Your Permanent Password
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your login was initialized with a temporary password. For security compliance, please establish your personal password before accessing the portal.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-8 space-y-6">
          {/* User Email Pill */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Signed in as:</span>
            <span className="font-mono font-semibold text-slate-900 truncate max-w-[200px]">
              {firebaseUser?.email}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Security checklist */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-700 block mb-1">
                Password Requirements:
              </span>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={hasMinLength ? 'text-slate-900 font-medium' : ''}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasUpper && hasLower ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={hasUpper && hasLower ? 'text-slate-900 font-medium' : ''}>
                  Upper and lower case letters
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={hasNumber ? 'text-slate-900 font-medium' : ''}>
                  At least one digit (0-9)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className={passwordsMatch ? 'text-slate-900 font-medium' : ''}>
                  Passwords match
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password & Continue</span>
              )}
            </button>
          </form>

          {/* Sign Out Option */}
          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out and return later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
