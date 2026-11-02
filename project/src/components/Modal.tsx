import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[480px] p-5 animate-slideUp max-h-[80vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#323643]">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center">
              <X size={20} className="text-[#9babc6]" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center z-10"
          >
            <X size={20} className="text-[#9babc6]" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
