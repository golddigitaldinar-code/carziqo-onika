import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Smartphone, Apple, Download, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function Share() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const referralLink = `https://carziqo.online/register?ref=${profile?.referral_code || ''}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Link copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppLayout>
      <PageHeader title="Download Our App" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#0f1729] to-[#1a1f2e] text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center mx-auto mb-3">
            <Smartphone size={32} className="text-white" />
          </div>
          <h2 className="text-lg font-bold">Get the full Carziqo experience</h2>
          <p className="text-xs text-white/60 mt-1">Get the full Carziqo experience on your device</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href="https://apps.apple.com/app/carziqo"
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center gap-2 py-4 transition-transform active:scale-95"
          >
            <Apple size={28} className="text-[#323643]" />
            <span className="text-sm font-medium text-[#323643]">Download for iOS</span>
            <span className="text-[10px] text-[#9babc6]">Download from App Store</span>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.carziqo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center gap-2 py-4 transition-transform active:scale-95"
          >
            <Download size={28} className="text-[#323643]" />
            <span className="text-sm font-medium text-[#323643]">Download for Android</span>
            <span className="text-[10px] text-[#9babc6]">Get it on Google Play</span>
          </a>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">Install Instructions</h3>
          <div className="space-y-2 text-xs text-[#9babc6]">
            <p>1. Tap the App Store or Google Play button above</p>
            <p>2. Download and install the Carziqo app</p>
            <p>3. Open the app on your device</p>
            <p>4. Sign in or create a new account</p>
            <p>5. Start investing and earning rewards</p>
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-2 flex items-center gap-2">
            <Share2 size={16} className="text-[#16a35a]" /> Share Referral Link
          </h3>
          <div className="bg-[#f0f3f8] rounded-xl p-3 mb-2">
            <p className="text-xs text-[#323643] break-all">{referralLink}</p>
          </div>
          <button onClick={copyLink} className="btn-outline w-full flex items-center justify-center gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
