import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  children: React.ReactNode;
  submitText?: string;
  submitVariant?: 'primary' | 'danger';
  /** Wider panel for dense forms (e.g. admin user role). */
  wide?: boolean;
}

export function AdminModal({
  isOpen,
  title,
  onClose,
  onSubmit,
  loading,
  children,
  submitText = 'Save',
  submitVariant = 'primary',
  wide = false
}: AdminModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-50 ${wide ? 'max-w-4xl' : 'max-w-md'}`}
          >
            <div className="bg-linear-to-br from-zinc-900 to-black rounded-2xl border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {children}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-zinc-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmit}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
                    submitVariant === 'danger'
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/20'
                      : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20'
                  }`}
                >
                  {loading ? 'Loading...' : submitText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
