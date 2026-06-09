import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, TrendingUp, Calendar, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as FirebaseUser } from '../lib/firebase';
import { supabase, getAccessToken } from '../lib/firebase';
import { AgentMessageContent } from './AgentMessageContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SkillAgentProps {
  user: FirebaseUser;
}

export function SkillAgent({ user }: SkillAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Nexus Intelligence Agent. I can help you with career domains, market trends, learning timelines, and skill analysis. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (!cancelled) setAiOnline(Boolean(data?.geminiConfigured && data?.status === 'ok'));
      } catch {
        if (!cancelled) setAiOnline(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const { data, error } = await supabase.from('user_skills').select('skill_name').eq('user_id', user.id);
        if (error) throw error;
        const skills = (data || []).map((doc: any) => doc.skill_name);
        setUserSkills(skills);
      } catch (err) {
        console.error('Agent failed to fetch skills context:', err);
      }
    };
    if (user) fetchUserSkills();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const payload = {
      prompt: userMessage,
      context: `Current user skills: ${userSkills.join(', ') || 'none'}`,
      userSkills
    };

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to use AI Agent.');
      }

      const response = await fetch('/api/ai/skill-agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        const msg = result?.error?.message || result?.message || 'AI service error';
        throw new Error(msg);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: result.answer || 'I could not generate a response.' }]);
    } catch (error) {
      console.error('AI Agent Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection to Nexus Intelligence interrupted.';
      setMessages(prev => [...prev, { role: 'assistant', content: `Unable to respond: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: 'What are the top AI trends in 2026?', icon: TrendingUp },
    { text: 'How long to become a Full Stack Dev?', icon: Calendar },
    { text: 'Compare Frontend vs Backend demand', icon: Map }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 group"
      >
        {isOpen ? (
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        ) : (
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
        {!isOpen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[var(--color-bg-main)]"></div>}
      </button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] max-w-[400px] h-[500px] sm:h-[600px] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 bg-indigo-600/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nexus Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${aiOnline === false ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                      {aiOnline === null ? 'Checking…' : aiOnline ? 'System Online' : 'AI Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-zinc-800' : 'bg-indigo-600/20'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                    </div>
                  <div className={`min-w-0 p-4 rounded-2xl ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-zinc-300 border border-white/5 rounded-tl-none'
                    }`}>
                      <AgentMessageContent content={m.content} variant={m.role} />
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="p-6 border-t border-white/5 bg-zinc-950/50">
              {messages.length === 1 && (
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest pl-1">Suggested Queries</p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(s.text)}
                      className="flex items-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[11px] text-zinc-400 hover:text-white transition-all text-left"
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask intelligence agent..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

