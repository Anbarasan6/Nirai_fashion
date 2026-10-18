import React, { useState, useEffect, useCallback } from 'react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import {
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Server,
  Globe,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

interface OutboxItem {
  id: string;
  order_id: string;
  order_number: string;
  event_type: string;
  submission_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  attempts: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const NotificationManager: React.FC = () => {
  const { showToast } = useShop();

  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<OutboxItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outbox' | 'dns_guide' | 'smtp_guide'>('outbox');

  // Requirement A: Log clear warning on mount regarding Resend domain verification
  useEffect(() => {
    console.warn(
      '[Nirai Notifications] RESEND DOMAIN LIMITATION: Resend in sandbox mode ONLY delivers emails to the verified Resend account owner email. In order to deliver transactional emails to customers at scale, custom domain verification (SPF, DKIM, DMARC) is mandatory before launch.'
    );
  }, []);

  const fetchOutbox = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('notifications_outbox')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching outbox:', error);
        showToast('Failed to load notifications outbox', 'error');
      } else {
        setOutbox((data as OutboxItem[]) || []);
      }
    } catch (err: any) {
      console.error('Outbox query error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, showToast]);

  useEffect(() => {
    fetchOutbox();
  }, [fetchOutbox]);

  const handleDispatchNow = async () => {
    setIsDispatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        headers: {
          'x-webhook-secret': import.meta.env.VITE_NOTIFY_WEBHOOK_SECRET || '',
        },
      });

      if (error) {
        showToast(`Dispatch failed: ${error.message}`, 'error');
      } else {
        showToast(
          `Dispatch completed: ${data.sent_count ?? 0} sent, ${data.failed_count ?? 0} failed (${data.processed_count ?? 0} processed)`,
          'success'
        );
        fetchOutbox();
      }
    } catch (err: any) {
      showToast(err?.message || 'Error triggering notification dispatch', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleRetryNotification = async (item: OutboxItem) => {
    try {
      const { error } = await supabase
        .from('notifications_outbox')
        .update({
          status: 'pending',
          error_message: null,
          attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        showToast(`Retry failed: ${error.message}`, 'error');
      } else {
        showToast(`Reset notification for #${item.order_number} to pending`, 'success');
        fetchOutbox();
      }
    } catch (err: any) {
      showToast('Error resetting notification', 'error');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard', 'success');
  };

  // Mask recipient email for UI privacy (Requirement C)
  const maskEmail = (email: string) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  };

  const filteredOutbox = outbox.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.order_number.toLowerCase().includes(q) ||
      item.event_type.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q)
    );
  });

  const pendingCount = outbox.filter((i) => i.status === 'pending').length;
  const sentCount = outbox.filter((i) => i.status === 'sent').length;
  const failedCount = outbox.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-900" />
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              Notification Engine &amp; Outbox
            </h1>
          </div>
          <p className="text-stone-500 text-sm mt-1">
            Transactional email lifecycle, delivery status, Resend domain verification, and custom SMTP settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOutbox}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 text-sm font-medium transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDispatchNow}
            disabled={isDispatching}
            className="flex items-center gap-2 px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
            {isDispatching ? 'Dispatching...' : 'Dispatch Outbox Now'}
          </button>
        </div>
      </div>

      {/* Requirement A: Prominent Resend Domain Verification Alert Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-amber-900">
                CRITICAL PRE-LAUNCH REQUIREMENT: Resend Domain Verification
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900 self-start">
                Sandbox Mode Active
              </span>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Without a verified custom domain, Resend will <strong>only deliver emails to the account owner&apos;s registered email address</strong>. 
              Real customer emails will fail with an HTTP 403 authorization error. Before launching to customers, you must add and verify 
              <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono text-xs font-semibold">nirai.in</code> 
              with SPF, DKIM, and DMARC DNS records in your domain registrar (GoDaddy, Cloudflare, etc.).
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('dns_guide')}
                className="text-xs font-semibold text-amber-950 underline hover:text-amber-800 flex items-center gap-1"
              >
                View DNS Verification Setup Guide <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-amber-300">|</span>
              <button
                onClick={() => setActiveTab('smtp_guide')}
                className="text-xs font-semibold text-amber-950 underline hover:text-amber-800 flex items-center gap-1"
              >
                Supabase Auth Custom SMTP Guide &amp; Tamil Templates <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('outbox')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'outbox'
              ? 'border-amber-900 text-amber-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Outbox Queue ({outbox.length})
        </button>
        <button
          onClick={() => setActiveTab('dns_guide')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'dns_guide'
              ? 'border-amber-900 text-amber-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Domain DNS Setup (SPF / DKIM / DMARC)
        </button>
        <button
          onClick={() => setActiveTab('smtp_guide')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'smtp_guide'
              ? 'border-amber-900 text-amber-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Server className="w-4 h-4" />
          Auth SMTP &amp; Bilingual Templates
        </button>
      </div>

      {/* Tab 1: Live Outbox Queue */}
      {activeTab === 'outbox' && (
        <div className="space-y-4">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Queued</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{outbox.length}</p>
              </div>
              <Mail className="w-8 h-8 text-stone-400 opacity-60" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Pending Dispatch</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500 opacity-60" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Delivered (Sent)</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{sentCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-600 uppercase tracking-wider font-semibold">Delivery Failed</p>
                <p className="text-2xl font-bold text-rose-800 mt-1">{failedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-rose-500 opacity-60" />
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order number or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-stone-500 font-medium">Filter:</span>
              {(['all', 'pending', 'sent', 'failed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    filterStatus === status
                      ? 'bg-amber-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Outbox Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Order / Reference</th>
                    <th className="py-3 px-4 font-semibold">Event Type</th>
                    <th className="py-3 px-4 font-semibold">Recipient (Masked)</th>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Attempts</th>
                    <th className="py-3 px-4 font-semibold">Queued At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredOutbox.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        {isLoading ? 'Loading outbox notifications...' : 'No notifications found in the outbox queue.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOutbox.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3 px-4 font-medium text-stone-900">
                          #{item.order_number}
                          {item.submission_id && (
                            <span className="block text-[11px] text-stone-400 font-mono">
                              Sub: {item.submission_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-stone-100 text-stone-700">
                            {item.event_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-stone-600">
                          {maskEmail(item.recipient_email)}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-700 max-w-xs truncate" title={item.subject}>
                          {item.subject}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'sent' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800" title={item.error_message || ''}>
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-600 font-mono">
                          {item.attempts}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                              title="View details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {item.status === 'failed' && (
                              <button
                                onClick={() => handleRetryNotification(item)}
                                className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition"
                              >
                                Retry
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
        </div>
      )}

      {/* Tab 2: Domain DNS Setup Guide (SPF / DKIM / DMARC) */}
      {activeTab === 'dns_guide' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Domain DNS Records for Verified Email Delivery
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Add the following DNS records to your domain DNS manager (Cloudflare, GoDaddy, Namecheap) to verify 
              <code className="mx-1 px-1.5 py-0.5 bg-stone-100 rounded text-stone-800 font-mono font-bold">nirai.in</code> in Resend.
            </p>
          </div>

          <div className="space-y-4">
            {/* SPF Record */}
            <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 1. SPF (Sender Policy Framework) Record
                </span>
                <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-mono">TXT</span>
              </div>
              <p className="text-xs text-stone-500">
                Authorizes Resend mail servers to send transactional emails on behalf of your domain.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <span className="text-stone-400 block text-[10px]">HOST / NAME:</span>
                  <span className="text-stone-800">@ (or nirai.in)</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-stone-200 md:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 block text-[10px]">VALUE / TARGET:</span>
                    <span className="text-stone-900 font-bold">v=spf1 include:resend.com ~all</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('v=spf1 include:resend.com ~all', 'spf')}
                    className="p-1 hover:bg-stone-100 rounded text-stone-500"
                  >
                    {copiedKey === 'spf' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* DKIM Record */}
            <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 2. DKIM (DomainKeys Identified Mail) Record
                </span>
                <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-mono">TXT / CNAME</span>
              </div>
              <p className="text-xs text-stone-500">
                Cryptographically signs every outbound order email to ensure it cannot be altered in transit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <span className="text-stone-400 block text-[10px]">HOST / NAME:</span>
                  <span className="text-stone-800">resend._domainkey</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-stone-200 md:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 block text-[10px]">VALUE:</span>
                    <span className="text-stone-900 font-bold">Generated in Resend Dashboard &gt; Domains</span>
                  </div>
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-900 text-xs font-sans font-semibold flex items-center gap-1 hover:underline"
                  >
                    Open Resend <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* DMARC Record */}
            <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 3. DMARC Policy Record
                </span>
                <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-mono">TXT</span>
              </div>
              <p className="text-xs text-stone-500">
                Instructs receiving mailbox providers (Gmail, Yahoo, Apple Mail) on how to handle unauthenticated mail.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <span className="text-stone-400 block text-[10px]">HOST / NAME:</span>
                  <span className="text-stone-800">_dmarc.nirai.in</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-stone-200 md:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 block text-[10px]">VALUE / CONTENT:</span>
                    <span className="text-stone-900 font-bold">v=DMARC1; p=none; rua=mailto:postmaster@nirai.in</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('v=DMARC1; p=none; rua=mailto:postmaster@nirai.in', 'dmarc')}
                    className="p-1 hover:bg-stone-100 rounded text-stone-500"
                  >
                    {copiedKey === 'dmarc' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Configurable FROM Email */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-bold text-amber-900">Setting Configurable FROM Address (NOTIFY_FROM_EMAIL)</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Once your domain is verified, set the sender address in your Supabase Edge Function secrets via CLI:
            </p>
            <div className="bg-stone-900 text-stone-100 p-3 rounded font-mono text-xs flex items-center justify-between">
              <code>supabase secrets set NOTIFY_FROM_EMAIL=&quot;Nirai Handlooms &lt;orders@nirai.in&gt;&quot;</code>
              <button
                onClick={() =>
                  copyToClipboard(
                    'supabase secrets set NOTIFY_FROM_EMAIL="Nirai Handlooms <orders@nirai.in>"',
                    'secrets'
                  )
                }
                className="text-stone-400 hover:text-white p-1"
              >
                {copiedKey === 'secrets' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Supabase Auth Custom SMTP & Bilingual Templates (Requirement B) */}
      {activeTab === 'smtp_guide' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-bold font-serif text-stone-900">
                Launch Blocker: Custom SMTP for Supabase Auth
              </h2>
            </div>
            <p className="text-stone-500 text-sm mt-1">
              Supabase Auth default email service allows only <strong>3 to 4 emails per hour</strong>. You must configure 
              custom SMTP (Resend SMTP) in Supabase Dashboard &gt; Project Settings &gt; Authentication &gt; SMTP Settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-2 text-xs">
              <h3 className="font-bold text-stone-800 text-sm">Resend SMTP Configuration Parameters</h3>
              <div className="space-y-1.5 font-mono pt-1">
                <div><span className="text-stone-500">Sender Email:</span> <span className="font-semibold text-stone-900">orders@nirai.in</span></div>
                <div><span className="text-stone-500">Sender Name:</span> <span className="font-semibold text-stone-900">Nirai Handlooms</span></div>
                <div><span className="text-stone-500">Host:</span> <span className="font-semibold text-stone-900">smtp.resend.com</span></div>
                <div><span className="text-stone-500">Port:</span> <span className="font-semibold text-stone-900">465 (SSL) or 587 (TLS)</span></div>
                <div><span className="text-stone-500">Username:</span> <span className="font-semibold text-stone-900">resend</span></div>
                <div><span className="text-stone-500">Password:</span> <span className="font-semibold text-stone-900">&lt;YOUR_RESEND_API_KEY&gt;</span></div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2 text-xs text-amber-900">
              <h3 className="font-bold text-amber-950 text-sm">Full Documentation &amp; Templates</h3>
              <p className="leading-relaxed">
                Complete bilingual (English &amp; Tamil) templates for <strong>Confirm Sign Up</strong> and <strong>Reset Password</strong> 
                have been prepared in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">docs/SUPABASE_SMTP_SETUP.md</code>.
              </p>
              <p className="leading-relaxed">
                Copy and paste the HTML templates directly into Supabase Dashboard &gt; Authentication &gt; Email Templates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Notification Details: #{selectedItem.order_number}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded border border-stone-200">
                <div>
                  <span className="text-stone-400 block">Event Type:</span>
                  <span className="font-mono font-semibold text-stone-800">{selectedItem.event_type}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Status:</span>
                  <span className="font-semibold capitalize text-stone-800">{selectedItem.status}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Recipient (Masked):</span>
                  <span className="font-mono text-stone-800">{maskEmail(selectedItem.recipient_email)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Attempts:</span>
                  <span className="font-mono text-stone-800">{selectedItem.attempts}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 font-semibold block mb-1">Subject:</span>
                <p className="p-2.5 bg-stone-50 border border-stone-200 rounded font-medium text-stone-800">
                  {selectedItem.subject}
                </p>
              </div>

              {selectedItem.error_message && (
                <div>
                  <span className="text-rose-600 font-semibold block mb-1">Last Error Message:</span>
                  <p className="p-2.5 bg-rose-50 border border-rose-200 rounded font-mono text-rose-800">
                    {selectedItem.error_message}
                  </p>
                </div>
              )}

              <div>
                <span className="text-stone-500 font-semibold block mb-1">Payload Metadata:</span>
                <pre className="p-3 bg-stone-900 text-stone-200 rounded font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedItem.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              {selectedItem.status === 'failed' && (
                <button
                  onClick={() => {
                    handleRetryNotification(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-amber-900 text-white rounded text-xs font-semibold hover:bg-amber-800"
                >
                  Retry Sending
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded text-xs font-semibold hover:bg-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
