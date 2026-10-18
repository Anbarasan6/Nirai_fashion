import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import QRCode from 'qrcode';
import { useShop } from '../../context/ShopContext';
import { StorageService } from '../../services/storage';
import { PaymentInstructions, PaymentSubmission } from '../../types';
import {
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Banknote,
  ExternalLink,
  ChevronRight,
  Loader2,
  XCircle,
  FileCheck,
} from 'lucide-react';

const paymentProofSchema = z
  .object({
    method: z.enum(['upi', 'qr', 'bank_transfer']),
    utr: z.string().trim().toUpperCase(),
    amountPaid: z.number().positive('Amount must be greater than zero'),
    payerName: z.string().trim().min(2, 'Payer name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'upi' || data.method === 'qr') {
      if (!/^\d{12}$/.test(data.utr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['utr'],
          message: 'UPI UTR reference must be exactly 12 numeric digits.',
        });
      }
    } else if (data.method === 'bank_transfer') {
      if (!/^[A-Z0-9]{6,22}$/.test(data.utr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['utr'],
          message: 'Bank transfer reference (NEFT/IMPS/RTGS) must be 6 to 22 alphanumeric characters.',
        });
      }
    }
  });

export const PaymentPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, showToast } = useShop();

  // Retrieve phone from navigation state or local session if available
  const initialPhone =
    (location.state as any)?.phone ||
    sessionStorage.getItem(`nirai_phone_${orderNumber}`) ||
    currentUser?.phone ||
    '';

  const [phone, setPhone] = useState(initialPhone);
  const [phonePromptRequired, setPhonePromptRequired] = useState(!initialPhone);
  const [phoneInput, setPhoneInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dynamic QR Code state
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Proof submission form state
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'qr' | 'bank_transfer'>('upi');
  const [utr, setUtr] = useState('');
  const [payerName, setPayerName] = useState(currentUser?.name || '');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Time remaining countdown
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 1. Fetch payment instructions from server RPC
  const loadInstructions = async (phoneToVerify?: string) => {
    if (!orderNumber) return;
    setLoading(true);
    setLoadError(null);

    const verifiedPhone = phoneToVerify || phone;
    const res = await StorageService.getPaymentInstructions(undefined, orderNumber, verifiedPhone || undefined);

    setLoading(false);
    if (res.success && res.data) {
      setInstructions(res.data);
      setPhonePromptRequired(false);
      setAmountPaid(res.data.amount_due);
      if (res.data.customer_name && !payerName) {
        setPayerName(res.data.customer_name);
      }
      if (verifiedPhone) {
        sessionStorage.setItem(`nirai_phone_${orderNumber}`, verifiedPhone);
      }
    } else {
      if (res.error?.includes('Phone number verification is required') || res.error?.includes('Invalid verification')) {
        setPhonePromptRequired(true);
      } else {
        setLoadError(res.error || 'Unable to load payment instructions.');
      }
    }
  };

  useEffect(() => {
    if (orderNumber) {
      loadInstructions();
    }
  }, [orderNumber]);

  // 2. Generate dynamic UPI QR Code when instructions are loaded
  useEffect(() => {
    if (!instructions || !instructions.upi_details?.upi_id) return;

    const upiId = instructions.upi_details.upi_id;
    const name = instructions.upi_details.payee_name || 'Nirai Handlooms';
    const amount = instructions.amount_due;
    const note = `Order ${instructions.order_number}`;

    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#2D1619',
        light: '#FFFFFF',
      },
    })
      .then((url) => setDynamicQrUrl(url))
      .catch((err) => console.error('Failed to generate dynamic QR:', err));
  }, [instructions]);

  // 3. Countdown timer to payment deadline
  useEffect(() => {
    if (!instructions?.payment_due_at) return;

    const calculateTime = () => {
      const diff = new Date(instructions.payment_due_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [instructions?.payment_due_at]);

  // Copy helper
  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Handle phone verification submit for guest checkout
  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setPhone(clean);
    loadInstructions(clean);
  };

  // Handle screenshot file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, screenshot: 'File size must be 2 MB or less' }));
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setFormErrors((prev) => ({ ...prev, screenshot: '' }));
    }
  };

  // Submit proof handler
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructions || !orderNumber) return;

    // Validate UTR and details using paymentProofSchema
    const cleanUtr = utr.trim().toUpperCase();
    const parseResult = paymentProofSchema.safeParse({
      method: selectedMethod,
      utr: cleanUtr,
      amountPaid: instructions.amount_due,
      payerName: payerName.trim(),
    });

    if (!parseResult.success) {
      const fieldErrors: { utr?: string; payerName?: string } = {};
      for (const issue of parseResult.error.issues) {
        if (issue.path[0] === 'utr') fieldErrors.utr = issue.message;
        if (issue.path[0] === 'payerName') fieldErrors.payerName = issue.message;
      }
      setFormErrors(fieldErrors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      let uploadedScreenshotPath: string | undefined = undefined;

      // 1. Upload screenshot if selected
      if (screenshotFile) {
        const uploadRes = await StorageService.uploadPaymentProof(instructions.order_id, screenshotFile);
        if (!uploadRes.success || !uploadRes.path) {
          throw new Error(uploadRes.error || 'Failed to upload payment proof screenshot.');
        }
        uploadedScreenshotPath = uploadRes.path;
      }

      // 2. Call submit_payment_proof RPC
      const submitRes = await StorageService.submitPaymentProof({
        orderNumber: instructions.order_number,
        phone: instructions.customer_phone || phone,
        utr: cleanUtr,
        method: selectedMethod,
        amountPaid: instructions.amount_due,
        payerName: payerName.trim(),
        screenshotPath: uploadedScreenshotPath,
      });

      setSubmitting(false);

      if (submitRes.success) {
        setSubmissionSuccess(true);
        showToast('Payment proof submitted for manual verification!', 'success');
        // Reload instructions to reflect new status
        loadInstructions();
      } else {
        showToast(submitRes.error || 'Payment submission failed.', 'error');
        setFormErrors({ server: submitRes.error || 'Payment submission failed.' });
      }
    } catch (err: any) {
      setSubmitting(false);
      showToast(err.message || 'Error submitting payment proof.', 'error');
      setFormErrors({ server: err.message });
    }
  };

  // UPI deep link
  const upiDeepLink = instructions
    ? `upi://pay?pa=${encodeURIComponent(instructions.upi_details.upi_id)}&pn=${encodeURIComponent(instructions.upi_details.payee_name)}&am=${instructions.amount_due}&cu=INR&tn=${encodeURIComponent(`Order ${instructions.order_number}`)}`
    : '#';

  // Guest Phone Verification Screen
  if (phonePromptRequired) {
    return (
      <div className="bg-[#FAF9F5] min-h-[75vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5DFD3] shadow-md text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">Verify Order Ownership</h2>
            <p className="text-xs text-stone-500 mt-1">
              Please enter the 10-digit mobile number provided at checkout for order{' '}
              <strong className="font-mono text-slate-800">{orderNumber}</strong> to access secure payment instructions.
            </p>
          </div>

          <form onSubmit={handleVerifyPhone} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Number (10 Digits)</label>
              <input
                type="tel"
                maxLength={10}
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-900 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Unlock Payment Details
            </button>
          </form>

          <Link to="/tracking" className="inline-block text-xs text-stone-500 hover:text-slate-900 underline">
            Back to Order Tracking
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-[#FAF9F5] min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-stone-500 text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
          <p>Retrieving verified payment instructions from server...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !instructions) {
    return (
      <div className="bg-[#FAF9F5] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5DFD3] text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-slate-900">Payment Access Error</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{loadError || 'Order not found or access denied.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/tracking"
              className="px-5 py-2.5 bg-[#2D1619] text-amber-100 text-xs font-semibold rounded-lg"
            >
              Order Tracking
            </Link>
            <Link to="/" className="px-5 py-2.5 border border-stone-300 text-slate-800 text-xs font-semibold rounded-lg">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Paid confirmation view
  if (instructions.payment_status === 'Paid') {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-14">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 block mb-1">
                Payment Verified &amp; Confirmed
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Payment Complete for #{instructions.order_number}
              </h1>
              <p className="text-xs text-stone-500 mt-2">
                We have verified your payment of ₹{instructions.amount_due.toLocaleString()}. Your handcrafted attire is now being tailored and packaged.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(`/tracking/${instructions.order_number}`)}
                className="px-6 py-3 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 text-xs font-semibold rounded-xl"
              >
                Track Live Order
              </button>
              <Link
                to="/catalog"
                className="px-6 py-3 border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-6">
          <div className="flex items-center gap-2">
            <Link to="/checkout" className="hover:text-slate-900">
              Checkout
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Payment for {instructions.order_number}</span>
          </div>
          <Link
            to={`/tracking/${instructions.order_number}`}
            className="text-amber-900 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Track Order</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Status Alert Banners */}
        {instructions.payment_status === 'Verification Pending' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-2xs">
            <Clock className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-950">Payment Verification in Progress</p>
              <p className="text-amber-900 mt-0.5 leading-relaxed">
                Your payment submission (UTR: <strong className="font-mono">{instructions.latest_submission?.utr || 'Submitted'}</strong>) has been received. Our store team reconciles incoming UPI/bank payments manually against our statements. You will receive an SMS/WhatsApp confirmation once verified (usually within 2–4 hours).
              </p>
            </div>
          </div>
        )}

        {instructions.payment_status === 'Rejected' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-950">Previous Payment Submission Rejected</p>
              <p className="text-rose-900 mt-0.5">
                <strong>Reason:</strong> {instructions.latest_submission?.reject_reason || 'Transaction could not be reconciled against bank statement.'}
              </p>
              <p className="text-stone-600 mt-1">
                Please review your transaction, verify the 12-digit UTR, and submit the corrected proof below before the deadline expires.
              </p>
            </div>
          </div>
        )}

        {instructions.is_expired && (
          <div className="mb-6 p-4 rounded-2xl bg-stone-100 border border-stone-300 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700">
              <p className="font-bold text-slate-900">Payment Window Expired</p>
              <p className="mt-0.5">
                This order was not paid within the {instructions.payment_deadline_hours}-hour deadline and the reserved handloom inventory has been released.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Payment Details & QR Code */}
          <div className="md:col-span-7 space-y-6">
            {/* Amount Payable Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                  Amount Due (Server-Verified)
                </span>
                <span className="font-serif text-3xl font-bold text-slate-950 tabular-nums">
                  ₹{instructions.amount_due.toLocaleString()}
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">Order #{instructions.order_number}</p>
              </div>

              {!instructions.is_expired && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Deadline</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeRemaining || `${instructions.payment_deadline_hours}h`}</span>
                  </div>
                </div>
              )}
            </div>

            {/* UPI QR Code Section */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <QrCode className="w-4 h-4 text-amber-900" />
                <h3 className="font-serif text-base font-bold text-slate-900">Scan &amp; Pay with Any UPI App</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl border-2 border-amber-300 shadow-sm shrink-0">
                  {dynamicQrUrl ? (
                    <img src={dynamicQrUrl} alt="UPI Payment QR" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-0.5">UPI ID</span>
                    <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 font-mono font-bold text-slate-900">
                      <span>{instructions.upi_details.upi_id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(instructions.upi_details.upi_id, 'upi')}
                        className="text-amber-900 hover:text-amber-950 font-sans text-xs flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-500 block mb-0.5">Payee Name</span>
                    <p className="font-semibold text-slate-900">{instructions.upi_details.payee_name}</p>
                  </div>

                  {/* Mobile Deep Link */}
                  <a
                    href={upiDeepLink}
                    className="w-full py-2.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
                  </a>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
                  <span>Important Note:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Please mention <strong>Order {instructions.order_number}</strong> in your payment remarks/notes so our accounting team can reconcile your transfer immediately.
                </p>
              </div>
            </div>

            {/* Direct Bank Transfer Option */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Banknote className="w-4 h-4 text-amber-900" />
                <h3 className="font-serif text-base font-bold text-slate-900">Direct Bank Transfer (NEFT / IMPS / RTGS)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block mb-0.5">Account Name</span>
                  <span className="font-bold text-slate-900">{instructions.bank_details.account_name}</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block mb-0.5">Account Number</span>
                    <span className="font-bold text-slate-900 font-mono">{instructions.bank_details.account_number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(instructions.bank_details.account_number, 'acc')}
                    className="text-amber-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block mb-0.5">IFSC Code</span>
                    <span className="font-bold text-slate-900 font-mono">{instructions.bank_details.ifsc_code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(instructions.bank_details.ifsc_code, 'ifsc')}
                    className="text-amber-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block mb-0.5">Bank &amp; Branch</span>
                  <span className="font-bold text-slate-900">
                    {instructions.bank_details.bank_name}, {instructions.bank_details.branch}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Proof Submission Form */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E5DFD3] shadow-2xs space-y-5 sticky top-24">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="font-serif text-base font-bold text-slate-900">Submit Payment Proof</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Enter your transaction reference after completing payment
                </p>
              </div>

              {submissionSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Proof submitted! Our accounting staff will verify within 2–4 hours.</span>
                </div>
              )}

              {formErrors.server && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formErrors.server}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
                {/* Method selector */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">Payment Method Used *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'upi', label: 'UPI App' },
                      { id: 'qr', label: 'QR Scan' },
                      { id: 'bank_transfer', label: 'Bank (NEFT)' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id as any)}
                        className={`py-2 px-2 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                          selectedMethod === m.id
                            ? 'bg-amber-900 text-amber-100 border-amber-900 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UTR Reference input */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {selectedMethod === 'bank_transfer'
                      ? 'NEFT / IMPS Reference Number *'
                      : '12-Digit UPI UTR Reference Number *'}
                  </label>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder={
                      selectedMethod === 'bank_transfer'
                        ? 'e.g. HDFC202610189876'
                        : 'e.g. 429210987654 (12 digits)'
                    }
                    className={`w-full p-2.5 border rounded-lg font-mono focus:outline-none focus:ring-1 ${
                      formErrors.utr
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-stone-300 focus:ring-amber-900'
                    }`}
                  />
                  {formErrors.utr && <p className="text-rose-600 text-[11px] mt-1">{formErrors.utr}</p>}
                  <p className="text-[10px] text-stone-400 mt-1">
                    Found in your bank SMS or UPI app payment confirmation screen.
                  </p>
                </div>

                {/* Payer Name */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Payer Name on Account *</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Full name as shown in banking app"
                    className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 ${
                      formErrors.payerName
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-stone-300 focus:ring-amber-900'
                    }`}
                  />
                  {formErrors.payerName && <p className="text-rose-600 text-[11px] mt-1">{formErrors.payerName}</p>}
                </div>

                {/* Screenshot Upload (Optional) */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Payment Screenshot (Optional, Max 2 MB)</label>
                  <div className="border border-dashed border-stone-300 rounded-xl p-3 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <input
                      type="file"
                      id="screenshot-upload"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {screenshotPreview ? (
                      <div className="space-y-2">
                        <img
                          src={screenshotPreview}
                          alt="Payment Screenshot Preview"
                          className="w-full h-24 object-contain rounded-lg border border-stone-200"
                        />
                        <div className="flex justify-between items-center text-[10px] text-stone-500">
                          <span className="truncate max-w-[180px]">{screenshotFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotPreview(null);
                            }}
                            className="text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="screenshot-upload" className="cursor-pointer block space-y-1">
                        <Upload className="w-5 h-5 text-stone-400 mx-auto" />
                        <span className="font-semibold text-amber-900 text-xs block">Choose receipt image</span>
                        <span className="text-[10px] text-stone-400 block">PNG, JPG, or WebP up to 2MB</span>
                      </label>
                    )}
                  </div>
                  {formErrors.screenshot && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.screenshot}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || instructions.is_expired}
                  className="w-full py-3.5 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Submitting for Verification...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Submit Payment Proof</span>
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-stone-100 pt-3 text-[10px] text-stone-400 space-y-1">
                <p className="flex items-center gap-1.5 text-stone-500 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Manual Store Verification Policy:</span>
                </p>
                <p>
                  Submissions are manually reviewed by our accounting staff against bank statements. Submitting false, duplicated, or invalid UTR numbers will result in order cancellation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
