import { Loader as Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <Loader2 size={size} className="text-[#16a35a] animate-spin" />
      {label && <p className="text-sm text-[#9babc6]">{label}</p>}
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f3f8]">
      <Loader2 size={32} className="text-[#16a35a] animate-spin" />
    </div>
  );
}
