import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Sparkles, Loader as Loader2, CircleCheck as CheckCircle } from 'lucide-react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  points: number;
}

const GAME_SECONDS = 6;
const SPAWN_MS = 600;
const BUBBLE_LIFETIME_MS = 1800;
const bubbleColors = ['#16a35a', '#2979ff', '#ef9100', '#22c55e', '#4fa3ff'];
const bubblePoints = [5, 10, 15, 20, 50];

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export default function Bubbles() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [playedToday, setPlayedToday] = useState<boolean | null>(null);
  const bubbleIdRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (!profile?.user_id) return;
    checkPlayedToday(profile.user_id);
  }, [profile?.user_id]);

  async function checkPlayedToday(userId: string) {
    const { data, error } = await supabase
      .from('bubble_records')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfUtcDayIso())
      .limit(1);
    if (error) {
      setPlayedToday(null);
      showToast('Could not check today\'s game status', 'error');
      return;
    }
    setPlayedToday((data?.length ?? 0) > 0);
  }

  const spawnBubble = useCallback(() => {
    const newBubble: Bubble = {
      id: bubbleIdRef.current++,
      x: Math.random() * 85 + 5,
      y: Math.random() * 70 + 10,
      size: Math.random() * 30 + 40,
      color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
      points: bubblePoints[Math.floor(Math.random() * bubblePoints.length)],
    };
    setBubbles((prev) => [...prev, newBubble]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, BUBBLE_LIFETIME_MS);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setBubbles([]);
    setTimeLeft(GAME_SECONDS);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;

    const spawnId = setInterval(spawnBubble, SPAWN_MS);
    const tickId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(spawnId);
      clearInterval(tickId);
    };
  }, [playing, spawnBubble]);

  useEffect(() => {
    if (playing && timeLeft <= 0) {
      setPlaying(false);
      setBubbles([]);
      submitScore();
    }
  }, [playing, timeLeft]);

  async function submitScore() {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_bubble_game', {
        p_points: scoreRef.current,
      });
      if (error) throw error;
      if (data && data.error) {
        showToast(data.error, 'error');
        setSubmitting(false);
        return;
      }
      setPlayedToday(true);
      await refreshProfile();
      showToast(`Earned ${scoreRef.current} carbon points!`, 'success');
    } catch {
      showToast('Failed to save score', 'error');
    }
    setSubmitting(false);
  }

  function popBubble(bubble: Bubble) {
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    const newScore = scoreRef.current + bubble.points;
    scoreRef.current = newScore;
    setScore(newScore);
  }

  const canStart = playedToday === false && !submitting;

  return (
    <AppLayout>
      <PageHeader title="Pop Bubbles" backPath="/home" />
      <div className="px-4 py-4">
        <div className="card mb-4 bg-gradient-to-br from-[#4fa3ff] to-[#2979ff] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={24} />
              <div>
                <p className="text-xs text-white/70">Score</p>
                <p className="text-2xl font-bold">{score} pts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Time</p>
              <p className="text-2xl font-bold">{playing ? timeLeft : GAME_SECONDS}s</p>
            </div>
          </div>
        </div>

        <div className="relative w-full h-80 bg-gradient-to-b from-[#e5f2ff] to-[#f0f7ff] rounded-2xl overflow-hidden mb-4">
          {playing ? (
            bubbles.map((b) => (
              <button
                key={b.id}
                onClick={() => popBubble(b)}
                className="absolute rounded-full transition-all animate-bubbleFloat"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  background: `radial-gradient(circle at 30% 30%, ${b.color}88, ${b.color})`,
                  border: '2px solid white',
                  boxShadow: `0 4px 12px ${b.color}44`,
                }}
              >
                <span className="text-white font-bold text-xs">{b.points}</span>
              </button>
            ))
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              {playedToday === null ? (
                <Loader2 size={32} className="text-[#2979ff] animate-spin" />
              ) : playedToday ? (
                <>
                  <CheckCircle size={48} className="text-[#16a35a]" />
                  <p className="text-sm text-[#323643] font-medium">You have played today</p>
                  <p className="text-xs text-[#9babc6]">Come back tomorrow for another round.</p>
                </>
              ) : (
                <>
                  <Sparkles size={48} className="text-[#2979ff]" />
                  <p className="text-sm text-[#9babc6]">
                    {submitting ? 'Saving your score...' : 'Pop as many bubbles as you can in 6 seconds!'}
                  </p>
                  <button onClick={startGame} disabled={!canStart} className="btn-primary flex items-center gap-2">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    {submitting ? 'Saving...' : 'Click and Start'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-[#323643] mb-2">How to Play</h3>
          <div className="space-y-1 text-xs text-[#9babc6]">
            <p>• Tap bubbles before they disappear</p>
            <p>• Each bubble gives 5-50 carbon points</p>
            <p>• Each round lasts 6 seconds</p>
            <p>• You can play once per day, resetting at midnight UTC</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
