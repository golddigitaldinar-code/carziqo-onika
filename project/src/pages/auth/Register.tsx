import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader as Loader2, Check } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !phone || !password) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please accept the Privacy Policy', 'error');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, phone, referralCode || undefined);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Registration successful', 'success');
      navigate('/home');
    }
  }

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="gradient-hero px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center shadow-lg">
            <img src="/assets/images/carziqo.webp" alt="Carziqo" className="w-full h-full rounded-2xl object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Carziqo Sign Up</h1>
            <p className="text-xs text-white/50">Create your partner account</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#f0f3f8] rounded-t-3xl -mt-4 px-6 pt-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Phone Number</label>
            <input
              type="tel"
              className="input-field"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9babc6]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Invitation Code (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Invitation Code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-2 text-sm text-[#9babc6]"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                agreed ? 'bg-[#16a35a] border-[#16a35a]' : 'border-[#dfe5f0]'
              }`}
            >
              {agreed && <Check size={12} className="text-white" />}
            </div>
            <span>
              I have read and agree to the{' '}
              <Link to="/privacy" className="text-[#16a35a] font-medium">Privacy Policy</Link>
            </span>
          </button>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#9babc6]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#16a35a] font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
