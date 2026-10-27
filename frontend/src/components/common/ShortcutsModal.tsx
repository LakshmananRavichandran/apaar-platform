import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ShortcutsModal: React.FC = () => {
  const { shortcutsOpen, setShortcutsOpen } = useAppStore();

  if (!shortcutsOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Open global academic search' },
    { key: 'Ctrl + K', description: 'Universal search shortcut' },
    { key: 'g then d', description: 'Navigate to National Dashboard' },
    { key: 'g then s', description: 'Navigate to Students Directory' },
    { key: 'g then c', description: 'Navigate to Colleges Directory' },
    { key: 'g then v', description: 'Navigate to Verification Hub' },
    { key: 'g then f', description: 'Navigate to Discrepancy Flags' },
    { key: 'g then h', description: 'Navigate to Home Portal' },
    { key: '?', description: 'Toggle this keyboard shortcuts dialog' },
    { key: 'Esc', description: 'Close any active overlay or search modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Keyboard className="w-5 h-5 text-[#0A3871] dark:text-blue-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{sc.description}</span>
              <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 font-bold shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono">Esc</kbd> anytime to dismiss
          </span>
        </div>
      </div>
    </div>
  );
};
