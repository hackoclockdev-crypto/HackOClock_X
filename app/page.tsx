/**
 * app/page.tsx — Main landing page for Hack0'Clock
 *
 * Sections: Hero → About → Prizes → Schedule → Tracks → FAQ → Contact → Footer
 * All user input (contact form) is sent via fetch to /api/contact (server-side validated).
 * DOMPurify sanitization is performed on backend; React curly-brace escaping prevents XSS on render.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CountdownTimer from '@/components/CountdownTimer';
import {
  Clock, Zap, Trophy, Shield, Code2, Brain, Coins, Globe,
  ChevronDown, ChevronUp, Mail, Phone, MapPin, 
  MessageCircle, Briefcase, ArrowRight, Users, Calendar, Target,
  Award, Activity, Lock, Send, Binary, Cpu, Terminal, Database
} from 'lucide-react';

// Removed useScrollReveal hook as it caused visibility issues

// ── Data ──────────────────────────────────────────────────────────────────────

const prizes = [
  {
    place: '1st Place',
    amount: '₹10,000',
    icon: '🥇',
    perks: ['Trophy + Certificate', 'Mentorship sessions', 'Featured on our platform'],
    highlight: true,
  },
  {
    place: '2nd Place',
    amount: '₹6,000',
    icon: '🥈',
    perks: ['Trophy + Certificate', 'Mentorship sessions'],
    highlight: false,
  },
  {
    place: '3rd Place',
    amount: '₹4,000',
    icon: '🥉',
    perks: ['Trophy + Certificate', 'Goodies bag'],
    highlight: false,
  },
];


const schedule = [
  { time: '09:30 AM', event: 'Registration & Kit Distribution', desc: 'Participant check-in, kit collection, and venue allocation.' },
  { time: '11:00 AM', event: 'Problem Statement Reveal', desc: 'Official distribution of the hackathon challenges.' },
  { time: '11:15 AM', event: 'Ideation & Submission', desc: 'Teams draft abstracts and technical solution approaches.' },
  { time: '12:00 PM', event: '⚡ Hacking Begins', desc: 'Official development start and initial prototyping.', highlight: true },
  { time: '01:30 PM', event: 'Lunch Break', desc: 'Mid-day recharge for all participants.' },
  { time: '02:30 PM', event: 'Development Phase II', desc: 'Active building and coding continues.' },
  { time: '06:00 PM', event: 'Tea & Snacks Break', desc: 'Short break for refreshments.' },
  { time: '06:30 PM', event: 'Core Building Phase', desc: 'Implementation of major features and core functionality.' },
  { time: '09:00 PM', event: 'Dinner Break', desc: 'Evening meal and networking.' },
  { time: '10:00 PM', event: 'Final Development Phase', desc: 'Overnight coding with a Fun Session at 2:00 AM.' },
  { time: '04:00 AM+1', event: '🛑 Hacking Ends', desc: 'Final submission of GitHub repos and PPTs.', highlight: true },
  { time: '05:30 AM+1', event: 'Final Presentations', desc: 'Top selected teams pitch their solutions (5-min pitch + Q&A).' },
  { time: '07:30 AM+1', event: 'Conclusion', desc: 'Final rounds wrap up.' },
];

const tracks = [
  { id: 'AI_ML', icon: Brain, label: 'Artificial Intelligence & Machine Learning', desc: 'Generative AI, neural networks, computer vision, and predictive analytics.' },
  { id: 'FINTECH', icon: Coins, label: 'FinTech', desc: 'Secure payments, digital banking, wealth management, and financial accessibility.' },
  { id: 'HEALTHCARE', icon: Activity, label: 'Healthcare & Wellbeing', desc: 'Digital health, telemedicine, medical diagnostics, and fitness tracking.' },
  { id: 'SUSTAINABILITY', icon: Globe, label: 'Sustainability & Environment', desc: 'Green tech, carbon tracking, renewable energy, and circular economy.' },
  { id: 'CYBERSECURITY', icon: Shield, label: 'Cybersecurity', desc: 'Data privacy, threat detection, secure authentication, and cryptography.' },
];

const faqs = [
  {
    q: "Who can participate in Hack0'Clock?",
    a: "Any student or working professional can participate. Teams of 2–4 members are allowed. All skill levels are welcome — we have tracks for beginners and experts alike.",
  },
  {
    q: 'What is the registration fee?',
    a: 'The registration fee is ₹350 per head. This covers your food, swag kit, and event access for the full 18 hours.',
  },
  {
    q: 'Do we need to have a project idea before registering?',
    a: "No! Problem statements are revealed at the opening ceremony. You can come with a vague idea or no idea at all — that's the fun of a hackathon.",
  },
  {
    q: 'What should we bring?',
    a: "Your laptop, chargers, student/employee ID, and your team's energy! We provide internet, food, snacks, and a comfortable working environment.",
  },
  {
    q: 'How is judging done?',
    a: 'Projects are evaluated on: Innovation (25%), Technical Complexity (25%), Execution & Demo (25%), and Real-World Impact (25%). Judges are senior engineers, founders, and VCs.',
  },
  {
    q: 'Will there be mentors during the hackathon?',
    a: 'Yes! Domain experts in AI/ML, Web3, Cybersecurity, and FinTech will be available throughout the event. You can book 15-minute slots via the event app.',
  },
  {
    q: 'Can we use APIs and existing open-source libraries?',
    a: "Absolutely. You can use any public API, framework, or open-source library. You must build the core solution at the hackathon — no pre-built projects.",
  },
  {
    q: 'What happens after payment screenshot submission?',
    a: "Our team verifies your payment within 24 hours. You'll receive a confirmation email with your registration details and hackathon kit instructions.",
  },
];

// ── FAQ Item Component ────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-xl transition-all duration-200 overflow-hidden"
      style={{ borderColor: open ? 'rgba(6, 182, 212,0.3)' : 'rgba(30,30,34,1)' }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-sm text-zinc-200">{question}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        }
      </button>
      <div
        className={`faq-content ${open ? 'open' : ''}`}
        style={{ maxHeight: open ? '400px' : '0' }}
      >
        <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', teamNo: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '', teamNo: '' });
      } else {
        setStatus('error');
        // Extract specific field error if available
        let detailedError = data.message ?? 'Failed to send. Please try again.';
        if (data.fields) {
          const firstFieldError = Object.values(data.fields)[0];
          if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
            detailedError = `${detailedError} (${firstFieldError[0]})`;
          }
        }
        setErrorMsg(detailedError);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Name</label>
          <input
            id="contact-name"
            type="text"
            className="input-field"
            placeholder="Rahul Kumar"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-zinc-400 mb-1.5">Email</label>
          <input
            id="contact-email"
            type="email"
            className="input-field"
            placeholder="rahul@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            maxLength={254}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-subject" className="block text-xs font-semibold text-zinc-400 mb-1.5">Subject</label>
          <input
            id="contact-subject"
            type="text"
            className="input-field"
            placeholder="Question about registration"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            required
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="contact-team" className="block text-xs font-semibold text-zinc-400 mb-1.5">
            Team No / Name <span className="text-zinc-600 font-normal">(Optional)</span>
          </label>
          <input
            id="contact-team"
            type="text"
            className="input-field"
            placeholder="e.g. Team 42"
            value={form.teamNo}
            onChange={e => setForm(f => ({ ...f, teamNo: e.target.value }))}
            maxLength={50}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-zinc-400 mb-1.5">Message</label>
        <textarea
          id="contact-message"
          className="input-field min-h-[120px] resize-y"
          placeholder="Tell us what's on your mind..."
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          required
          maxLength={2000}
          rows={5}
        />
      </div>

      {status === 'success' && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✅ Message sent! We&apos;ll get back to you within 24 hours.
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ❌ {errorMsg}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === 'loading'}
        id="contact-submit-btn"
      >
        {status === 'loading' ? (
          <><span className="spinner" /> Sending...</>
        ) : (
          <><Send className="w-4 h-4" /> Send Message</>
        )}
      </button>
    </form>
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 select-none">
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
      {/* Circuit lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 100 Q 250 150 500 100 T 1000 100" fill="none" stroke="#06b6d4" strokeWidth="1" />
        <path d="M0 500 Q 250 450 500 500 T 1000 500" fill="none" stroke="#06b6d4" strokeWidth="1" />
        <circle cx="250" cy="150" r="2" fill="#06b6d4" className="animate-pulse" />
        <circle cx="750" cy="50" r="2" fill="#06b6d4" className="animate-pulse" />
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {

  return (
    <>
      <Navbar />

      <main>
        {/* ━━━━━━━━━━━ HERO ━━━━━━━━━━━ */}
        <section
          id="hero"
          className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden grid-bg"
          style={{ paddingTop: '80px' }}
        >
          <BackgroundDecor />

          {/* Background glow orbs */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-[100px] pointer-events-none"
            style={{ background: '#7c3aed' }}
          />

          <div className="container relative z-10 py-20">
            {/* Pre-heading badge */}
            <div className="flex justify-center mb-6">
              <div className="badge badge-cyan animate-fade-in">
                <Clock className="w-3 h-3" />
                April 23–24, 2026 · 18 Hours
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              Hack
              <span className="gradient-text-animated text-glow">0&apos;Clock</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl font-light text-zinc-400 mb-4 tracking-wide">
              Where Time Meets Innovation
            </p>

            <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto mb-12">
              18 hours. Unlimited ideas. ₹20,000 in prizes.
              Build something that changes the world — before the clock runs out.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register" className="btn-primary text-base px-8 py-4" id="hero-register-btn">
                <Zap className="w-5 h-5" />
                Register Your Team
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#about" className="btn-ghost text-base">
                Learn More
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>

            {/* Registration Deadline Notice */}
            <div className="flex justify-center mb-8">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                }}
              >
                <span>🔒</span>
                Registration Closed
              </div>
            </div>

            {/* Countdown */}
            <div className="mb-8">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-6">
                Hackathon Begins In
              </p>
              <CountdownTimer />
            </div>

            {/* Stats bar */}
            <div
              className="flex flex-wrap justify-center gap-px mt-16 overflow-hidden rounded-2xl"
              style={{ border: '1px solid rgba(30,30,34,1)' }}
            >
              {[
                { label: 'Prize Pool', value: '₹20,000', icon: Trophy },
                { label: 'Duration', value: '18 hrs', icon: Clock },
                { label: 'Tracks', value: '5', icon: Target },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex-1 min-w-[120px] flex flex-col items-center py-5 px-4 gap-2"
                  style={{ background: 'rgba(17,17,19,0.8)' }}
                >
                  <Icon className="w-5 h-5 text-cyan-500" />
                  <span className="text-2xl font-black text-white">{value}</span>
                  <span className="text-xs text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ ABOUT ━━━━━━━━━━━ */}
        <section id="about" className="section relative overflow-hidden">
          <BackgroundDecor />
          <div className="container relative z-10">
            <div className="">
              <div className="text-center mb-16">
                <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">About</p>
                <h2 className="text-4xl font-black mb-4">What is <span className="gradient-text">Hack0&apos;Clock</span>?</h2>
                <div className="divider mx-auto" />
                <p className="text-zinc-400 text-lg max-w-3xl mx-auto">
                  Hack0&apos;Clock is a 18-hour team hackathon where the clock is your biggest challenge and your biggest motivator.
                  We bring together the brightest minds to compress months of innovation into a single adrenaline-fueled day.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: 'Build in 18 Hours',
                  desc: 'From idea to working prototype in 18 intense hours. The pressure is real, the results are extraordinary.',
                },
                {
                  icon: Users,
                  title: 'Collaborate & Compete',
                  desc: 'Teams of 2-4. Diverse skill sets. One shared goal — build something that matters.',
                },
                {
                  icon: Award,
                  title: 'Win Big',
                  desc: '₹20,000 in prizes, cloud credits, mentorship, and direct investor introductions.',
                },
              ].map((item) => (
                <div key={item.title} className="card text-center group">
                  <div className="p-3 rounded-xl w-fit mx-auto mb-4 transition-all group-hover:scale-110"
                    style={{ background: 'rgba(6, 182, 212,0.08)', border: '1px solid rgba(6, 182, 212,0.15)' }}
                  >
                    <item.icon className="w-6 h-6 text-cyan-500" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ PRIZES ━━━━━━━━━━━ */}
        <section id="prizes" className="section" style={{ background: 'rgba(17,17,19,0.5)' }}>
          <div className="container">
            <div className="text-center mb-16">
              <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">Prizes</p>
              <h2 className="text-4xl font-black mb-4">₹20,000 <span className="gradient-text">Prize Pool</span></h2>
              <div className="divider mx-auto" />
              <p className="text-zinc-400">Compete for glory, career-changing opportunities, and serious cash.</p>
            </div>

            {/* Main Prizes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {prizes.map((prize, i) => (
                <div
                  key={prize.place}
                  className={`card relative overflow-hidden ${i === 0 ? 'md:-mt-4 md:mb-4' : ''}`}
                  style={prize.highlight ? {
                    background: 'rgba(6, 182, 212,0.05)',
                    borderColor: 'rgba(6, 182, 212,0.3)',
                    boxShadow: '0 0 40px rgba(6, 182, 212,0.1)',
                  } : {}}
                >
                  {prize.highlight && (
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                  )}
                  <div className="text-4xl mb-4">{prize.icon}</div>
                  <div className="badge badge-cyan mb-3">{prize.place}</div>
                  <div className="text-3xl font-black text-white mb-4">{prize.amount}</div>
                  <ul className="space-y-2">
                    {prize.perks.map(perk => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="text-cyan-500 mt-0.5">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>


          </div>
        </section>

        {/* ━━━━━━━━━━━ SCHEDULE ━━━━━━━━━━━ */}
        <section id="schedule" className="section relative overflow-hidden">
          <BackgroundDecor />
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">Schedule</p>
              <h2 className="text-4xl font-black mb-4">Event <span className="gradient-text">Timeline</span></h2>
              <div className="divider mx-auto" />
              <p className="text-zinc-400">April 23–24, 2026 · Every minute counts.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {schedule.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-6 p-5 rounded-xl transition-all ${
                    item.highlight
                      ? 'bg-cyan-500/5 border border-cyan-500/20'
                      : 'border border-zinc-800/50'
                  }`}
                >
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className={`text-sm font-mono font-bold ${item.highlight ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ background: item.highlight ? '#06b6d4' : '#27272a' }}
                    />
                    {idx < schedule.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: 'rgba(6, 182, 212,0.1)' }} />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${item.highlight ? 'text-cyan-300' : 'text-white'}`}>
                      {item.event}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ TRACKS ━━━━━━━━━━━ */}
        <section id="tracks" className="section relative overflow-hidden" style={{ background: 'rgba(17,17,19,0.5)' }}>
          <BackgroundDecor />
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">Tracks</p>
              <h2 className="text-4xl font-black mb-4">Choose Your <span className="gradient-text">Domain</span></h2>
              <div className="divider mx-auto" />
              <p className="text-zinc-400">5 high-impact tracks across tomorrow&apos;s most critical technology areas.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-5">
              {tracks.map((track) => (
                <div 
                  key={track.id} 
                  className="card group cursor-default w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.25rem)] min-w-[280px]"
                >
                  <div
                    className="p-2.5 rounded-lg w-fit mb-4 transition-all group-hover:scale-110"
                    style={{ background: 'rgba(6, 182, 212,0.08)', border: '1px solid rgba(6, 182, 212,0.12)' }}
                  >
                    <track.icon className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{track.label}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{track.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ FAQ ━━━━━━━━━━━ */}
        <section id="faq" className="section">
          <div className="container max-w-3xl">
            <div className="text-center mb-16">
              <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-4xl font-black mb-4">Frequently Asked <span className="gradient-text">Questions</span></h2>
              <div className="divider mx-auto" />
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ CONTACT ━━━━━━━━━━━ */}
        <section id="contact" className="section relative overflow-hidden" style={{ background: 'rgba(17,17,19,0.5)' }}>
          <BackgroundDecor />
          <div className="container relative z-10">
            <div className="text-center mb-16">
              <p className="text-cyan-500 text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
              <h2 className="text-4xl font-black mb-4">Get In <span className="gradient-text">Touch</span></h2>
              <div className="divider mx-auto" />
              <p className="text-zinc-400">Have questions? We&apos;re here to help.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact info */}
              <div className="space-y-6">
                <div
                  className="p-8 rounded-2xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <h3 className="font-bold text-white text-lg mb-6">Contact Information</h3>
                  <div className="space-y-5">
                    {[
                      { Icon: Mail, label: 'Email', value: 'hackoclock.dev@gmail.com' },
                      { 
                        Icon: Phone, 
                        label: 'Organizers', 
                        value: (
                          <div className="space-y-2 mt-1">
                            <div>
                               <p className="text-zinc-300 text-sm font-medium">Shakuntala Saunshi</p>
                               <p className="text-zinc-500 text-xs">+91 86187 59619</p>
                            </div>
                            <div>
                               <p className="text-zinc-300 text-sm font-medium">Sujay S Rangrej</p>
                               <p className="text-zinc-500 text-xs">+91 86609 57903</p>
                            </div>
                            <div>
                               <p className="text-zinc-300 text-sm font-medium">Ronit Bongale</p>
                               <p className="text-zinc-500 text-xs">+91 63623 22424</p>
                            </div>
                          </div>
                        )
                      },
                      { Icon: MapPin, label: 'Venue', value: <p className="text-zinc-300 text-sm font-medium">KLE Institute Of Technology , Hubli , KA</p> },
                      { Icon: Calendar, label: 'Date', value: <p className="text-zinc-300 text-sm font-medium">April 23–24, 2026</p> },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-4">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ background: 'rgba(6, 182, 212,0.08)' }}
                        >
                          <Icon className="w-4 h-4 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social */}
                <div className="flex gap-3">
                  {[
                    { Icon: MessageCircle, href: '#', label: 'Twitter/X' },
                    { Icon: Code2, href: '#', label: 'GitHub' },
                    { Icon: Briefcase, href: '#', label: 'LinkedIn' },
                  ].map(({ Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="p-3 rounded-xl border border-zinc-800 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div
                className="p-8 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-bold text-white text-lg mb-6">Send a Message</h3>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━ CTA BANNER ━━━━━━━━━━━ */}
        <section className="py-20">
          <div className="container">
            <div
              className="relative text-center py-16 px-8 rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212,0.08) 0%, rgba(17,17,19,1) 100%)',
                border: '1px solid rgba(6, 182, 212,0.2)',
                boxShadow: '0 0 60px rgba(6, 182, 212,0.08)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to race the clock?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
                Join 200+ developers, designers, and entrepreneurs for the most intense 18 hours of your career.
              </p>
              <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex" id="cta-register-btn">
                <Zap className="w-5 h-5" />
                Register Now — ₹350 per head
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ━━━━━━━━━━━ FOOTER ━━━━━━━━━━━ */}
      <footer
        className="py-12 border-t"
        style={{ borderColor: 'rgba(30,30,34,1)' }}
      >
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-white">Hack<span className="gradient-text">0&apos;Clock</span></span>
          </div>
          <p className="text-zinc-600 text-sm text-center">
            © 2026 Hack0&apos;Clock. Built with security-first principles.
          </p>
          <div className="flex items-center gap-4">
            <Lock className="w-4 h-4 text-zinc-600" />
            <span className="text-xs text-zinc-600">All data encrypted in transit & at rest</span>
          </div>
        </div>
      </footer>
    </>
  );
}
