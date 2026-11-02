import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader as Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Login successful', 'success');
      navigate('/home');
    }
  }

  return (
    <div className="app-container flex flex-col min-h-screen">
      <div className="gradient-hero flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center mb-4 shadow-lg animate-scaleIn">
          <img src="/assets/images/carziqo.webp" alt="Carziqo" className="w-full h-full rounded-3xl object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Carziqo</h1>
        <p className="text-sm text-white/50 mt-1">Autonomous Mobility Platform</p>
      </div>

      <div className="flex-1 bg-[#f0f3f8] rounded-t-3xl -mt-6 px-6 pt-8 pb-8">
        <h2 className="text-xl font-semibold text-[#323643] mb-1">Welcome back</h2>
        <p className="text-sm text-[#9babc6] mb-6">Please login with Account and Password</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#9babc6] mb-1 block">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
                autoComplete="current-password"
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

          <div className="flex justify-end">
            <Link to="/reset" className="text-xs text-[#16a35a] font-medium">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#9babc6]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#16a35a] font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
