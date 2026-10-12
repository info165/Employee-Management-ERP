import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
  FileCheck2,
  Eye,
  ShieldAlert,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import { ApprovalModal } from './ApprovalModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { BankProfileModal } from './BankProfileModal';

interface Props {
  onOpenNewOnboarding: () => void;
}

export const EmployeeDirectory: React.FC<Props> = ({ onOpenNewOnboarding }) => {
  const { employees, isSuperAdmin, isDataOperator } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [workModeFilter, setWorkModeFilter] = useState('ALL');

  const [selectedForApproval, setSelectedForApproval] = useState<Employee | null>(null);
  const [selectedForDocs, setSelectedForDocs] = useState<Employee | null>(null);
  const [selectedForBank, setSelectedForBank] = useState<Employee | null>(null);

  // Departments list
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.onboardingStatus === statusFilter;
    const matchesMode = workModeFilter === 'ALL' || emp.assignedWorkMode === workModeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Employee Directory & Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage staff profiles, verification documents, and onboarding approvals.
          </p>
        </div>

        <button
          onClick={onOpenNewOnboarding}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-2 self-start shadow-xs"
        >
          <span>+ Onboard New Employee</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Work Mode */}
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Work Modes</option>
              <option value="OFFICE">Office</option>
              <option value="WFH">WFH</option>
              <option value="FIELD">Field Visits</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved & Active</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="CHANGES_REQUIRED">Changes Required</option>
            </select>
          </div>
        </div>

        {isDataOperator && (
          <div className="text-[11px] text-slate-500 bg-blue-50/60 border border-blue-100 p-2 rounded-md flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Data Operator Policy: Confidential Aadhaar, PAN, and Bank details are masked. Financial and salary structures are restricted.
            </span>
          </div>
        )}
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Department & Role</th>
                <th className="py-3 px-4 font-semibold">Work Mode</th>
                <th className="py-3 px-4 font-semibold">Joining Date</th>
                <th className="py-3 px-4 font-semibold">Banking Profile</th>
                <th className="py-3 px-4 font-semibold">Onboarding Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No employee records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {emp.employeeNumber || (
                        <span className="text-amber-600 font-normal italic">Pending Approval</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold shrink-0">
                            {emp.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{emp.fullName}</div>
                          <div className="text-[11px] text-slate-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{emp.designation}</div>
                      <div className="text-[11px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-medium text-slate-700">
                        {emp.assignedWorkMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDateIndian(emp.dateOfJoining)}
                    </td>
                    <td className="py-3 px-4">
                      {emp.bankDetails ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              emp.bankDetails.transactionRoute === 'WIB'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}>
                              {emp.bankDetails.transactionRoute}
                            </span>
                            <span className="font-sans font-medium text-slate-800 truncate max-w-[90px]">
                              {emp.bankDetails.bankName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>A/C ...{emp.bankDetails.bankAccountNumber.slice(-4)}</span>
                            {emp.bankDetails.verificationStatus === 'VERIFIED' ? (
                              <span className="text-emerald-600 font-bold">✓</span>
                            ) : (
                              <span className="text-amber-600 font-bold">⚠</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          emp.onboardingStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : emp.onboardingStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700'
                            : emp.onboardingStatus === 'CHANGES_REQUIRED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {emp.onboardingStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedForBank(emp)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                          title="View and verify banking profile & ICICI routing"
                        >
                          <Landmark className="w-3.5 h-3.5 text-amber-600" />
                          <span>Bank</span>
                        </button>

                        <button
                          onClick={() => setSelectedForDocs(emp)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                          title="View uploaded statutory documents"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Docs</span>
                        </button>

                        {isSuperAdmin && emp.onboardingStatus !== 'APPROVED' && (
                          <button
                            onClick={() => setSelectedForApproval(emp)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {selectedForApproval && (
        <ApprovalModal
          employee={selectedForApproval}
          onClose={() => setSelectedForApproval(null)}
        />
      )}

      {/* Document Viewer Modal */}
      {selectedForDocs && (
        <DocumentViewerModal
          employee={selectedForDocs}
          onClose={() => setSelectedForDocs(null)}
        />
      )}

      {/* Bank Profile Modal */}
      {selectedForBank && (
        <BankProfileModal
          employee={selectedForBank}
          onClose={() => setSelectedForBank(null)}
        />
      )}
    </div>
  );
};
