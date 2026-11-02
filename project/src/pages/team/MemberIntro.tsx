import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Users, Award, TrendingUp, Crown } from 'lucide-react';

export default function MemberIntro() {
  const levels = [
    { level: 0, name: 'Standard', minTeam: 0, commission: '5%', color: '#9babc6' },
    { level: 1, name: 'Silver', minTeam: 5, commission: '8%', color: '#9ca3af' },
    { level: 2, name: 'Gold', minTeam: 20, commission: '12%', color: '#ef9100' },
    { level: 3, name: 'Platinum', minTeam: 50, commission: '15%', color: '#2979ff' },
    { level: 4, name: 'Diamond', minTeam: 100, commission: '20%', color: '#16a35a' },
  ];

  return (
    <AppLayout>
      <PageHeader title="Member Introduction" backPath="/profile" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#0f1729] to-[#1a1f2e] text-white">
          <h2 className="text-lg font-bold mb-2">Global Personal Partner Program</h2>
          <p className="text-xs text-white/60">VIP level upgrade with team growth. Earn higher commission rates as you build your team.</p>
        </div>

        <div className="space-y-3 mb-4">
          {levels.map((lv) => (
            <div key={lv.level} className="card flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${lv.color}20` }}
              >
                {lv.level >= 3 ? <Crown size={22} style={{ color: lv.color }} /> : <Award size={22} style={{ color: lv.color }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#323643]">{lv.name}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: lv.color }}>
                    VIP {lv.level}
                  </span>
                </div>
                <p className="text-xs text-[#9babc6] mt-0.5">Min team: {lv.minTeam} members</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: lv.color }}>{lv.commission}</p>
                <p className="text-[10px] text-[#9babc6]">commission</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#323643] mb-2">Benefits</h3>
          <div className="space-y-2 text-xs text-[#9babc6]">
            <p>• Higher commission rates on team earnings</p>
            <p>• Access to exclusive premium vehicles</p>
            <p>• Priority withdrawal processing</p>
            <p>• Weekly performance rewards</p>
            <p>• Exclusive event invitations</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
