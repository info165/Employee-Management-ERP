import React from 'react';
import { OnboardingForm } from './OnboardingForm';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ShieldCheck, LogOut } from 'lucide-react';

export const SelfServiceOnboarding: React.FC = () => {
  const { firebaseUser, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar with Branding and Sign Out */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-base tracking-wider shadow-xs">
              FS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  FunScholar Edutech Solutions
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  New Joiner
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-mono text-slate-700">{firebaseUser?.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Welcome Notice Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-xl p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">
                Welcome to FunScholar! Complete Your Onboarding Profile
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please enter your personal details, emergency contact, assigned work preferences, and statutory records (PAN, Aadhaar, and Bank Account details for ICICI direct payroll credit).
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Your information is encrypted and routed directly to the Super Administrator for verification.</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Reused Onboarding Form */}
        <div className="bg-transparent">
          <OnboardingForm
            isSelfService={true}
            onSuccess={() => {
              // Once submitted, state updates trigger transition to Pending Review screen
            }}
          />
        </div>
      </div>
    </div>
  );
};
