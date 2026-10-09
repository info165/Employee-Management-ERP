import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SalaryStructure } from '../../types';
import { formatINR, formatDateIndian } from '../../lib/exportUtils';
import {
  Building,
  Plus,
  Edit2,
  ShieldCheck,
  Landmark,
  Save,
  X,
  CreditCard,
} from 'lucide-react';

export const SalaryStructures: React.FC = () => {
  const {
    salaryStructures,
    employees,
    saveSalaryStructure,
    isSuperAdmin,
  } = useAuth();

  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');

  // Form states
  const [basicSalary, setBasicSalary] = useState(50000);
  const [hra, setHra] = useState(25000);
  const [specialAllowance, setSpecialAllowance] = useState(15000);
  const [conveyanceAllowance, setConveyanceAllowance] = useState(3000);
  const [medicalAllowance, setMedicalAllowance] = useState(2000);
  const [pfApplicable, setPfApplicable] = useState(true);
  const [pfDeduction, setPfDeduction] = useState(1800);
  const [esiApplicable, setEsiApplicable] = useState(false);
  const [esiDeduction, setEsiDeduction] = useState(0);
  const [tdsDeduction, setTdsDeduction] = useState(5000);
  const [professionalTax, setProfessionalTax] = useState(200);
  const [bankName, setBankName] = useState('ICICI Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('000201594102');
  const [bankIfsc, setBankIfsc] = useState('ICIC0000002');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">Salary structures and financial data are strictly segregated.</p>
      </div>
    );
  }

  const grossCalculated =
    Number(basicSalary) +
    Number(hra) +
    Number(specialAllowance) +
    Number(conveyanceAllowance) +
    Number(medicalAllowance);

  const deductionsCalculated =
    (pfApplicable ? Number(pfDeduction) : 0) +
    (esiApplicable ? Number(esiDeduction) : 0) +
    Number(tdsDeduction) +
    Number(professionalTax);

  const netCalculated = Math.max(0, grossCalculated - deductionsCalculated);

  const handleOpenEdit = (struct: SalaryStructure) => {
    setEditingStructure(struct);
    setSelectedEmpId(struct.employeeId);
    setBasicSalary(struct.basicSalary);
    setHra(struct.hra);
    setSpecialAllowance(struct.specialAllowance);
    setConveyanceAllowance(struct.conveyanceAllowance);
    setMedicalAllowance(struct.medicalAllowance);
    setPfApplicable(struct.pfApplicable);
    setPfDeduction(struct.pfDeduction);
    setEsiApplicable(struct.esiApplicable);
    setEsiDeduction(struct.esiDeduction);
    setTdsDeduction(struct.tdsDeduction);
    setProfessionalTax(struct.professionalTax);
    setBankName(struct.bankName);
    setBankAccountNumber(struct.bankAccountNumber);
    setBankIfsc(struct.bankIfsc);
    setEffectiveFrom(struct.effectiveFrom);
  };

  const handleOpenNew = () => {
    const defaultEmp = employees[0];
    setEditingStructure({
      id: '',
      employeeId: defaultEmp.id,
      employeeNumber: defaultEmp.employeeNumber || 'UNASSIGNED',
      employeeName: defaultEmp.fullName,
      effectiveFrom: new Date().toISOString().split('T')[0],
      basicSalary: 40000,
      hra: 20000,
      specialAllowance: 10000,
      conveyanceAllowance: 3000,
      medicalAllowance: 2000,
      otherEarnings: 0,
      pfApplicable: true,
      pfDeduction: 1800,
      esiApplicable: false,
      esiDeduction: 0,
      tdsDeduction: 3000,
      professionalTax: 200,
      otherDeductions: 0,
      grossSalary: 75000,
      netSalary: 70000,
      bankName: 'ICICI Bank',
      bankAccountNumber: '',
      bankIfsc: 'ICIC0000002',
      accountHolderName: defaultEmp.fullName,
      createdAt: '',
      updatedAt: '',
    });
    setSelectedEmpId(defaultEmp.id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
    await saveSalaryStructure({
      employeeId: targetEmp.id,
      employeeNumber: targetEmp.employeeNumber || 'UNASSIGNED',
      employeeName: targetEmp.fullName,
      effectiveFrom,
      basicSalary: Number(basicSalary),
      hra: Number(hra),
      specialAllowance: Number(specialAllowance),
      conveyanceAllowance: Number(conveyanceAllowance),
      medicalAllowance: Number(medicalAllowance),
      otherEarnings: 0,
      pfApplicable,
      pfDeduction: Number(pfDeduction),
      esiApplicable,
      esiDeduction: Number(esiDeduction),
      tdsDeduction: Number(tdsDeduction),
      professionalTax: Number(professionalTax),
      otherDeductions: 0,
      grossSalary: grossCalculated,
      netSalary: netCalculated,
      bankName,
      bankAccountNumber,
      bankIfsc,
      accountHolderName: targetEmp.fullName,
    });
    setEditingStructure(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CONFIDENTIAL COMPENSATION LEDGER (SUPER ADMIN ONLY)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Employee Salary Structures & Bank Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configurable monthly earning components, statutory deductions (PF/ESI/TDS/PT), and disbursement bank details.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Salary Profile</span>
        </button>
      </div>

      {/* Salary Structures Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff Member</th>
                <th className="py-3 px-4 font-semibold">Effective From</th>
                <th className="py-3 px-4 font-semibold">Basic</th>
                <th className="py-3 px-4 font-semibold">HRA</th>
                <th className="py-3 px-4 font-semibold">Allowances</th>
                <th className="py-3 px-4 font-semibold">Gross Salary</th>
                <th className="py-3 px-4 font-semibold">Deductions</th>
                <th className="py-3 px-4 font-semibold">Net Pay</th>
                <th className="py-3 px-4 font-semibold">Disbursement Bank</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaryStructures.map((struct) => (
                <tr key={struct.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{struct.employeeName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{struct.employeeNumber}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {formatDateIndian(struct.effectiveFrom)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatINR(struct.basicSalary)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatINR(struct.hra)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatINR(
                      struct.specialAllowance + struct.conveyanceAllowance + struct.medicalAllowance
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {formatINR(struct.grossSalary)}
                  </td>
                  <td className="py-3 px-4 font-mono text-rose-600">
                    {formatINR(struct.grossSalary - struct.netSalary)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                    {formatINR(struct.netSalary)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{struct.bankName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {struct.bankAccountNumber} · {struct.bankIfsc}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(struct)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Salary Structure Modal */}
      {editingStructure && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" />
                <span>Configure Employee Salary Structure & Bank Profile</span>
              </h2>
              <button
                onClick={() => setEditingStructure(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Staff Member *</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeNumber || 'ID Pending'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-900 flex justify-between items-center">
                  <span>Monthly Earnings Components (INR)</span>
                  <span className="text-emerald-700 font-mono">Gross: {formatINR(grossCalculated)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Basic Salary *</label>
                    <input
                      type="number"
                      required
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">HRA (40-50% Basic)</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Special Allowance</label>
                    <input
                      type="number"
                      value={specialAllowance}
                      onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Conveyance Allowance</label>
                    <input
                      type="number"
                      value={conveyanceAllowance}
                      onChange={(e) => setConveyanceAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Medical Allowance</label>
                    <input
                      type="number"
                      value={medicalAllowance}
                      onChange={(e) => setMedicalAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-900 flex justify-between items-center">
                  <span>Statutory & Configured Deductions (INR)</span>
                  <span className="text-rose-600 font-mono">Deductions: {formatINR(deductionsCalculated)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Provident Fund (PF)</label>
                    <input
                      type="number"
                      value={pfDeduction}
                      onChange={(e) => setPfDeduction(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">ESI Deduction</label>
                    <input
                      type="number"
                      value={esiDeduction}
                      onChange={(e) => setEsiDeduction(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">TDS / Income Tax</label>
                    <input
                      type="number"
                      value={tdsDeduction}
                      onChange={(e) => setTdsDeduction(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Professional Tax (PT)</label>
                    <input
                      type="number"
                      value={professionalTax}
                      onChange={(e) => setProfessionalTax(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details for ICICI Bank Salary Export */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  <span>Salary Disbursement Bank Account (Used in ICICI Bulk Upload)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Bank IFSC *</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">Net Monthly Salary Payable:</span>
                <span className="font-mono font-bold text-emerald-800 text-base">
                  {formatINR(netCalculated)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Salary Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
