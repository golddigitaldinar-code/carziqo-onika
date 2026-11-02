import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Loader as Loader2, KeyRound, Lock, Shield } from 'lucide-react';

export default function Security() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'withdrawal'>('login');

  async function changeLoginPassword() {
    if (!currentPassword || !newPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function setWithdrawalPwd() {
    if (withdrawalPassword.length !== 6) {
      showToast('Withdrawal password must be 6 digits', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ withdrawal_password: withdrawalPassword })
      .eq('user_id', profile!.user_id);
    setLoading(false);
    if (error) {
      showToast('Failed to set password', 'error');
    } else {
      showToast('Withdrawal password set', 'success');
      await refreshProfile();
      setWithdrawalPassword('');
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Security" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'login' ? 'bg-[#16a35a] text-white' : 'bg-white text-[#9babc6] border border-[#dfe5f0]'}`}
          >
            Login Password
          </button>
          <button
            onClick={() => setTab('withdrawal')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'withdrawal' ? 'bg-[#16a35a] text-white' : 'bg-white text-[#9babc6] border border-[#dfe5f0]'}`}
          >
            Withdrawal Password
          </button>
        </div>

        {tab === 'login' ? (
          <div className="card">
            <h3 className="text-sm font-semibold text-[#323643] mb-3 flex items-center gap-2">
              <Lock size={16} className="text-[#16a35a]" /> Change Login Password
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9babc6] mb-1 block">Current password</label>
                <input type="password" className="input-field" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#9babc6] mb-1 block">Choose a new password</label>
                <input type="password" className="input-field" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#9babc6] mb-1 block">Confirm new password</label>
                <input type="password" className="input-field" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button onClick={changeLoginPassword} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={18} className="animate-spin" />}
                Change Password
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#e6f7ee] flex items-center justify-center">
                <KeyRound size={24} className="text-[#16a35a]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#323643]">Set Withdrawal Password</h3>
                <p className="text-xs text-[#9babc6]">Required for withdrawals</p>
              </div>
            </div>
            {profile?.withdrawal_password ? (
              <div className="bg-[#e6f7ee] rounded-xl p-3 mb-3">
                <p className="text-xs text-[#16a35a] font-medium flex items-center gap-1">
                  <Shield size={14} /> Withdrawal password is set
                </p>
              </div>
            ) : null}
            <div className="mb-3">
              <label className="text-xs text-[#9babc6] mb-1 block">Enter 6-digit password</label>
              <input
                type="password"
                className="input-field text-center text-xl tracking-widest"
                placeholder="------"
                maxLength={6}
                value={withdrawalPassword}
                onChange={(e) => setWithdrawalPassword(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button onClick={setWithdrawalPwd} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {profile?.withdrawal_password ? 'Update Password' : 'Set Password'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
