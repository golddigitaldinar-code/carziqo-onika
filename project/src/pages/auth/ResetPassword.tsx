import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/PageHeader';
import { Loader as Loader2, Mail } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setSent(true);
      showToast('Password reset instructions sent', 'success');
    }
  }

  if (sent) {
    return (
      <div className="app-container">
        <PageHeader title="Reset Password" backPath="/login" />
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
            <Mail size={36} className="text-[#16a35a]" />
          </div>
          <h2 className="text-lg font-semibold text-[#323643] mb-2">Check your email</h2>
          <p className="text-sm text-[#9babc6] mb-6">
            We've sent password reset instructions to your email address.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full max-w-xs">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <PageHeader title="Reset Password" backPath="/login" />
      <div className="px-6 py-8">
        <h2 className="text-xl font-semibold text-[#323643] mb-2">Forgot Password</h2>
        <p className="text-sm text-[#9babc6] mb-6">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-[#16a35a] font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
