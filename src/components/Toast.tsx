/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  text: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ text, type, onClose }) => {
  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [text, onClose]);

  if (!text) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-100 bg-white shadow-[0_10px_30px_-5px_rgba(16,185,129,0.1)]',
    error: 'border-rose-100 bg-white shadow-[0_10px_30px_-5px_rgba(244,63,94,0.1)]',
    info: 'border-blue-100 bg-white shadow-[0_10px_30px_-5px_rgba(59,130,246,0.1)]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-zinc-150 shadow-lg ${borderColors[type]}`}
        >
          {icons[type]}
          <div className="flex-1 text-sm font-medium text-zinc-800 leading-snug text-left">
            {text}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
