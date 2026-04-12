/**
 * app/admin/page.tsx
 *
 * Admin Dashboard — real-time stats, filterable registration table,
 * payment screenshot viewer (via 15-min signed URLs), verify/reject actions,
 * and CSV export.
 *
 * SECURITY:
 *  - All data fetched from server-side API endpoints (not Firestore directly)
 *  - Screenshot viewing fetches a fresh signed URL each time (15-min TTL)
 *  - User-generated text rendered with React curly braces (auto-escaped)
 *  - Admin actions use POST with server-side session verification
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, CheckCircle, Clock, XCircle, Download,
  Search, RefreshCw, Eye, Check, X, ChevronDown,
  AlertCircle, Filter, ExternalLink, Activity
} from 'lucide-react';
import type { Registration, DashboardStats, RegistrationStatus } from '@/types';

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: typeof Users; color: string;
}) {
  return (
    <div
      className="p-6 rounded-2xl group transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
        <div
          className="p-2 rounded-lg transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black text-white group-hover:text-glow transition-all" style={{ '--glow-color': color } as React.CSSProperties}>{value.toLocaleString()}</p>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RegistrationStatus }) {
  const map = {
    PENDING: { label: 'Pending', cls: 'badge-cyan', icon: Clock },
    VERIFIED: { label: 'Verified', cls: 'badge-green', icon: CheckCircle },
    REJECTED: { label: 'Rejected', cls: 'badge-red', icon: XCircle },
  };
  const { label, cls, icon: Icon } = map[status];

  return (
    <span className={`badge ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── Screenshot Viewer Modal ───────────────────────────────────────────────────
function ScreenshotModal({
  path,
  onClose,
}: { path: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch a fresh 15-minute signed URL from the server
    fetch('/api/admin/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUrl(data.signedUrl);
        } else {
          setError(data.message || 'Failed to load screenshot. Try again.');
        }
      })
      .catch(() => {
        setError('Network error loading screenshot.');
      })
      .finally(() => setLoading(false));
  }, [path]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-semibold text-white text-sm">Payment Screenshot</p>
            <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> URL expires in 15 minutes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                title="View Full Size (New Tab)"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center h-48 gap-2 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
              Generating secure URL...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Payment screenshot"
              className="w-full rounded-xl max-h-[70vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCsv(registrations: Registration[]) {
  const headers = ['ID', 'Team Name', 'Size', 'Track', 'Leader Name', 'Leader Email', 'Phone', 'Status', 'Submitted At'];
  const rows = registrations.map(r => [
    r.id,
    `"${r.teamName.replace(/"/g, '""')}"`,
    r.teamSize,
    r.track,
    `"${r.leaderName.replace(/"/g, '""')}"`,
    r.leaderEmail,
    r.leaderPhone,
    r.status,
    r.submittedAt,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `hack0clock-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalTeams: 0, verified: 0, pending: 0, rejected: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [viewingPath, setViewingPath] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Fetch registrations ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/registrations?${params}`);
      const data = await res.json();

      if (data.success) {
        const list: Registration[] = data.data;
        setRegistrations(list);

        // Compute stats client-side from the returned data
        const verified = list.filter(r => r.status === 'VERIFIED').length;
        const pending = list.filter(r => r.status === 'PENDING').length;
        const rejected = list.filter(r => r.status === 'REJECTED').length;
        setStats({
          totalTeams: list.length,
          verified,
          pending,
          rejected,
          totalRevenue: list.filter(r => r.status === 'VERIFIED').reduce((acc, r) => acc + (r.teamSize * 350), 0),
        });
      }
    } catch {
      showToast('Failed to fetch registrations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Verify / Reject action ────────────────────────────────────────────────
  const handleAction = async (id: string, action: 'VERIFY' | 'REJECT') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: id, action }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchData(); // Refresh data
      } else {
        showToast(data.message ?? 'Action failed.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const TRACK_LABELS: Record<string, string> = {
    AI_ML: 'AI/ML',
    WEB3_BLOCKCHAIN: 'Web3',
    CYBERSECURITY: 'Security',
    HEALTHTECH: 'HealthTech',
    FINTECH: 'FinTech',
    OPEN_INNOVATION: 'Open',
  };

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            Hack0&apos;Clock <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-ghost text-sm py-2"
            disabled={loading}
            id="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => exportCsv(registrations)}
            className="btn-primary text-sm py-2"
            disabled={registrations.length === 0}
            id="export-csv-btn"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teams" value={stats.totalTeams} icon={Users} color="#06b6d4" />
        <StatCard label="Verified" value={stats.verified} icon={CheckCircle} color="#22c55e" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="#06b6d4" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="#ef4444" />
      </div>

      {/* Revenue card */}
      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{ background: 'rgba(6, 182, 212,0.04)', border: '1px solid rgba(6, 182, 212,0.12)' }}
      >
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Total Verified Revenue</p>
            <p className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="h-10 w-px bg-zinc-800 hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Pricing Model</p>
            <p className="text-sm font-semibold text-zinc-300">₹350 <span className="text-zinc-500 font-normal">per head</span></p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium">{stats.verified} Verified Teams</p>
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
            <Activity className="w-3 h-3" /> Live Updates
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="search"
              className="input-field"
              style={{ paddingLeft: '48px' }}
              placeholder="Search team name, email, leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="admin-search"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <select
              className="input-field appearance-none cursor-pointer min-w-[180px]"
              style={{ paddingLeft: '48px', paddingRight: '40px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              id="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-zinc-400">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
            Loading registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500">
            <Users className="w-8 h-8" />
            <p>No registrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Leader</th>
                  <th>Track</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    {/* Team name — rendered with React (auto-escaped) */}
                    <td>
                      <div>
                        <p className="font-semibold text-white text-sm">{reg.teamName}</p>
                        <p className="text-xs text-zinc-600 font-mono mt-0.5">{reg.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-zinc-200">{reg.leaderName}</p>
                        <p className="text-xs text-zinc-500">{reg.leaderEmail}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">
                        {TRACK_LABELS[reg.track] ?? reg.track}
                      </span>
                    </td>
                    <td>
                      <span className="text-zinc-400 text-sm">{reg.teamSize}</span>
                    </td>
                    <td>
                      <StatusBadge status={reg.status} />
                    </td>
                    <td>
                      <span className="text-zinc-500 text-xs">
                        {new Date(reg.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* View screenshot */}
                        <button
                          onClick={() => setViewingPath(reg.paymentScreenshotPath)}
                          className="p-2 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                          title="View payment screenshot"
                          id={`view-screenshot-${reg.id}`}
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* Verify */}
                        {reg.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleAction(reg.id, 'VERIFY')}
                            disabled={actionLoading === reg.id}
                            className="p-2 rounded-lg text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
                            title="Verify payment"
                            id={`verify-${reg.id}`}
                          >
                            {actionLoading === reg.id
                              ? <RefreshCw className="w-5 h-5 animate-spin" />
                              : <Check className="w-5 h-5" />
                            }
                          </button>
                        )}

                        {/* Reject */}
                        {reg.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleAction(reg.id, 'REJECT')}
                            disabled={actionLoading === reg.id}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                            title="Reject registration"
                            id={`reject-${reg.id}`}
                          >
                            {actionLoading === reg.id
                              ? <RefreshCw className="w-5 h-5 animate-spin" />
                              : <X className="w-5 h-5" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        <div
          className="px-4 py-3 flex items-center justify-between border-t text-xs text-zinc-600"
          style={{ borderColor: 'var(--border)' }}
        >
          <span>{registrations.length} record{registrations.length !== 1 ? 's' : ''} shown</span>
          <span>Data refreshes on demand — click Refresh for latest</span>
        </div>
      </div>

      {/* ── Screenshot Modal ──────────────────────────────────────────────── */}
      {viewingPath && (
        <ScreenshotModal path={viewingPath} onClose={() => setViewingPath(null)} />
      )}

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
            }
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
