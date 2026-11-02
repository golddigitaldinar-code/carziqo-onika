import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/UI';
import { Calendar, Flame, Award, Loader as Loader2 } from 'lucide-react';

export default function Checkin() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (profile?.user_id) loadCheckins();
  }, [profile]);

  async function loadCheckins() {
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('date', { ascending: false });
    if (data) {
      setCheckins(data);
      const today = new Date().toISOString().split('T')[0];
      const todayCheckin = data.find((c) => new Date(c.date).toISOString().split('T')[0] === today);
      setTodayCheckedIn(!!todayCheckin);
      setStreak(data[0]?.streak || 0);
    }
    setLoading(false);
  }

  async function handleCheckin() {
    if (todayCheckedIn) return;
    setCheckingIn(true);
    try {
      const newStreak = streak + 1;
      const points = Math.min(5 + newStreak, 20);

      const { error } = await supabase.from('checkins').insert({
        user_id: profile!.user_id,
        streak: newStreak,
        points_earned: points,
        date: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase.from('carbon_records').insert({
        user_id: profile!.user_id,
        type: 'earn',
        points,
        description: 'Daily check-in reward',
      });

      await supabase
        .from('profiles')
        .update({ carbon_points: (profile!.carbon_points || 0) + points })
        .eq('user_id', profile!.user_id);

      await refreshProfile();
      showToast(`Checked in! Earned ${points} carbon points`, 'success');
      loadCheckins();
    } catch {
      showToast('Check-in failed', 'error');
    }
    setCheckingIn(false);
  }

  const rewards = [5, 6, 7, 8, 9, 10, 15];

  return (
    <AppLayout>
      <PageHeader title="Daily Check-in" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#ef9100] to-[#cc7e00] text-white text-center">
          <Flame size={32} className="mx-auto mb-2" />
          <p className="text-xs text-white/70">Current Streak</p>
          <p className="text-3xl font-bold">{streak} days</p>
          <p className="text-xs text-white/60 mt-1">Earned every active day</p>
        </div>

        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">7-Day Rewards</h3>
          <div className="grid grid-cols-7 gap-1">
            {rewards.map((pts, i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center ${
                  i < streak
                    ? 'bg-[#16a35a] text-white'
                    : i === streak && !todayCheckedIn
                    ? 'bg-[#e6f7ee] border-2 border-[#16a35a]'
                    : 'bg-[#f0f3f8] text-[#9babc6]'
                }`}
              >
                <span className="text-[9px] font-medium">Day {i + 1}</span>
                <span className="text-xs font-bold">{pts}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCheckin}
          disabled={todayCheckedIn || checkingIn}
          className={`w-full rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            todayCheckedIn
              ? 'bg-[#f0f3f8] text-[#9babc6]'
              : 'btn-primary'
          }`}
        >
          {checkingIn && <Loader2 size={18} className="animate-spin" />}
          {todayCheckedIn ? 'Checked In Today' : checkingIn ? 'Checking in...' : 'Check In Now'}
        </button>

        <div className="card mt-4">
          <h3 className="text-sm font-semibold text-[#323643] mb-3">Check-in History</h3>
          {loading ? (
            <div className="flex justify-center py-4">Loading...</div>
          ) : checkins.length === 0 ? (
            <EmptyState icon={Calendar} title="No check-ins yet" />
          ) : (
            <div className="space-y-2">
              {checkins.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#f0f3f8] last:border-0">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#16a35a]" />
                    <span className="text-sm text-[#323643]">{formatDate(c.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9babc6]">Streak: {c.streak}</span>
                    <span className="text-sm font-semibold text-[#ef9100]">+{c.points_earned} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
