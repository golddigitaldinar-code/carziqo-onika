import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Share2, Copy, Users, Gift, TrendingUp, Award } from 'lucide-react';

export default function Referral() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const referralLink = `https://carziqo.site/register?ref=${profile?.referral_code || ''}`;

  function copyCode() {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      showToast('Referral code copied', 'success');
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    showToast('Referral link copied', 'success');
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Carziqo',
          text: 'Join me on Carziqo and start earning! Use my referral code:',
          url: referralLink,
        });
      } catch {
        // User cancelled share — no action needed
      }
    } else {
      copyLink();
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Refer a Friend" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#16a35a] to-[#0f7142] text-white text-center">
          <Share2 size={32} className="mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Earn rewards when friends join and invest</h2>
          <p className="text-xs text-white/70">Commission on team member earnings</p>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-2">Your Referral Code</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#f0f3f8] rounded-xl py-3 px-4 text-center">
              <span className="text-lg font-bold font-mono text-[#16a35a] tracking-wider">
                {profile?.referral_code || 'N/A'}
              </span>
            </div>
            <button onClick={copyCode} className="btn-primary !px-4 flex items-center gap-1">
              <Copy size={16} /> Copy
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-2">Referral Link</h3>
          <div className="bg-[#f0f3f8] rounded-xl p-3 mb-2">
            <p className="text-xs text-[#323643] break-all">{referralLink}</p>
          </div>
          <button onClick={copyLink} className="btn-outline w-full flex items-center justify-center gap-2 mb-2">
            <Share2 size={16} /> Copy Link
          </button>
          <button onClick={shareLink} className="btn-primary w-full flex items-center justify-center gap-2">
            <Share2 size={16} /> Share via App
          </button>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">How it works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e6f7ee] flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-[#16a35a]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323643]">1. Share your code</p>
                <p className="text-xs text-[#9babc6]">Invite friends using your referral code or link</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fff8eb] flex items-center justify-center flex-shrink-0">
                <Gift size={16} className="text-[#ef9100]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323643]">2. Friends join & invest</p>
                <p className="text-xs text-[#9babc6]">When they register and start investing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e5f2ff] flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-[#2979ff]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323643]">3. Earn commission</p>
                <p className="text-xs text-[#9babc6]">Get commission on their earnings automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <Award size={16} className="text-[#ef4444]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#323643]">4. VIP upgrade</p>
                <p className="text-xs text-[#9babc6]">VIP level upgrade with team growth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
