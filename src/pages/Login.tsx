import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/supabase';
import { GooseLarge } from '@/components/icons/Goose';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const { user, isLoading, signIn } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4">
      {/* Yellow accent stripe at top — like a receipt header */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-yellow" />

      <div className="w-full max-w-sm animate-slide-up">

        {/* Brand lockup */}
        <div className="flex flex-col items-center mb-10">
          <GooseLarge className="mb-4" />
          <h1 className="font-serif text-[64px] font-black tracking-tight text-cream uppercase leading-none text-center">
            C3 Cafe<span className="text-yellow">.</span>
          </h1>
        </div>

        {/* Login card — cream paper on dark */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded bg-rust/10 border border-rust/25 text-rust-dark text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={cn('btn-label w-full mb-3 justify-center', isSubmitting && 'opacity-60')}
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-tan/40" />
              <span className="font-mono text-[10px] text-tan-dark tracking-widest">or</span>
              <div className="h-px flex-1 bg-tan/40" />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn-label btn-label-secondary w-full justify-center"
              disabled={isSubmitting}
            >
              ☕ Demo login
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
