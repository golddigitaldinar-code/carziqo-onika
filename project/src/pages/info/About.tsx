import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { SectionCard } from '@/components/UI';
import { Car, Target, Zap, Award, ExternalLink, Newspaper, Smartphone } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <PageHeader title="About Carziqo" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#0f1729] to-[#1a1f2e] text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16a35a] to-[#0f7142] flex items-center justify-center mx-auto mb-3">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">Carziqo Technologies</h1>
          <p className="text-xs text-white/60 mt-1">The future of autonomous taxi investment</p>
        </div>

        <SectionCard title="Our Mission">
          <p className="text-sm text-[#9babc6] leading-relaxed">
            Carziqo is dedicated to revolutionizing urban transportation through autonomous mobility solutions.
            We provide a platform where members can invest in autonomous taxi vehicles, earn daily passive income,
            and contribute to the future of clean energy transportation.
          </p>
        </SectionCard>

        <SectionCard title="Autonomous Mobility">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e6f7ee] flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-[#16a35a]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#323643]">Smart Fleet</h4>
                <p className="text-xs text-[#9babc6]">Advanced autonomous vehicles with cutting-edge navigation technology</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e5f2ff] flex items-center justify-center flex-shrink-0">
                <Award size={20} className="text-[#2979ff]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#323643]">Daily Returns</h4>
                <p className="text-xs text-[#9babc6]">Earn passive income from your vehicle investments every day</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fff8eb] flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-[#ef9100]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#323643]">Clean Energy</h4>
                <p className="text-xs text-[#9babc6]">Eco-friendly vehicles that contribute to sustainable mobility</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Quick Links">
          <div className="space-y-1">
            <button onClick={() => navigate('/news')} className="w-full flex items-center justify-between py-2.5 border-b border-[#f0f3f8] last:border-0">
              <span className="flex items-center gap-2 text-sm text-[#323643]"><Newspaper size={16} className="text-[#16a35a]" /> Latest News</span>
              <ExternalLink size={14} className="text-[#9babc6]" />
            </button>
            <button onClick={() => navigate('/share')} className="w-full flex items-center justify-between py-2.5 border-b border-[#f0f3f8] last:border-0">
              <span className="flex items-center gap-2 text-sm text-[#323643]"><Smartphone size={16} className="text-[#16a35a]" /> Download Our App</span>
              <ExternalLink size={14} className="text-[#9babc6]" />
            </button>
            <a href="https://carziqo.site/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-sm text-[#323643]"><ExternalLink size={16} className="text-[#16a35a]" /> Carziqo Official Website</span>
              <ExternalLink size={14} className="text-[#9babc6]" />
            </a>
          </div>
        </SectionCard>

        <div className="card text-center text-xs text-[#9babc6] mt-4">
          <p>Carziqo Technologies © 2026</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </AppLayout>
  );
}
