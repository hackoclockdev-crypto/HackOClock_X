'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, Inbox, Mail, AlertCircle
} from 'lucide-react';
import type { ContactSubmission } from '@/types';

export default function MessagesDashboard() {
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL('/api/admin/messages', window.location.origin);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
      setMessages(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Contact Messages
          </h1>
          <p className="text-zinc-400 font-medium tracking-wide">
            View public inquiries from the HackO&apos;Clock site.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMessages()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            />
          </div>

          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="btn-ghost"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Failed to load messages</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      ) : (
        /* ── Table ── */
        <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-zinc-500 font-bold bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-4 border-b border-white/5">Sender</th>
                  <th className="px-6 py-4 border-b border-white/5">Subject</th>
                  <th className="px-6 py-4 border-b border-white/5">Message & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5" style={{ background: 'var(--surface)' }}>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6"><div className="h-4 bg-zinc-800 rounded w-32" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-zinc-800 rounded w-48" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-zinc-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Inbox className="w-8 h-8 opacity-50" />
                        <p>{search ? 'No messages match your search.' : 'No messages received yet.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white break-words">{msg.name}</div>
                        <div className="text-zinc-500 text-xs flex items-center gap-1 mt-1 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <a href={`mailto:${msg.email}`} className="hover:text-cyan-400 hover:underline">{msg.email}</a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-300 max-w-sm truncate" title={msg.subject}>
                          {msg.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 w-1/2">
                        <p className="text-zinc-400 whitespace-pre-wrap break-words leading-relaxed text-xs">
                          {msg.message}
                        </p>
                        <div className="text-zinc-600 text-[10px] uppercase font-bold mt-3 tracking-widest">
                          {new Date(msg.submittedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
