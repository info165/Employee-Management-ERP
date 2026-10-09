import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentType } from '../../types';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  FileCheck2,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Shield,
  Plus,
} from 'lucide-react';

export const MyDocuments: React.FC = () => {
  const { currentEmployee, documents, uploadDocument } = useAuth();

  const myDocs = documents.filter((d) => d.employeeId === currentEmployee?.id);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('EDUCATION');
  const [title, setTitle] = useState('');
  const [maskedId, setMaskedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    setSubmitting(true);
    try {
      await uploadDocument({
        employeeId: currentEmployee.id,
        userId: currentEmployee.userId,
        docType,
        title: title || `${docType.replace('_', ' ')} Document`,
        fileName: `${docType.toLowerCase()}_upload.pdf`,
        fileSize: 420000,
        mimeType: 'application/pdf',
        maskedIdentifier: maskedId || undefined,
        verificationStatus: 'PENDING',
      });
      setShowUploadModal(false);
      setTitle('');
      setMaskedId('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Statutory & Identity Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View verification status for your uploaded Aadhaar, PAN, educational, and bank proofs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shadow-xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-900">Zero-Trust Employee Document Vault</h4>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Your uploaded files are encrypted and accessible strictly to authorized HR verification personnel. Numbers are automatically masked.
          </p>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{doc.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                  doc.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : doc.verificationStatus === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {doc.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3" />}
                {doc.verificationStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                {doc.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                <span>{doc.verificationStatus}</span>
              </span>
            </div>

            {doc.maskedIdentifier && (
              <div className="p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-700 flex justify-between">
                <span>ID: {doc.maskedIdentifier}</span>
                <span className="text-[10px] text-slate-400">Masked</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
              <span>Uploaded: {formatDateIndian(doc.uploadedAt)}</span>
              {doc.verifiedBy && <span>Verified by HR Desk</span>}
            </div>

            {doc.verificationRemarks && (
              <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                Remarks: {doc.verificationRemarks}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">Upload Identity or Academic Proof</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Document Category *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="EDUCATION">Degree / Educational Certificate</option>
                  <option value="EXPERIENCE">Previous Employment Proof</option>
                  <option value="ADDRESS_PROOF">Address Proof</option>
                  <option value="OFFER_LETTER">Signed Offer Letter</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Science Degree Certificate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Masked Number / Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Certificate Reg. No. ending in 4102"
                  value={maskedId}
                  onChange={(e) => setMaskedId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-[11px] text-slate-600 font-medium block">
                  Select File (PDF, PNG, JPG up to 10MB)
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  {submitting ? 'Uploading...' : 'Submit to HR Desk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
