/**
 * app/auth/signin/page.tsx
 *
 * Admin sign-in page.
 * Redesigned with a high-end "Cyber-Tech" aesthetic.
 * Glassmorphism, animated grid background, and glowing cyan accents.
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Clock, Lock, Mail, Key, AlertCircle, 
  Loader2, Eye, EyeOff, ShieldCheck, 
  Cpu, Activity, Zap 
} from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('admin-credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.replace('/admin');
    } else if (result?.error === 'TOO_MANY_ATTEMPTS') {
      setError('Too many login attempts. Please wait 15 minutes and try again.');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-hoc-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)',
            animation: 'grain 8s steps(10) infinite',
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full animate-[pulse_8s_infinite] opacity-20 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-cyan-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-purple-600 rounded-full blur-[120px]" />
        </div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8 group cursor-default">
          <div className="relative">
            <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
            <Clock className="w-10 h-10 text-cyan-400 relative animate-[float_4s_infinite_ease-in-out]" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            HACK<span className="gradient-text">0&apos;CLOCK</span>
          </span>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">
            <Activity className="w-3 h-3" />
            System Control Panel
          </div>
        </div>

        {/* Login Card */}
        <div
          className="rounded-3xl p-1 overflow-hidden relative"
          style={{ 
            background: 'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(255,255,255,0.05) 50%, rgba(139,92,246,0.3) 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div className="bg-[#0a0a0c]/90 backdrop-blur-2xl rounded-[22px] p-8 relative overflow-hidden">
            {/* Terminal Header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <div className="h-4 w-px bg-zinc-800 mx-2" />
                <h1 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                  Authentication_Required
                </h1>
              </div>
              <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="signin-email" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Admin_Identifier
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    id="signin-email"
                    type="email"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-zinc-700"
                    placeholder="admin@hack0clock.tech"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signin-password" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Access_Key
                </label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-zinc-700"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs animate-[shake_0.4s_ease-in-out]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full relative group overflow-hidden rounded-2xl py-4 font-bold text-white transition-all disabled:opacity-50"
                disabled={loading}
                id="admin-login-btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> ESTABLISHING_CONN...</>
                  ) : (
                    <><Cpu className="w-5 h-5" /> AUTHORIZE_ACCESS</>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 animate-pulse" />
                Secure_Link_Established
              </span>
              <span>v2.4.0</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 text-center mt-6 font-mono uppercase tracking-[0.2em] opacity-50">
          All entry attempts are audited and logged
        </p>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          30% { transform: translate(5%, -10%); }
          50% { transform: translate(-10%, 5%); }
          70% { transform: translate(10%, 10%); }
          90% { transform: translate(-5%, 5%); }
        }
      `}</style>
    </main>
  );
}
