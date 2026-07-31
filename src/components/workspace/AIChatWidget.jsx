import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, CornerDownLeft } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function AIChatWidget() {
  const { isChatOpen, setChatOpen, chatMessages, sendChatMessage, isAiThinking, experimentConfig } = useExperimentStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const quickChips = [
    'Explain this formula',
    'Why is my Cd low?',
    'Explain Bernoulli assumption',
    'Real-world industry application'
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;
    sendChatMessage(query);
    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiThinking]);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(0,229,255,0.5)] border border-cyan-300/40 cursor-pointer"
        title="Open AI Lab Assistant"
      >
        {isChatOpen ? <X className="w-6 h-6 text-slate-950" /> : <Bot className="w-7 h-7 text-slate-950" />}
      </motion.button>

      {/* Chat Panel Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-[420px] h-[550px] max-h-[80vh] rounded-2xl glass-panel border border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl bg-slate-950/90"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <span>AI Lab Assistant</span>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Grounded in: {experimentConfig?.short_name || 'Lab'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Conversation Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900/90 border border-cyan-500/20 text-slate-200 rounded-tl-none font-mono'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[9px] opacity-60 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing experiment context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-cyan-500/20 bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask formula, Cd error, or Bernoulli theory..."
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiThinking}
                  className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
