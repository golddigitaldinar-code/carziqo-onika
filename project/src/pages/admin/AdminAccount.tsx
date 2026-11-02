import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader as Loader2, LogOut } from 'lucide-react';

interface AdminAccountProps {
  onSignOut: () => void;
}

export default function AdminAccount({ onSignOut }: AdminAccountProps) {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 12) {
      setError('Use at least 12 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError('Could not update the password. Try again.');
      return;
    }
    setPassword('');
    setConfirm('');
    showToast('Admin password updated', 'success');
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-sm font-semibold text-[#323643] mb-1">Change admin password</h3>
        <p className="text-[11px] text-[#9babc6] mb-4">Use at least 12 characters with letters, numbers, and symbols.</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-12"
              placeholder="New password"
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
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field"
            placeholder="Confirm new password"
          />
          {error && <p className="text-xs text-[#dc2626]">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Update password
          </button>
        </form>
      </div>

      <button onClick={onSignOut} className="btn-outline w-full flex items-center justify-center gap-2">
        <LogOut size={16} />
        Sign out of admin
      </button>
    </div>
  );
}
