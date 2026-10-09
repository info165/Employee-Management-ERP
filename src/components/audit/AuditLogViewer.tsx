import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndian } from '../../lib/exportUtils';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
        <h2 className="font-bold text-base">Restricted Access: Super Admin Only</h2>
        <p className="text-xs mt-1">Audit trail inspection is restricted to authorized super administrators.</p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actingUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = targetTypeFilter === 'ALL' || log.targetType === targetTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IMMUTABLE GOVERNANCE AUDIT LEDGER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Security & Operations Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Traceable timeline of sensitive staff modifications, attendance corrections, and ICICI bank export operations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, users, or summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          <option value="EMPLOYEE">Employee Lifecycle</option>
          <option value="ATTENDANCE">Attendance & Corrections</option>
          <option value="PAYROLL">Payroll Approvals</option>
          <option value="BANK_EXPORT">ICICI Bank Exports</option>
          <option value="SECURITY">Role Switches & Auth</option>
          <option value="SETTINGS">System Settings</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp (IST)</th>
                <th className="py-3 px-4 font-semibold">Acting User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Action Type</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Outcome</th>
                <th className="py-3 px-4 font-semibold">Event Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateIndian(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actingUserName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actingUserId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-semibold text-slate-700">
                        {log.actingUserRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {log.targetType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-medium">
                        {log.outcome === 'SUCCESS' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 text-[11px]">SUCCESS</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-rose-700 text-[11px]">FAILURE</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-sm">
                      <p className="leading-snug">{log.summary}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
