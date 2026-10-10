import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { School } from '../../types';
import {
  GraduationCap,
  Building2,
  MapPin,
  Phone,
  User,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  ExternalLink,
  School as SchoolIcon,
  FlaskConical,
  Library,
} from 'lucide-react';

export const SchoolsDirectory: React.FC = () => {
  const { schools, expenses, isSuperAdmin, isDataOperator, addSchool, updateSchool } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New School Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Class',
    city: 'Kolkata',
    address: '',
    contactPerson: '',
    contactPhone: '',
    isActive: true,
  });

  const cities = Array.from(new Set(schools.map((s) => s.city)));

  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesCity = cityFilter === 'ALL' || s.city === cityFilter;
    return matchesSearch && matchesCat && matchesCity;
  });

  // Analytics
  const totalSchools = schools.length;
  const classCount = schools.filter((s) => s.category === 'Class').length;
  const labCount = schools.filter((s) => s.category === 'Lab').length;
  const institutionCount = schools.filter((s) => s.category === 'Institution').length;

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('School / Institution Name is required.');
      return;
    }
    if (!formData.city.trim()) {
      setFormError('City is required.');
      return;
    }

    try {
      await addSchool({
        name: formData.name.trim(),
        category: formData.category,
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        contactPerson: formData.contactPerson.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        isActive: formData.isActive,
      });

      setIsAddModalOpen(false);
      setFormError(null);
      setFormData({
        name: '',
        category: 'Class',
        city: 'Kolkata',
        address: '',
        contactPerson: '',
        contactPhone: '',
        isActive: true,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to add school');
    }
  };

  const getVisitCountForSchool = (schoolId: string) => {
    return expenses.filter((e) => e.schoolId === schoolId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <SchoolIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Partner Schools & Field Sites Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Master database of affiliated schools, innovation labs, and STEM curriculum partner centers
              </p>
            </div>
          </div>
        </div>

        {(isSuperAdmin || isDataOperator) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner School</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Centers</span>
            <span className="p-1.5 bg-slate-100 rounded-md text-slate-700">
              <SchoolIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalSchools}</span>
            <span className="text-xs text-slate-500">active partners</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200/70 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Class Centers</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{classCount}</span>
            <span className="text-xs text-emerald-600">curriculum partners</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-indigo-200/70 shadow-2xs bg-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 uppercase tracking-wider">STEM Labs</span>
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <FlaskConical className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700">{labCount}</span>
            <span className="text-xs text-indigo-600">robotics & tech labs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200/70 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Institutions</span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
              <Library className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{institutionCount}</span>
            <span className="text-xs text-amber-600">educational trusts</span>
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
            placeholder="Search school name, city, or address..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="Class">Class</option>
            <option value="Lab">Lab</option>
            <option value="Institution">Institution</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* School Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const visitCount = getVisitCountForSchool(school.id);
          return (
            <div
              key={school.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      school.category === 'Class'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : school.category === 'Lab'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {school.category}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active Partner</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{school.name}</h3>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600 leading-snug">
                      {school.address || `${school.city}, India`}
                    </span>
                  </div>

                  {school.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-600">{school.contactPerson}</span>
                    </div>
                  )}

                  {school.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-600 font-mono">{school.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>City: <strong>{school.city}</strong></span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  {visitCount} field {visitCount === 1 ? 'claim' : 'claims'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add School Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Partner School / Site</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School / Center Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. THE NEWTOWN SCHOOL"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value="Class">Class</option>
                    <option value="Lab">Lab</option>
                    <option value="Institution">Institution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Kolkata, Bengaluru"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Street address, area, postal code"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
                    placeholder="Principal / Coordinator"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="+91 33 2986 0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Save Partner Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
