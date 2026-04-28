import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, TrendingUp, Calendar, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const aiEnabled = Boolean(ai);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SkillAgentProps {
  user: FirebaseUser;
}

export function SkillAgent({ user }: SkillAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Nexus Intelligence Agent. I can help you with career domains, market trends, learning timelines, and skill analysis. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const skillsSnap = await getDocs(collection(db, 'users', user.uid, 'skills'));
        const skills = skillsSnap.docs.map(doc => doc.data().skillName);
        setUserSkills(skills);
      } catch (err) {
        console.error("Agent failed to fetch skills context:", err);
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
    if (!aiEnabled) {
      setMessages(prev => [...prev, { role: 'assistant', content: "AI agent unavailable: Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment or disable the chat feature." }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build prompt context
      const systemInstruction = `
        You are the "SkillNexus Intelligence Agent", a sophisticated career strategist and tech industry oracle.
        Your primary directive is to decode career paths for user ${user.displayName || 'Nexus Scholar'} with surgical precision.
        
        USER CURRENT SKILLS: [${userSkills.join(', ') || 'No skills added yet'}]

        You specialize in:
        1. **Domain Deep-Dives**: Detailed breakdowns of Frontend, Backend, AI/ML, DevOps, CyberSec, etc.
        2. **Market Trend Analysis**: Using platform demand scoring (0-1) and growth visualizations to explain which skills are "Hot" vs "Stable". 
           - Mention that AI/ML (Generative AI) and DevOps (Kubernetes/Kubernetes) currently lead with the highest trend scores (>0.95).
        3. **Timeline Projections**: Estimate realistic durations to move from 'Beginner' to 'Industry Ready'. 
           - Junior Path: 6-12 months.
           - Senior Mastery: 3-5 years.
           
        Tone: Brutalist, high-intelligence, yet encouraging. Use tech-forward vocabulary (e.g., "Knowledge Clusters", "Intelligence Gaps", "Growth Vectors").
        
        Limit responses to under 150 words unless the user asks for a deep roadmap.
      `;

      if (!ai) throw new Error('AI not initialized');
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const assistantMessage = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error("AI Agent Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to Nexus Intelligence interrupted. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: "What are the top AI trends in 2026?", icon: TrendingUp },
    { text: "How long to become a Full Stack Dev?", icon: Calendar },
    { text: "Compare Frontend vs Backend demand", icon: Map },
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
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">System Online</span>
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
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-zinc-300 border border-white/5 rounded-tl-none'
                    }`}>
                      {m.content}
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

