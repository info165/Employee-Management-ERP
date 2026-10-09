import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  Users,
  FileCheck2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  FileQuestion,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
}

export const OperatorDashboard: React.FC<Props> = ({ onNavigate }) => {
  const {
    employees,
    documents,
    attendanceRecords,
    requests,
  } = useAuth();

  const totalEmployees = employees.length;
  const pendingDocs = documents.filter((d) => d.verificationStatus === 'PENDING').length;
  const underReviewEmployees = employees.filter((e) => e.onboardingStatus === 'UNDER_REVIEW' || e.onboardingStatus === 'SUBMITTED').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const lateArrivals = todayRecords.filter((r) => r.lateArrivalMinutes > 0);
  const fieldVisits = todayRecords.filter((r) => r.workMode === 'FIELD');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
              <span>Data Operator Portal</span>
              <span>·</span>
              <span>Operations & Attendance Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Staff Administration & Field Attendance Desk
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage onboarding documents, review GPS field timestamps, and perform authorized attendance corrections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Clock className="w-4 h-4" />
              <span>Review Register</span>
            </button>
            <button
              onClick={() => onNavigate('employees')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Employee Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Strictly Non-Financial) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Onboarding Queue</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{underReviewEmployees}</div>
          <p className="text-xs text-slate-500 mt-2">
            Candidates awaiting verification
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Pending Documents</span>
            <FileQuestion className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingDocs}</div>
          <p className="text-xs text-slate-500 mt-2">
            Aadhaar / PAN / Cheques to verify
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Today's Field Visits</span>
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{fieldVisits.length}</div>
          <p className="text-xs text-slate-500 mt-2">
            Trainers on school field locations
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-medium">Attendance Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{lateArrivals.length}</div>
          <p className="text-xs text-slate-500 mt-2">
            Late check-ins or flag reviews
          </p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Document Verification Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Document Verification Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory documents with masked numbers
              </p>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {documents.slice(0, 4).map((doc) => {
              const emp = employees.find((e) => e.id === doc.employeeId);
              return (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{doc.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      <span>{emp?.fullName || 'Candidate'}</span>
                      <span className="mx-1.5">·</span>
                      <span className="font-mono text-slate-600">{doc.maskedIdentifier || doc.fileName}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        doc.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : doc.verificationStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Field Visits & GPS Location Feeds */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Today's Field Attendance Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trainers visiting schools and institutions
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {fieldVisits.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{rec.employeeName}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(rec.checkInTime).toLocaleTimeString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                {rec.checkInLocation && (
                  <div className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">{rec.checkInLocation.address || 'Field Location'}</p>
                      <p className="font-mono text-slate-400 text-[10px]">
                        Accuracy: {rec.checkInLocation.accuracy.toFixed(1)}m · GPS: {rec.checkInLocation.lat.toFixed(4)}, {rec.checkInLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}
                {rec.remarks && (
                  <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                    Note: "{rec.remarks}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
