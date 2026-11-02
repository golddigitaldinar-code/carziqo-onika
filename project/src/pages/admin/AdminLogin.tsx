import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { ADMIN_EMAIL_DOMAIN, isAdminSession } from '@/lib/admin';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader as Loader2, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const suffixHint = `@${ADMIN_EMAIL_DOMAIN}`;

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const entry = email.trim().toLowerCase();
    if (!entry || !password) {
      setError('Enter your admin email and password');
      return;
    }

    const adminEmail = entry.includes('@') ? entry : `${entry}${suffixHint}`;

    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password,
    });

    if (signInError) {
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    if (!(await isAdminSession())) {
      await supabase.auth.signOut();
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    setLoading(false);
    setPassword('');
    showToast('Welcome to the admin panel', 'success');
    onSuccess();
  }

  return (
    <div className="px-4 py-8 flex justify-center">
      <div className="card w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#e6f7ee] flex items-center justify-center mb-3">
            <ShieldCheck size={28} className="text-[#16a35a]" />
          </div>
          <h2 className="text-lg font-semibold text-[#323643]">Admin Sign In</h2>
          <p className="text-xs text-[#9babc6] mt-1">Restricted area. Enter your admin credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-medium text-[#9babc6] mb-1 block">Admin email</label>
            <input
              id="admin-email"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder={`carziqo-admin${suffixHint}`}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-xs font-medium text-[#9babc6] mb-1 block">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-12"
                placeholder="Admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9babc6]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-[#dc2626]">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
