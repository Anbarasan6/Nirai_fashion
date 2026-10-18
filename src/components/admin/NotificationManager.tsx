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
  Settings,
  Copy,
  Check,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';

interface OutboxItem {
  id: string;
  type: string;
  order_id: string;
  order_number: string;
  submission_id: string | null;
  to_email: string;
  to_phone: string | null;
  locale: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
  total_count?: number;
}

interface NotificationSettingsState {
  admin_notification_emails: string[];
  reminder_hours_before_deadline: number;
  notification_type_toggles: Record<string, boolean>;
}

export const NotificationManager: React.FC = () => {
  const { showToast, currentUser } = useShop();

  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<OutboxItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outbox' | 'settings' | 'dns_guide' | 'smtp_guide'>('outbox');

  // Settings State
  const [settings, setSettings] = useState<NotificationSettingsState>({
    admin_notification_emails: ['orders@nirai.in'],
    reminder_hours_before_deadline: 4,
    notification_type_toggles: {
      order_placed: true,
      payment_proof_received: true,
      payment_verified: true,
      payment_rejected: true,
      payment_reminder: true,
      order_expired: true,
      shipped: true,
      delivered: true,
      cancelled: true,
      admin_payment_pending: true,
    },
  });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Check if domain is verified via env
  const isDomainVerified = import.meta.env.VITE_NOTIFY_DOMAIN_VERIFIED === 'true';

  // Requirement 6: Log warning on mount when domain is not verified
  useEffect(() => {
    if (!isDomainVerified) {
      console.warn(
        '[Nirai Notifications] RESEND DOMAIN LIMITATION: Resend in sandbox mode ONLY delivers emails to the verified account owner. In production, custom domain verification (SPF, DKIM, DMARC) is mandatory.'
      );
    }
  }, [isDomainVerified]);

  // Fetch outbox via SECURITY DEFINER RPC list_notifications
  const fetchOutbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('list_notifications', {
        p_status: filterStatus === 'all' ? null : filterStatus,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) {
        console.error('Error fetching outbox:', error);
        showToast('Failed to load notifications via RPC', 'error');
      } else {
        setOutbox((data as OutboxItem[]) || []);
      }
    } catch (err: any) {
      console.error('Outbox query error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, showToast]);

  // Load notification settings from payment_settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('admin_notification_emails, reminder_hours_before_deadline, notification_type_toggles')
        .single();

      if (data && !error) {
        setSettings({
          admin_notification_emails: data.admin_notification_emails || ['orders@nirai.in'],
          reminder_hours_before_deadline: data.reminder_hours_before_deadline || 4,
          notification_type_toggles: data.notification_type_toggles || {
            order_placed: true,
            payment_proof_received: true,
            payment_verified: true,
            payment_rejected: true,
            payment_reminder: true,
            order_expired: true,
            shipped: true,
            delivered: true,
            cancelled: true,
            admin_payment_pending: true,
          },
        });
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchOutbox();
    fetchSettings();
  }, [fetchOutbox, fetchSettings]);

  // Manual Trigger Dispatch
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
          `Dispatch completed: ${data.sent_count ?? 0} sent, ${data.failed_count ?? 0} failed (${data.processed_count ?? 0} claimed)`,
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

  // Requirement 1 & 5: Retry failed row via RPC retry_notification
  const handleRetryNotification = async (item: OutboxItem) => {
    try {
      const { data, error } = await supabase.rpc('retry_notification', {
        p_id: item.id,
      });

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

  // Save Settings to payment_settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .update({
          admin_notification_emails: settings.admin_notification_emails,
          reminder_hours_before_deadline: settings.reminder_hours_before_deadline,
          notification_type_toggles: settings.notification_type_toggles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) {
        showToast(`Failed to save settings: ${error.message}`, 'error');
      } else {
        showToast('Notification settings updated successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddAdminEmail = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (settings.admin_notification_emails.includes(email)) {
      showToast('Email already in recipient list', 'error');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      admin_notification_emails: [...prev.admin_notification_emails, email],
    }));
    setNewAdminEmail('');
  };

  const handleRemoveAdminEmail = (email: string) => {
    setSettings((prev) => ({
      ...prev,
      admin_notification_emails: prev.admin_notification_emails.filter((e) => e !== email),
    }));
  };

  const handleToggleType = (type: string) => {
    setSettings((prev) => ({
      ...prev,
      notification_type_toggles: {
        ...prev.notification_type_toggles,
        [type]: !prev.notification_type_toggles[type],
      },
    }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard', 'success');
  };

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
      item.order_number?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      (item.to_email && item.to_email.toLowerCase().includes(q))
    );
  });

  const pendingCount = outbox.filter((i) => i.status === 'pending').length;
  const sentCount = outbox.filter((i) => i.status === 'sent').length;
  const failedCount = outbox.filter((i) => i.status === 'failed').length;

  const NOTIFICATION_LABELS: Record<string, { label: string; desc: string }> = {
    order_placed: { label: 'Order Placed', desc: 'Sent when customer places an order with Pay Now link' },
    payment_proof_received: { label: 'Payment Proof Received', desc: 'Acknowledges UTR submission to customer' },
    payment_verified: { label: 'Payment Verified', desc: 'Confirms payment and locks saree for packing' },
    payment_rejected: { label: 'Payment Rejected', desc: 'Informs customer of rejection with resubmit link' },
    payment_reminder: { label: 'Payment Reminder', desc: '4 hours before deadline for unpaid orders' },
    order_expired: { label: 'Order Expired', desc: 'Informs customer when 24h payment window lapses' },
    shipped: { label: 'Order Shipped', desc: 'Courier AWB and tracking link' },
    delivered: { label: 'Order Delivered', desc: 'Delivery acknowledgement and care instructions' },
    cancelled: { label: 'Order Cancelled', desc: 'Order cancellation confirmation' },
    admin_payment_pending: { label: 'Admin Payment Alert', desc: 'Alerts store owner of new UTR awaiting review' },
  };

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
            className="flex items-center gap-2 px-3 py-2 text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDispatchNow}
            disabled={isDispatching}
            className="flex items-center gap-2 px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Send className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
            {isDispatching ? 'Dispatching...' : 'Dispatch Outbox Now'}
          </button>
        </div>
      </div>

      {/* Requirement 6: Prominent Resend Domain Verification Warning Banner when not verified */}
      {!isDomainVerified && (
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
                Real customer emails will fail with an HTTP 403 authorization error. Before opening the store to customers, you must add and verify 
                <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono text-xs font-semibold">nirai.in</code> 
                with SPF, DKIM, and DMARC DNS records in your domain registrar.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('dns_guide')}
                  className="text-xs font-semibold text-amber-950 underline hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  View DNS Verification Setup Guide <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-amber-300">|</span>
                <button
                  onClick={() => setActiveTab('smtp_guide')}
                  className="text-xs font-semibold text-amber-950 underline hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  Supabase Auth Custom SMTP Guide &amp; Tamil Templates <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('outbox')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'outbox'
              ? 'border-amber-900 text-amber-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Outbox Queue ({outbox.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-900 text-amber-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings &amp; Preferences
        </button>
        <button
          onClick={() => setActiveTab('dns_guide')}
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
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
          className={`py-3 px-5 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
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
                placeholder="Search order number or type..."
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
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
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Recipient (Masked)</th>
                    <th className="py-3 px-4 font-semibold">Locale</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Attempts</th>
                    <th className="py-3 px-4 font-semibold">Next Attempt</th>
                    <th className="py-3 px-4 font-semibold">Queued At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredOutbox.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-400">
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
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-stone-600">
                          {maskEmail(item.to_email)}
                        </td>
                        <td className="py-3 px-4 text-xs uppercase font-mono text-stone-500">
                          {item.locale || 'en'}
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800" title={item.last_error || ''}>
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-600 font-mono">
                          {item.attempts} / 5
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                          {item.next_attempt_at
                            ? new Date(item.next_attempt_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
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
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition cursor-pointer"
                              title="View details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {item.status === 'failed' && (
                              <button
                                onClick={() => handleRetryNotification(item)}
                                className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition cursor-pointer"
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

      {/* Tab 2: Settings > Notifications (Requirement 5) */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-8">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Notification Preferences &amp; Administration
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Configure recipient email lists for administrative verification alerts, reminder intervals, and per-type toggle switches.
            </p>
          </div>

          {/* Admin Email List */}
          <div className="space-y-3 border-t border-stone-100 pt-6">
            <label className="block text-sm font-bold text-stone-900">
              Admin Notification Recipient List (New Payment Proof Alerts)
            </label>
            <p className="text-xs text-stone-500">
              When a customer submits an offline UPI/Bank payment proof, alerts are dispatched to these administrator email addresses.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {settings.admin_notification_emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-950"
                >
                  {email}
                  {settings.admin_notification_emails.length > 1 && (
                    <button
                      onClick={() => handleRemoveAdminEmail(email)}
                      className="hover:text-rose-600 transition p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md pt-2">
              <input
                type="email"
                placeholder="add.admin@nirai.in"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
              <button
                type="button"
                onClick={handleAddAdminEmail}
                className="flex items-center gap-1 px-3 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Payment Deadline Reminders */}
          <div className="space-y-3 border-t border-stone-100 pt-6">
            <label className="block text-sm font-bold text-stone-900">
              Payment Expiration Reminder Threshold
            </label>
            <p className="text-xs text-stone-500">
              Automated reminders are sent to customers for unpaid orders nearing their reservation deadline.
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="number"
                min="1"
                max="24"
                value={settings.reminder_hours_before_deadline}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    reminder_hours_before_deadline: Math.max(1, parseInt(e.target.value) || 4),
                  }))
                }
                className="w-24 px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-900"
              />
              <span className="text-xs text-stone-600 font-medium">Hours before order expiration (Default: 4 hours)</span>
            </div>
          </div>

          {/* Per-Type Notification Toggles */}
          <div className="space-y-4 border-t border-stone-100 pt-6">
            <div>
              <label className="block text-sm font-bold text-stone-900">
                Notification Type Toggles
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Enable or disable automated outbox enqueuing for specific customer lifecycle events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(NOTIFICATION_LABELS).map(([typeKey, meta]) => {
                const isEnabled = settings.notification_type_toggles[typeKey] ?? true;
                return (
                  <div
                    key={typeKey}
                    onClick={() => handleToggleType(typeKey)}
                    className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      isEnabled ? 'bg-stone-50/70 border-stone-300' : 'bg-stone-100/40 border-stone-200 opacity-60'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{meta.label}</p>
                      <p className="text-[11px] text-stone-500">{meta.desc}</p>
                    </div>
                    <div
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isEnabled ? 'bg-amber-900' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="border-t border-stone-100 pt-6 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-6 py-2.5 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSavingSettings ? 'Saving Settings...' : 'Save Notification Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Domain DNS Setup Guide */}
      {activeTab === 'dns_guide' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Domain DNS Records for Verified Email Delivery
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Add the following DNS records to your domain DNS manager to verify 
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
                    className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
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
                    className="text-amber-900 text-xs font-sans font-semibold flex items-center gap-1 hover:underline cursor-pointer"
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
                    className="p-1 hover:bg-stone-100 rounded text-stone-500 cursor-pointer"
                  >
                    {copiedKey === 'dmarc' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Supabase Auth Custom SMTP (Requirement 4) */}
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
                className="text-stone-400 hover:text-stone-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded border border-stone-200">
                <div>
                  <span className="text-stone-400 block">Type:</span>
                  <span className="font-mono font-semibold text-stone-800">{selectedItem.type}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Status:</span>
                  <span className="font-semibold capitalize text-stone-800">{selectedItem.status}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Recipient (Masked):</span>
                  <span className="font-mono text-stone-800">{maskEmail(selectedItem.to_email)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Attempts:</span>
                  <span className="font-mono text-stone-800">{selectedItem.attempts} / 5</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Locale:</span>
                  <span className="font-mono text-stone-800 uppercase">{selectedItem.locale}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Next Attempt At:</span>
                  <span className="font-mono text-stone-800">
                    {selectedItem.next_attempt_at ? new Date(selectedItem.next_attempt_at).toLocaleTimeString() : 'None'}
                  </span>
                </div>
              </div>

              {selectedItem.last_error && (
                <div>
                  <span className="text-rose-600 font-semibold block mb-1">Last Error Message:</span>
                  <p className="p-2.5 bg-rose-50 border border-rose-200 rounded font-mono text-rose-800">
                    {selectedItem.last_error}
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
                  className="px-4 py-2 bg-amber-900 text-white rounded text-xs font-semibold hover:bg-amber-800 cursor-pointer"
                >
                  Retry Sending
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded text-xs font-semibold hover:bg-stone-200 cursor-pointer"
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
