import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ShortcutsModal: React.FC = () => {
  const { shortcutsOpen, setShortcutsOpen } = useAppStore();

  if (!shortcutsOpen) return null;

  const shortcuts = [
    { key: '/', description: 'Open Spotify-style global search' },
    { key: 'Ctrl + K', description: 'Universal search shortcut' },
    { key: 'g then d', description: 'Navigate to National Dashboard' },
    { key: 'g then s', description: 'Navigate to Students Directory' },
    { key: 'g then c', description: 'Navigate to Colleges Directory' },
    { key: 'g then v', description: 'Navigate to Verification Hub' },
    { key: 'g then f', description: 'Navigate to Discrepancy Flags' },
    { key: 'g then h', description: 'Navigate to Home Shelves' },
    { key: '?', description: 'Toggle this keyboard shortcuts dialog' },
    { key: 'Esc', description: 'Close any active overlay or search modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#282828] mb-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Keyboard className="w-5 h-5 text-[#1DB954]" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="text-zinc-500 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60 last:border-0">
              <span className="text-[#B3B3B3] font-medium">{sc.description}</span>
              <kbd className="px-2 py-1 rounded bg-[#242424] border border-zinc-700 font-mono text-zinc-200 font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-[#282828] text-center">
          <button
            onClick={() => setShortcutsOpen(false)}
            className="spotify-pill-btn text-xs py-1.5 px-6"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
