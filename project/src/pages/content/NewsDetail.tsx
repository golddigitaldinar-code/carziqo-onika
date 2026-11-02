import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CircleAlert as AlertCircle, Newspaper, ArrowLeft } from 'lucide-react';

export default function NewsDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const navigate = useNavigate();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadNews();
  }, [id]);

  async function loadNews() {
    const { data } = await supabase.from('news').select('*').eq('id', id).maybeSingle();
    if (data) setNews(data);
    setLoading(false);
  }

  if (loading) return <AppLayout><PageHeader title="News Details" backPath="/news" /><LoadingSpinner /></AppLayout>;
  if (!news) return (
    <AppLayout><PageHeader title="News Details" backPath="/news" />
      <div className="flex flex-col items-center py-20">
        <AlertCircle size={48} className="text-[#9babc6] mb-3" />
        <p className="text-sm text-[#9babc6]">Article not found</p>
        <button onClick={() => navigate('/news')} className="btn-primary mt-4">Back to News</button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <PageHeader title="News Details" backPath="/news" />
      <div className="pb-4">
        {news.image_url && (
          <div className="w-full h-52 bg-[#f0f3f8]">
            <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#e6f7ee] text-[#16a35a]">
              {news.category}
            </span>
            <span className="text-xs text-[#9babc6]">{formatDate(news.created_at)}</span>
          </div>
          <h1 className="text-xl font-bold text-[#323643] mb-3">{news.title}</h1>
          <p className="text-sm text-[#9babc6] mb-4">{news.summary}</p>
          <div className="text-sm text-[#323643] leading-relaxed whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
