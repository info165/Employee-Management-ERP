import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExpenseClaim, TransportLeg, TransportMode } from '../../types';
import { formatINR, formatDateIndian, downloadCsv, downloadXlsx } from '../../lib/exportUtils';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Car,
  Bus,
  Train,
  Check,
  X,
  CreditCard,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';

export const ExpenseClaimsManager: React.FC = () => {
  const {
    expenses,
    schools,
    employees,
    activeRole,
    isSuperAdmin,
    isDataOperator,
    isEmployee,
    currentEmployee,
    submitExpense,
    saveExpenseDraft,
    reviewExpense,
    markExpensePaid,
  } = useAuth();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UNPAID' | 'PENDING_PAYMENT' | 'PAID'>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<ExpenseClaim | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtered claims based on role
  const roleVisibleClaims = isEmployee
    ? expenses.filter((c) => c.employeeId === currentEmployee?.id || c.employeeNumber === currentEmployee?.employeeNumber)
    : expenses;

  const filteredClaims = roleVisibleClaims.filter((c) => {
    const matchesSearch =
      c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || c.paymentStatus === paymentFilter;
    const matchesSchool = schoolFilter === 'ALL' || c.schoolId === schoolFilter;
    return matchesSearch && matchesStatus && matchesPayment && matchesSchool;
  });

  // Analytics Metrics
  const totalClaimsCount = roleVisibleClaims.length;
  const totalClaimAmount = roleVisibleClaims.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalApprovedAmount = roleVisibleClaims
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const pendingApprovalsCount = roleVisibleClaims.filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  const pendingApprovalsAmount = roleVisibleClaims
    .filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const paidAmount = roleVisibleClaims
    .filter((c) => c.paymentStatus === 'PAID')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  // Form State for New Claim
  const [formData, setFormData] = useState<{
    schoolId: string;
    visitDate: string;
    purposeOfVisit: string;
    notes: string;
    transportLegs: Array<{ id: string; mode: TransportMode; amount: number; distanceKm?: number; notes?: string }>;
  }>({
    schoolId: schools[0]?.id || '',
    visitDate: new Date().toISOString().split('T')[0],
    purposeOfVisit: 'Class STEM Robotics Demonstration',
    notes: '',
    transportLegs: [
      { id: 'leg-1', mode: 'Own Vehicle', amount: 90, distanceKm: 18, notes: 'Round trip 18km @ ₹5/km' },
    ],
  });

  const handleAddLeg = () => {
    setFormData((prev) => ({
      ...prev,
      transportLegs: [
        ...prev.transportLegs,
        {
          id: `leg-${Date.now()}`,
          mode: 'Auto',
          amount: 100,
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveLeg = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      transportLegs: prev.transportLegs.filter((_, i) => i !== idx),
    }));
  };

  const handleLegChange = (
    idx: number,
    field: keyof TransportLeg | 'distanceKm',
    val: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.transportLegs];
      const current = { ...updated[idx], [field]: val };

      // Helper: if mode is Own Vehicle and distance is changed, auto-calc amount @ ₹5/km
      if (field === 'distanceKm' && current.mode === 'Own Vehicle') {
        const km = Number(val) || 0;
        current.amount = Math.round(km * 5);
        current.notes = `${km}km @ ₹5/km reimbursement`;
      }

      updated[idx] = current;
      return { ...prev, transportLegs: updated };
    });
  };

  const calculateFormTotal = () => {
    return formData.transportLegs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  };

  const handleCreateSubmit = async (isDraft: boolean) => {
    const selectedSchool = schools.find((s) => s.id === formData.schoolId) || schools[0];
    if (!selectedSchool) {
      setActionError('Please select a valid partner school.');
      return;
    }
    if (!formData.visitDate) {
      setActionError('Please select a visit date.');
      return;
    }
    if (formData.transportLegs.length === 0) {
      setActionError('Please add at least one travel leg.');
      return;
    }

    try {
      const payload = {
        schoolId: selectedSchool.id,
        schoolName: selectedSchool.name,
        schoolCategory: selectedSchool.category,
        visitDate: formData.visitDate,
        purposeOfVisit: formData.purposeOfVisit,
        notes: formData.notes,
        transportLegs: formData.transportLegs.map((l) => ({
          id: l.id,
          mode: l.mode,
          amount: Number(l.amount) || 0,
          notes: l.notes,
        })),
      };

      if (isDraft) {
        await saveExpenseDraft(payload);
      } else {
        await submitExpense(payload);
      }

      setIsNewModalOpen(false);
      setActionError(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit expense claim');
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      await reviewExpense(claimId, 'APPROVED', reviewRemarks || 'Approved per travel policy');
      setSelectedClaimForReview(null);
      setReviewRemarks('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (claimId: string) => {
    if (!reviewRemarks.trim()) {
      setActionError('Please provide a reason/remark for rejection.');
      return;
    }
    try {
      await reviewExpense(claimId, 'REJECTED', reviewRemarks);
      setSelectedClaimForReview(null);
      setReviewRemarks('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject');
    }
  };

  const handleMarkPaid = async (claimId: string) => {
    try {
      await markExpensePaid(claimId, paymentReference || undefined);
      setSelectedClaimForReview(null);
      setPaymentReference('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark as paid');
    }
  };

  const exportClaimsToExcel = () => {
    const rows = filteredClaims.map((c) => ({
      'Claim ID': c.id,
      'Employee Number': c.employeeNumber,
      'Employee Name': c.employeeName,
      'Visit Date': c.visitDate,
      'School / Institution': c.schoolName,
      'Category': c.schoolCategory || '-',
      'Purpose': c.purposeOfVisit,
      'Total Amount (INR)': c.totalAmount,
      'Status': c.status,
      'Payment Status': c.paymentStatus,
      'Payment Reference': c.paymentReference || '-',
      'Submitted At': c.submittedAt ? formatDateIndian(c.submittedAt) : '-',
      'Reviewed By': c.reviewedBy || '-',
      'Reviewer Remarks': c.reviewerComments || '-',
    }));
    downloadXlsx(`FunScholar_Expense_Claims_${new Date().toISOString().split('T')[0]}.xlsx`, 'ExpenseClaims', rows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEmployee ? 'My Travel & Field Expense Claims' : 'Travel Expenses & Reimbursements'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEmployee
                  ? 'Submit transport and fuel reimbursement claims for visits to partner schools & labs'
                  : 'Manage, audit, and approve field visit travel claims, fuel allowances, and transit reimbursements'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportClaimsToExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                schoolId: schools[0]?.id || '',
                visitDate: new Date().toISOString().split('T')[0],
                purposeOfVisit: 'Class STEM Robotics Demonstration',
                notes: '',
                transportLegs: [
                  { id: 'leg-1', mode: 'Own Vehicle', amount: 90, distanceKm: 18, notes: 'Round trip 18km @ ₹5/km' },
                ],
              });
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Expense Claim</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Claims</span>
            <span className="p-1.5 bg-slate-100 rounded-md text-slate-700">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalClaimsCount}</span>
            <span className="text-xs text-slate-500">records</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Total Claimed: <strong className="text-slate-800">{formatINR(totalClaimAmount)}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200/70 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Approvals</span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{pendingApprovalsCount}</span>
            <span className="text-xs text-amber-600">claims</span>
          </div>
          <div className="mt-1 text-xs text-amber-700">
            Value: <strong>{formatINR(pendingApprovalsAmount)}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200/70 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Approved Claims</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{formatINR(totalApprovedAmount)}</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600">
            Ready for reimbursement payout
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200/70 shadow-2xs bg-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Disbursed</span>
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{formatINR(paidAmount)}</span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            Processed via corporate bank batch
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name, employee ID, school, or claim ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e: any) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          {/* School Master Filter */}
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden max-w-[180px]"
          >
            <option value="ALL">All Partner Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Claim ID & Date</th>
                <th className="py-3 px-4">Field Employee</th>
                <th className="py-3 px-4">Destination School</th>
                <th className="py-3 px-4">Visit Purpose & Legs</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Payout</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No travel expense claims found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900">{claim.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateIndian(claim.visitDate)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{claim.employeeName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{claim.employeeNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-800 truncate" title={claim.schoolName}>
                        {claim.schoolName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px] font-medium text-slate-600">
                          {claim.schoolCategory || 'School'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="text-slate-800 truncate" title={claim.purposeOfVisit}>
                        {claim.purposeOfVisit}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {claim.transportLegs.map((l) => `${l.mode}: ₹${l.amount}`).join(' • ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatINR(claim.totalAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {claim.transportLegs.length} {claim.transportLegs.length === 1 ? 'leg' : 'legs'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                          claim.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : claim.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : claim.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {claim.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {claim.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {claim.status === 'SUBMITTED' && <Clock className="w-3 h-3" />}
                        {claim.status === 'DRAFT' && <FileCheck className="w-3 h-3" />}
                        <span>{claim.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          claim.paymentStatus === 'PAID'
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : claim.paymentStatus === 'PENDING_PAYMENT'
                            ? 'bg-amber-100 text-amber-800 font-medium'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {claim.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedClaimForReview(claim)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Details Modal */}
      {selectedClaimForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Expense Claim #{selectedClaimForReview.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedClaimForReview.employeeName} ({selectedClaimForReview.employeeNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedClaimForReview(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Destination School</span>
                  <span className="font-semibold text-slate-800">{selectedClaimForReview.schoolName}</span>
                  <span className="text-slate-500 block text-[10px]">{selectedClaimForReview.schoolCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Visit Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateIndian(selectedClaimForReview.visitDate)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Purpose</span>
                  <span className="text-slate-700">{selectedClaimForReview.purposeOfVisit}</span>
                </div>
              </div>

              {/* Legs Breakdown */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Transit Legs Breakdown</span>
                  <span className="font-mono text-slate-900 font-bold">
                    Total: {formatINR(selectedClaimForReview.totalAmount)}
                  </span>
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedClaimForReview.transportLegs.map((leg, i) => (
                    <div
                      key={leg.id || i}
                      className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          {leg.mode === 'Own Vehicle' && <Car className="w-3.5 h-3.5 text-blue-500" />}
                          {leg.mode === 'Taxi/Cab' && <Car className="w-3.5 h-3.5 text-amber-500" />}
                          {leg.mode === 'Bus' && <Bus className="w-3.5 h-3.5 text-emerald-500" />}
                          {leg.mode === 'Train' && <Train className="w-3.5 h-3.5 text-indigo-500" />}
                          <span>{leg.mode}</span>
                        </div>
                        {leg.notes && <div className="text-[11px] text-slate-500 mt-0.5">{leg.notes}</div>}
                      </div>
                      <div className="font-mono font-bold text-slate-900">{formatINR(leg.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedClaimForReview.reviewerComments && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  <strong>Reviewer Remark:</strong> {selectedClaimForReview.reviewerComments}
                </div>
              )}

              {/* Audit / Action Form for Super Admin & Data Operator */}
              {!isEmployee && selectedClaimForReview.status === 'SUBMITTED' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Audit Remarks / Approval Notes:
                  </label>
                  <input
                    type="text"
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="e.g. Verified two-wheeler distance and curriculum visit..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(selectedClaimForReview.id)}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Claim ({formatINR(selectedClaimForReview.totalAmount)})</span>
                    </button>
                    <button
                      onClick={() => handleReject(selectedClaimForReview.id)}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Processing for Super Admin */}
              {isSuperAdmin &&
                selectedClaimForReview.status === 'APPROVED' &&
                selectedClaimForReview.paymentStatus !== 'PAID' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <label className="block text-[11px] font-semibold text-blue-900">
                      Disburse / Mark as Paid via ICICI Bank Batch:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="ICICI Payment Ref (e.g. CMS20261010-01)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-md"
                      />
                      <button
                        onClick={() => handleMarkPaid(selectedClaimForReview.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Confirm Payout
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Field Travel Expense Claim</h3>
                <p className="text-xs text-slate-500">
                  Record transport legs, two-wheeler fuel, or transit tickets for school demonstration visits
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Destination School */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Partner School / Field Location *
                </label>
                <select
                  value={formData.schoolId}
                  onChange={(e) => setFormData((p) => ({ ...p, schoolId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category} - {s.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Date & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData((p) => ({ ...p, visitDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose of Visit *
                  </label>
                  <input
                    type="text"
                    value={formData.purposeOfVisit}
                    onChange={(e) => setFormData((p) => ({ ...p, purposeOfVisit: e.target.value }))}
                    placeholder="e.g. Class STEM Robotics Demonstration"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Transport Legs Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Travel & Transit Legs ({formData.transportLegs.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLeg}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Leg</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.transportLegs.map((leg, idx) => (
                    <div
                      key={leg.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-700 text-[11px]">Leg #{idx + 1}</span>
                        {formData.transportLegs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLeg(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500">Mode</label>
                          <select
                            value={leg.mode}
                            onChange={(e) => handleLegChange(idx, 'mode', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                          >
                            <option value="Own Vehicle">Own Vehicle (₹5/km)</option>
                            <option value="Taxi/Cab">Taxi/Cab</option>
                            <option value="Auto">Auto</option>
                            <option value="Metro">Metro</option>
                            <option value="Bus">Bus</option>
                            <option value="Train">Train</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {leg.mode === 'Own Vehicle' ? (
                          <div>
                            <label className="block text-[10px] text-slate-500">Distance (km)</label>
                            <input
                              type="number"
                              min="1"
                              value={leg.distanceKm || ''}
                              onChange={(e) => handleLegChange(idx, 'distanceKm', e.target.value)}
                              placeholder="e.g. 18"
                              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono"
                            />
                          </div>
                        ) : null}

                        <div>
                          <label className="block text-[10px] text-slate-500">Amount (INR) *</label>
                          <input
                            type="number"
                            min="0"
                            value={leg.amount || ''}
                            onChange={(e) => handleLegChange(idx, 'amount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={leg.notes || ''}
                          onChange={(e) => handleLegChange(idx, 'notes', e.target.value)}
                          placeholder="Route description or ticket note (e.g. Round trip travel)"
                          className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-indigo-900 block">Total Claim Amount:</span>
                  <span className="text-[11px] text-indigo-700">Calculated sum of all transit legs</span>
                </div>
                <div className="font-mono text-lg font-bold text-indigo-950">
                  {formatINR(calculateFormTotal())}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateSubmit(true)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateSubmit(false)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
