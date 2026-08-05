import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function AIChatWidget() {
  const { isChatOpen, setChatOpen, chatMessages, sendChatMessage, isAiThinking, experimentConfig, activePartConfig, activePartId, currentSubject } = useExperimentStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const config = activePartConfig || experimentConfig;
  const isProcessControl = currentSubject === 'instrumentation-process-control' || experimentConfig?.subject === 'instrumentation-process-control';

  const quickChips = isProcessControl
    ? activePartId === 'partA'
      ? [
          'Explain time constant τ',
          'What is 63.2% response?',
          'Explain lumped capacitance model',
          'Why is my τ different from theory?'
        ]
      : [
          'Explain Amplitude Ratio (AR)',
          'How is phase lag calculated?',
          'Frequency of oscillation ω',
          'Why does output wave lag?'
        ]
    : [
        'Explain Cd formula',
        'Why is my Cd low?',
        'Explain Bernoulli principle',
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
      {/* Floating Action Button (Clean vibrant circle bottom-right) */}
      <motion.button
        onClick={() => setChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xl border border-violet-500 cursor-pointer"
        title="Open AI Lab Assistant"
      >
        {isChatOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-7 h-7 text-white" />}
      </motion.button>

      {/* Chat Panel Popup (Clean White SaaS Layout) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-[420px] h-[550px] max-h-[80vh] rounded-2xl bg-white border border-[#EDEEF1] flex flex-col overflow-hidden shadow-2xl text-slate-900"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-[#EDEEF1] bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                    <span>AI Lab Assistant</span>
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Grounded in: {experimentConfig?.short_name || 'Lab'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Conversation Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs bg-slate-50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 font-bold border border-violet-200">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[82%] leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-violet-600 text-white font-medium rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-mono'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[9px] opacity-60 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold border border-slate-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-violet-600 font-mono text-xs p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing experiment context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-700 text-[10px] font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-[#EDEEF1] bg-white">
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
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiThinking}
                  className="p-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
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
