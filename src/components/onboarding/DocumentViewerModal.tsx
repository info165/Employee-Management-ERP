import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Employee, EmployeeDocument } from '../../types';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  FileCheck2,
  X,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface Props {
  employee: Employee;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<Props> = ({ employee, onClose }) => {
  const { documents, updateDocumentStatus, isSuperAdmin, isDataOperator } = useAuth();

  const empDocs = documents.filter((d) => d.employeeId === employee.id);
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [activePreviewDoc, setActivePreviewDoc] = useState<EmployeeDocument | null>(null);

  const handleVerify = async (docId: string) => {
    await updateDocumentStatus(docId, 'VERIFIED');
  };

  const handleReject = async (docId: string) => {
    const remarks = remarksMap[docId] || 'Document details illegible or unverified.';
    await updateDocumentStatus(docId, 'REJECTED', remarks);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              <span>Statutory Documents Verification Desk</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Employee: <span className="font-semibold text-slate-800">{employee.fullName}</span> ({employee.employeeNumber || 'ID Pending'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Privacy & Masking Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-start gap-2">
            <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Privacy & PII Protection Active</p>
              <p className="text-[11px] text-slate-500">
                Aadhaar UID numbers, PAN numbers, and bank account credentials are displayed with standard regulatory masking (XXXX-XXXX-1234).
              </p>
            </div>
          </div>

          {empDocs.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No documents uploaded yet for this candidate.
            </div>
          ) : (
            <div className="space-y-3">
              {empDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB · Uploaded {formatDateIndian(doc.uploadedAt)}
                          {doc.fileUrl && (
                            <>
                              {' · '}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View file
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded self-start sm:self-auto ${
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

                  {/* Masked ID if applicable */}
                  {doc.maskedIdentifier && (
                    <div className="bg-slate-50 p-2 rounded-md font-mono text-[11px] text-slate-700 flex items-center justify-between">
                      <span>Masked Identifier: {doc.maskedIdentifier}</span>
                      <span className="text-[10px] text-slate-400">Encrypted at rest</span>
                    </div>
                  )}

                  {doc.verificationRemarks && (
                    <div className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded border border-rose-100 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Remarks: {doc.verificationRemarks}</span>
                    </div>
                  )}

                  {/* Operator Verification Action Controls */}
                  {(isSuperAdmin || isDataOperator) && doc.verificationStatus !== 'VERIFIED' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rejection remarks (if applicable)..."
                        value={remarksMap[doc.id] || ''}
                        onChange={(e) =>
                          setRemarksMap({ ...remarksMap, [doc.id]: e.target.value })
                        }
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerify(doc.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleReject(doc.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
