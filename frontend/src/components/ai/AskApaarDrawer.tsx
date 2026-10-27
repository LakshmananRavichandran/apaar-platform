import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { ApiClient } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  chartType?: string;
  chartTitle?: string;
  chartData?: any[];
  followUps?: string[];
}

const COLORS = ['#0A3871', '#EA580C', '#15803D', '#2563EB', '#D97706', '#7C3AED'];

export const AskApaarDrawer: React.FC = () => {
  const { aiDrawerOpen, setAiDrawerOpen } = useAppStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Namaste! I am **Ask APAAR**, your AI-powered technical assistant. I can query live academic data across all 60 colleges and 5,000 students.',
      followUps: [
        'How many flagged students in Maharashtra?',
        'Show top colleges by verification score',
        'What is the gender ratio of students?'
      ]
    }
  ]);

  if (!aiDrawerOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await ApiClient.post('/ai-assistant/query', { query: queryText });
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        chartType: res.chart_type,
        chartTitle: res.chart_title,
        chartData: res.chart_data,
        followUps: res.follow_ups
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: `Error analyzing query: ${e.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0A3871] dark:text-blue-400">
            <Sparkles className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ask APAAR AI Assistant</h3>
            <span className="text-[10px] text-[#15803D] dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Live National Database
            </span>
          </div>
        </div>
        <button
          onClick={() => setAiDrawerOpen(false)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#0A3871] text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                A
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#0A3871] text-white font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Render Chart if available */}
              {m.chartData && m.chartData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 rounded-lg p-2.5">
                  {m.chartTitle && (
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
                      <span>{m.chartTitle}</span>
                    </div>
                  )}

                  {m.chartType === 'pie' ? (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={m.chartData}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={55}
                            label={(entry: any) => `${entry.name || entry.label || ''}: ${entry.value}`}
                          >
                            {m.chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', fontSize: 10, color: '#0F172A' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : m.chartType === 'metric' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {m.chartData.map((d, i) => (
                        <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-center">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{d.label}</div>
                          <div className="text-sm font-black text-[#0A3871] dark:text-blue-400">{d.value.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={m.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 9 }} interval={0} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', fontSize: 10, color: '#0F172A' }} />
                          <Bar dataKey="value" fill="#0A3871" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up Prompt Pills */}
              {m.followUps && m.followUps.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                  {m.followUps.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(f)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition text-left"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                U
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <Sparkles className="w-4 h-4 text-[#EA580C] animate-spin" />
            <span>Analyzing student records & calculating metrics...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about students, states, flags, or colleges..."
            className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-lg bg-[#0A3871] text-white hover:bg-[#082C59] disabled:opacity-40 flex items-center justify-center transition shrink-0 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
