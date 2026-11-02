import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/UI';
import { Newspaper, Star } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  created_at: string;
}

export default function News() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (data) setNews(data as NewsItem[]);
    setLoading(false);
  }

  const cats = ['All', ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = category === 'All' ? news : news.filter((n) => n.category === category);

  return (
    <AppLayout>
      <PageHeader title="News" backPath="/home" />
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {cats.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                category === cat ? 'bg-[#16a35a] text-white' : 'bg-white text-[#9babc6] border border-[#dfe5f0]'
              }`}
            >
              {cat === 'All' ? 'All News' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading news..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Newspaper} title="No news found" />
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/news-detail?id=${n.id}`)}
                className="card card-hover w-full text-left flex gap-3"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#f0f3f8] flex-shrink-0">
                  {n.image_url ? (
                    <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={24} className="text-[#9babc6]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#e6f7ee] text-[#16a35a]">
                      {n.category}
                    </span>
                    {n.is_featured && <Star size={12} className="text-[#ef9100] fill-[#ef9100]" />}
                  </div>
                  <h3 className="text-sm font-semibold text-[#323643] line-clamp-2">{n.title}</h3>
                  <p className="text-xs text-[#9babc6] line-clamp-2 mt-1">{n.summary}</p>
                  <p className="text-[10px] text-[#9babc6] mt-1">{formatDate(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
