/**
 * app/auth/signin/page.tsx
 *
 * Admin sign-in page. Regular users use OAuth directly.
 * Styled consistently with the dark Hack0'Clock brand.
 */

'use client';
@@ -50,5 +50,5 @@
         <div className="flex items-center justify-center gap-2 mb-8">
           <Clock className="w-6 h-6 text-cyan-500" />
           <span className="text-xl font-bold">
-            Hack<span className="gradient-text">O&apos;Clock</span>
+            Hack<span className="gradient-text">0&apos;Clock</span>
           </span>
         </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-cyan-500" />
            <h1 className="font-bold text-white">Admin Access</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signin-email" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="signin-email"
                  type="email"
                  className="input-field pl-10"
                  placeholder="admin@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-12"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
              id="admin-login-btn"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                <><Lock className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-xs text-zinc-600 text-center mt-6">
            All login attempts are logged for security purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
