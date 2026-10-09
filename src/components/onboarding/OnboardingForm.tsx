import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmploymentType, WorkMode, DocumentType } from '../../types';
import {
  User,
  Briefcase,
  FileCheck2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Upload,
} from 'lucide-react';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const OnboardingForm: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const { addEmployee, uploadDocument } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Parent');

  // Step 2: Employment Info
  const [department, setDepartment] = useState('Academics & Training');
  const [designation, setDesignation] = useState('Junior STEM Trainer');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('Bengaluru / Field Sites');
  const [reportingManager, setReportingManager] = useState('Vikas Nambiar');
  const [assignedWorkMode, setAssignedWorkMode] = useState<WorkMode>('FIELD');
  const [standardWorkingHours, setStandardWorkingHours] = useState(8);

  // Step 3: Statutory Uploads
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [uploadedDocsList, setUploadedDocsList] = useState<{ type: DocumentType; name: string }[]>([
    { type: 'AADHAAR', name: 'aadhaar_card_scanned.pdf' },
    { type: 'PAN', name: 'pan_card_scanned.pdf' },
    { type: 'CANCELLED_CHEQUE', name: 'cancelled_cheque.pdf' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newEmp = await addEmployee({
        fullName,
        email,
        mobile,
        dob,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        currentAddress,
        permanentAddress: permanentAddress || currentAddress,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        department,
        designation,
        employmentType,
        dateOfJoining,
        workLocation,
        reportingManager,
        assignedWorkMode,
        standardWorkingHours,
        weeklyOff: ['Sunday'],
        employmentStatus: 'PROBATION',
        onboardingStatus: 'UNDER_REVIEW', // Ready for Super Admin review & approval
      });

      // Upload statutory docs
      const maskedAadhaar = aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-4912';
      const maskedPan = panNumber ? `${panNumber.slice(0, 5)}****${panNumber.slice(-1)}` : 'ABCDE****G';

      await uploadDocument({
        employeeId: newEmp.id,
        docType: 'AADHAAR',
        title: 'Aadhaar Card Copy',
        fileName: 'aadhaar_scan.pdf',
        fileSize: 450000,
        mimeType: 'application/pdf',
        maskedIdentifier: maskedAadhaar,
        verificationStatus: 'PENDING',
      });

      await uploadDocument({
        employeeId: newEmp.id,
        docType: 'PAN',
        title: 'PAN Card Copy',
        fileName: 'pan_scan.pdf',
        fileSize: 310000,
        mimeType: 'application/pdf',
        maskedIdentifier: maskedPan,
        verificationStatus: 'PENDING',
      });

      await uploadDocument({
        employeeId: newEmp.id,
        docType: 'CANCELLED_CHEQUE',
        title: 'Cancelled Cheque / Bank Passbook',
        fileName: 'bank_proof.pdf',
        fileSize: 520000,
        mimeType: 'application/pdf',
        maskedIdentifier: bankAccNumber ? `A/C Ending ...${bankAccNumber.slice(-4)}` : 'A/C Ending ...8812',
        verificationStatus: 'PENDING',
      });

      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Employee Onboarding Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collect personal information, employment terms, and statutory verification documents.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
        >
          Cancel
        </button>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
        <div
          className={`flex items-center gap-2 font-medium ${
            step >= 1 ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            1
          </div>
          <span>1. Personal Information</span>
        </div>
        <span className="text-slate-300">/</span>
        <div
          className={`flex items-center gap-2 font-medium ${
            step >= 2 ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            2
          </div>
          <span>2. Employment & Role</span>
        </div>
        <span className="text-slate-300">/</span>
        <div
          className={`flex items-center gap-2 font-medium ${
            step === 3 ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            3
          </div>
          <span>3. Statutory Documents</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                Personal Identification & Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Murthy"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="anand.murthy@funscholar.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Current Residential Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street, locality, city, pincode..."
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h3 className="font-semibold text-slate-900 mb-3">Emergency Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Geeta Murthy"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 11111"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Relationship</label>
                    <select
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName || !email || !mobile || !currentAddress) {
                      alert('Please complete all required fields.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <span>Next: Employment Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Employment Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                Employment Terms & Work Mode
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="Academics & Training">Academics & Training</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Product & Curriculum">Product & Curriculum</option>
                    <option value="Sales & School Partnerships">Sales & School Partnerships</option>
                    <option value="Operations & Admin">Operations & Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Assigned Work Mode *
                  </label>
                  <select
                    value={assignedWorkMode}
                    onChange={(e) => setAssignedWorkMode(e.target.value as WorkMode)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="OFFICE">Office (Innov8 Koramangala Hub)</option>
                    <option value="FIELD">Field Work (School Visits & Workshops)</option>
                    <option value="WFH">Work from Home (Remote)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Field employees utilize GPS timestamp capture for school location check-ins.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <span>Next: Statutory Uploads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Statutory & Documents */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                Statutory Identifiers & Document Uploads
              </h2>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Statutory Compliance & Privacy Notice</p>
                  <p>
                    All Aadhaar, PAN, and bank documents are stored in private secure cloud storage with strict zero-trust access control. Numbers are masked by default across operational registers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Aadhaar Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 542198004912"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Will be masked as XXXX-XXXX-{aadhaarNumber.slice(-4) || 'XXXX'}
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Permanent Account Number (PAN) *
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Will be masked as {panNumber.slice(0, 5) || 'ABCDE'}****{panNumber.slice(-1) || 'F'}
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Salary Bank Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 000201594102"
                    value={bankAccNumber}
                    onChange={(e) => setBankAccNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="e.g. ICIC0000002"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Uploads checklist */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-800 text-xs">
                  Attached Documents Proof (Verified Mock Storage):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]">
                    <span>Aadhaar Proof</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]">
                    <span>PAN Proof</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]">
                    <span>Cancelled Cheque</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Onboarding Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
