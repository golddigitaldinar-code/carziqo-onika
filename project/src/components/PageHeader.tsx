import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  backPath?: string;
  rightAction?: ReactNode;
  dark?: boolean;
}

export default function PageHeader({ title, backPath, rightAction, dark = false }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-4 h-14 nav-glass border-b ${
        dark ? 'border-transparent' : 'border-[#dfe5f0]'
      }`}
    >
      <button
        onClick={() => (backPath ? navigate(backPath) : navigate(-1))}
        className="flex items-center justify-center w-9 h-9 -ml-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <ChevronLeft size={24} className={dark ? 'text-white' : 'text-[#323643]'} />
      </button>
      <h1 className={`text-base font-semibold flex-1 text-center ${dark ? 'text-white' : 'text-[#323643]'}`}>
        {title}
      </h1>
      <div className="w-9 flex justify-end items-center">{rightAction}</div>
    </header>
  );
}
