import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  RefreshCw,
  FileCheck2,
  Lock,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Landmark,
} from 'lucide-react';

interface Props {
  employee?: Employee | null;
}

export const PendingReviewScreen: React.FC<Props> = ({ employee }) => {
  const { firebaseUser, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Reload or let React state catch the updated doc
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base tracking-wider shadow-xs">
            FS
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
              FunScholar Edutech Solutions
            </span>
            <p className="text-xs text-slate-500">Employee Self-Service Onboarding</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            {firebaseUser?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Under Review Notice Banner */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
              <span>Status: Onboarding Under Review</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Your Details Are Under Review
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Thank you for submitting your onboarding profile and statutory records. Your submission is currently being reviewed by the Super Administrator.
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-left text-xs text-amber-900 space-y-2 max-w-lg mx-auto">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Once the Super Administrator approves your profile, your official <strong>Employee ID</strong> (e.g. <span className="font-mono">EMP-2026-XXXX</span>) will be assigned and your account will be activated.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Daily task screens (GPS attendance punching, leave/WFH requests, travel expense claims, payslips, and documents) will automatically unlock upon approval.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
            >
              Sign Out & Return Later
            </button>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Activation Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">1. Login Issued</span>
                <span className="text-[11px] text-emerald-700">Account created</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">2. Password Set</span>
                <span className="text-[11px] text-emerald-700">Permanent password</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">3. Info Submitted</span>
                <span className="text-[11px] text-emerald-700">Profile & documents</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-2 animate-pulse">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">4. Admin Approval</span>
                <span className="text-[11px] text-amber-700 font-medium">In review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Profile Snapshot */}
        {employee && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Submitted Profile Summary
                </h3>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Submitted on {new Date(employee.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
                  <span className="font-semibold text-slate-900">{employee.fullName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-mono text-slate-900">{employee.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Mobile</span>
                  <span className="font-mono text-slate-900">{employee.mobile}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Department & Role</span>
                  <span className="text-slate-900">{employee.department} · {employee.designation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Work Mode</span>
                  <span className="font-semibold text-slate-900">{employee.assignedWorkMode}</span>
                </div>
              </div>

              {employee.bankDetails && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Direct Bank Credit</span>
                    <span className="font-mono text-slate-900">
                      {employee.bankDetails.bankName} (A/C: ...{employee.bankDetails.bankAccountNumber.slice(-4)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
