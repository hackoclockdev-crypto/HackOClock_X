/**
 * app/register/page.tsx
 *
 * Multi-step team registration form.
 *
 * Steps:
 *   1. Team info (name, size, track)
 *   2. Leader & member details
 *   3. UPI payment + secure screenshot upload
 *   4. Confirmation
 *
 * Security:
 *  - Client-side validation is UX only; server re-validates everything
 *  - File upload goes to /api/upload (magic byte check, Admin SDK)
 *  - Registration POST goes to /api/register (Zod, sanitize, Firestore)
 *  - DOMPurify is used before displaying any user-entered text in preview
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UpiQrCode from '@/components/UpiQrCode';
import FileUploadZone from '@/components/FileUploadZone';
// DOMPurify is loaded dynamically to avoid build-time environment errors.
import {
  Clock, ArrowRight, ArrowLeft, CheckCircle, Users,
  User, Zap, Shield, AlertCircle,
  Binary, Cpu, Terminal, Database, Code2, Globe, Activity, Lock
} from 'lucide-react';

const TRACKS = [
  { id: 'AI_ML', label: 'Artificial Intelligence & Machine Learning', icon: '🤖' },
  { id: 'CYBERSECURITY', label: 'Cybersecurity', icon: '🔐' },
  { id: 'HEALTHTECH', label: 'HealthTech & Wellbeing', icon: '🏥' },
  { id: 'FINTECH', label: 'FinTech', icon: '💰' },
  { id: 'OPEN_INNOVATION', label: 'Open Innovation', icon: '🌱' },
];

interface FormData {
  teamName: string;
  teamSize: number;
  track: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  memberEmails: string[];
  paymentScreenshotPath: string;
}

const INITIAL_FORM: FormData = {
  teamName: '',
  teamSize: 2,
  track: '',
  leaderName: '',
  leaderEmail: '',
  leaderPhone: '',
  memberEmails: [''],
  paymentScreenshotPath: '',
};

type Step = 1 | 2 | 3 | 4;

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-10">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < current
                ? 'bg-cyan-500 text-black'
                : s === current
                  ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                  : 'bg-zinc-800 text-zinc-600'
              }`}
          >
            {s < current ? <CheckCircle className="w-4 h-4" /> : s}
          </div>
          {s < total && (
            <div
              className="w-12 h-px transition-all"
              style={{ background: s < current ? '#06b6d4' : '#27272a' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tech Decorations ──────────────────────────────────────────────────────────
function BackgroundDecor() {
  const decorations = [
    { Icon: Code2, top: '15%', left: '5%', size: 24, delay: '0s', speed: 'float' },
    { Icon: Binary, top: '25%', left: '15%', size: 20, delay: '2s', speed: 'float-slow' },
    { Icon: Terminal, top: '10%', left: '85%', size: 28, delay: '1s', speed: 'float-fast' },
    { Icon: Cpu, top: '65%', left: '8%', size: 32, delay: '4s', speed: 'float-slow' },
    { Icon: Database, top: '75%', left: '80%', size: 24, delay: '3s', speed: 'float' },
    { Icon: Shield, top: '20%', left: '75%', size: 22, delay: '5s', speed: 'float-fast' },
    { Icon: Zap, top: '85%', left: '15%', size: 18, delay: '0.5s', speed: 'float' },
    { Icon: Activity, top: '45%', left: '92%', size: 26, delay: '2.5s', speed: 'float-slow' },
    { Icon: Lock, top: '15%', left: '95%', size: 20, delay: '1.5s', speed: 'float-fast' },
    { Icon: Globe, top: '80%', left: '90%', size: 30, delay: '4.5s', speed: 'float' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.15] select-none">
      {decorations.map(({ Icon, top, left, size, delay, speed }, i) => (
        <div
          key={i}
          className={`absolute animate-${speed}`}
          style={{
            top,
            left,
            animationDelay: delay,
          }}
        >
          <Icon
            size={size}
            className="text-cyan-500/40"
            style={{
              filter: `drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))`
            }}
          />
        </div>
      ))}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 200 Q 250 250 500 200 T 1000 200" fill="none" stroke="#06b6d4" strokeWidth="1" />
        <path d="M0 600 Q 250 550 500 600 T 1000 600" fill="none" stroke="#06b6d4" strokeWidth="1" />
      </svg>
    </div>
  );
}

export default function RegisterPage() {

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  // ── Field helpers ─────────────────────────────────────────────────────────
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  // ── Safe display of user text (Lazy-loaded DOMPurify) ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [purify, setPurify] = useState<any>(null);

  useEffect(() => {
    // Only load in the browser
    if (typeof window !== 'undefined') {
      import('dompurify').then(mod => {
        const instance = mod.default;
        if (instance && typeof instance.sanitize === 'function') {
          setPurify(instance);
        }
      }).catch(err => {
        console.error('[register] Failed to load DOMPurify:', err);
      });
    }
  }, []);

  function safeText(text: string): string {
    if (!text) return '';

    // If not yet loaded or on server, return a safe "working" state
    if (!purify) return text;

    try {
      return purify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    } catch (err) {
      console.warn('[register] Sanitization failed, falling back to raw text:', err);
      return text;
    }
  }

  // ── Step 1: Team info validation ──────────────────────────────────────────
  function validateStep1(): boolean {
    const newErrors: typeof errors = {};
    if (!form.teamName.trim() || form.teamName.length < 3) {
      newErrors.teamName = 'Team name must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(form.teamName)) {
      newErrors.teamName = 'Team name can only contain letters, numbers, spaces, hyphens, underscores';
    }
    if (!form.track) {
      newErrors.track = 'Please select a track';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Step 2: Leader details validation ────────────────────────────────────
  function validateStep2(): boolean {
    const newErrors: typeof errors = {};
    if (!form.leaderName.trim() || form.leaderName.length < 2) {
      newErrors.leaderName = 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(form.leaderEmail)) {
      newErrors.leaderEmail = 'Please enter a valid email address';
    }
    const digits = form.leaderPhone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 12) {
      newErrors.leaderPhone = 'Please enter a valid 10-digit Indian phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Step 3: Payment validation ────────────────────────────────────────────
  function validateStep3(): boolean {
    if (!form.paymentScreenshotPath) {
      setErrors({ paymentScreenshotPath: 'Please upload the payment screenshot to proceed' });
      return false;
    }
    return true;
  }

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => (s < 4 ? (s + 1) as Step : s));
  };

  const goBack = () => setStep(s => (s > 1 ? (s - 1) as Step : s));

  // ── Upload callbacks ──────────────────────────────────────────────────────
  const handleUploadComplete = useCallback((path: string) => {
    setField('paymentScreenshotPath', path);
    setErrors(e => ({ ...e, paymentScreenshotPath: undefined }));
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setErrors(e => ({ ...e, paymentScreenshotPath: error }));
  }, []);

  // ── Final submission ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitStatus('loading');
    setSubmitError('');

    try {
      const payload = {
        teamName: form.teamName.trim(),
        teamSize: form.teamSize,
        track: form.track,
        leaderName: form.leaderName.trim(),
        leaderEmail: form.leaderEmail.toLowerCase().trim(),
        leaderPhone: form.leaderPhone.replace(/\D/g, ''),
        memberEmails: form.memberEmails.filter(e => e.trim()).map(e => e.toLowerCase().trim()),
        paymentScreenshotPath: form.paymentScreenshotPath,
      };

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitStatus('success');
        setStep(4);
      } else {
        setSubmitStatus('error');
        setSubmitError(data.message ?? 'Registration failed. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <>
      <Navbar />
      <BackgroundDecor />
      <main className="min-h-screen pt-24 pb-20 grid-bg relative">
        <div className="container max-w-2xl">
          {/* Page header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cyan-500" />
              <span className="text-cyan-500 text-sm font-semibold uppercase tracking-widest">Team Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              Join <span className="gradient-text">Hack0&apos;Clock</span>
            </h1>
            <p className="text-zinc-500 text-sm">Registration fee: ₹350 per head</p>
          </div>

          {/* Step indicator */}
          {step < 4 && <StepIndicator current={step} total={3} />}

          {/* ── Form Card ─────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* ── STEP 1: Team Info ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Team Information
                </h2>

                <div>
                  <label htmlFor="team-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Team Name <span className="text-cyan-500">*</span>
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    className={`input-field ${errors.teamName ? 'border-red-500/50' : ''}`}
                    placeholder="e.g. Code Ninjas, Hackstra"
                    value={form.teamName}
                    onChange={e => setField('teamName', e.target.value)}
                    maxLength={50}
                  />
                  {errors.teamName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.teamName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-3">
                    Team Size <span className="text-cyan-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[2, 3, 4].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            teamSize: size,
                            memberEmails: Array(size - 1).fill('')
                          }));
                          setErrors(e => ({
                            ...e,
                            teamSize: undefined,
                            memberEmails: undefined
                          }));
                        }}
                        className={`py-3 rounded-xl border font-semibold text-sm transition-all ${form.teamSize === size
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                          }`}
                        id={`team-size-${size}`}
                      >
                        {size} members
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-3">
                    Hackathon Track <span className="text-cyan-500">*</span>
                  </label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {TRACKS.map(track => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, track: track.id }));
                          setErrors(e => ({ ...e, track: undefined }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(50%-0.5rem)] ${form.track === track.id
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                        id={`track-${track.id.toLowerCase()}`}
                      >
                        <span className="text-xl">{track.icon}</span>
                        <span className="text-sm font-medium">{track.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.track && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.track}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Leader Details ─────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-500" />
                  Team Leader Details
                </h2>

                <div>
                  <label htmlFor="leader-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Full Name <span className="text-cyan-500">*</span>
                  </label>
                  <input
                    id="leader-name"
                    type="text"
                    className={`input-field ${errors.leaderName ? 'border-red-500/50' : ''}`}
                    placeholder="Rahul Kumar"
                    value={form.leaderName}
                    onChange={e => setField('leaderName', e.target.value)}
                    maxLength={100}
                  />
                  {errors.leaderName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.leaderName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="leader-email" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Email Address <span className="text-cyan-500">*</span>
                  </label>
                  <input
                    id="leader-email"
                    type="email"
                    className={`input-field ${errors.leaderEmail ? 'border-red-500/50' : ''}`}
                    placeholder="rahul@example.com"
                    value={form.leaderEmail}
                    onChange={e => setField('leaderEmail', e.target.value)}
                    maxLength={254}
                  />
                  {errors.leaderEmail && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.leaderEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="leader-phone" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Phone Number <span className="text-cyan-500">*</span>
                  </label>
                  <input
                    id="leader-phone"
                    type="tel"
                    className={`input-field ${errors.leaderPhone ? 'border-red-500/50' : ''}`}
                    placeholder="+91 98765 43210"
                    value={form.leaderPhone}
                    onChange={e => setField('leaderPhone', e.target.value)}
                    maxLength={15}
                  />
                  {errors.leaderPhone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.leaderPhone}
                    </p>
                  )}
                </div>

                {/* Other member emails */}
                {form.teamSize > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-3">
                      Other Team Member Emails
                      <span className="text-zinc-600 ml-1">(optional)</span>
                    </label>
                    <div className="space-y-3">
                      {Array.from({ length: form.teamSize - 1 }, (_, i) => (
                        <input
                          key={i}
                          id={`member-email-${i + 1}`}
                          type="email"
                          className="input-field"
                          placeholder={`Member ${i + 2} email`}
                          value={form.memberEmails[i] ?? ''}
                          onChange={e => {
                            const next = [...form.memberEmails];
                            next[i] = e.target.value;
                            setField('memberEmails', next);
                          }}
                          maxLength={254}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Team preview */}
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(6, 182, 212,0.04)', border: '1px solid rgba(6, 182, 212,0.1)' }}
                >
                  <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Registration Summary</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Team</span>
                      {/* safeText prevents XSS if someone typed HTML in the team name */}
                      <span className="text-zinc-200 font-medium">{safeText(form.teamName) || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Size</span>
                      <span className="text-zinc-200">{form.teamSize} members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Track</span>
                      <span className="text-zinc-200">{TRACKS.find(t => t.id === form.track)?.label ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Payment ────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-500" />
                  Payment & Confirmation
                </h2>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-6">
                  <UpiQrCode
                    upiId={process.env.NEXT_PUBLIC_UPI_ID ?? 'hackoclock@upi'}
                    amount={350 * form.teamSize}
                    qrImageUrl={process.env.NEXT_PUBLIC_QR_IMAGE_PATH}
                  />
                  <div className="text-center">
                    <p className="text-white font-bold text-2xl tracking-tight">Total: ₹{350 * form.teamSize}</p>
                    <p className="text-zinc-500 text-sm mt-1">₹350 x {form.teamSize} members</p>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-3">
                    Upload Payment Screenshot <span className="text-cyan-500">*</span>
                  </label>
                  <FileUploadZone
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                  />
                  {errors.paymentScreenshotPath && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.paymentScreenshotPath}
                    </p>
                  )}
                </div>

                {/* Security assurance */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(6, 182, 212,0.04)', border: '1px solid rgba(6, 182, 212,0.1)' }}
                >
                  <Shield className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300">Secure Payment Verification</p>
                    <p>Your screenshot is encrypted and stored securely. It is only visible to Hack0&apos;Clock admins for payment verification. We never share your data with third parties.</p>
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Success ────────────────────────────────────────── */}
            {step === 4 && (
              <div className="text-center py-8 space-y-6">
                <div
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Registration Submitted! 🎉</h2>
                  <p className="text-cyan-400 font-semibold">Your Hack0&apos;Clock registration is submitted!</p>
                  <p className="text-zinc-400 text-sm mt-2">
                    We&apos;ll verify your payment within 24 hours and send confirmation to{' '}
                    <span className="text-cyan-400">{safeText(form.leaderEmail)}</span>
                  </p>
                </div>

                <div
                  className="p-5 rounded-xl text-left space-y-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">What&apos;s Next</p>
                  {[
                    'Check your email for a registration confirmation',
                    'Join our Discord community for updates',
                    'Prepare your team and project ideas',
                    'Arrive at the venue by 8:30 AM on April 23',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-500 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <span className="text-zinc-400">{step}</span>
                    </div>
                  ))}
                </div>

                <Link href="/" className="btn-ghost inline-flex">
                  ← Back to Home
                </Link>
              </div>
            )}

            {/* ── Navigation Buttons ─────────────────────────────────────── */}
            {step < 4 && (
              <div className={`flex gap-3 mt-8 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button type="button" className="btn-ghost" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={goNext} id={`step-${step}-next`}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={submitStatus === 'loading' || !form.paymentScreenshotPath}
                    id="final-submit-btn"
                  >
                    {submitStatus === 'loading' ? (
                      <><span className="spinner" /> Submitting...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Submit Registration</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Security footer */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Shield className="w-3.5 h-3.5 text-zinc-600" />
            <p className="text-xs text-zinc-600">
              256-bit encrypted · OWASP-compliant · No data sold to third parties
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
