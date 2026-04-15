'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Sparkles, Zap, ZapOff } from 'lucide-react';

const ReactionChatbot = ({ currentReaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null); // null = unknown, true/false
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // ── Check ML backend connectivity ──────────────────────
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/ml-predict', { method: 'GET' });
      const data = await res.json();
      setBackendOnline(data.connected === true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Check health on mount and when chat opens
  useEffect(() => {
    if (isOpen) checkBackendHealth();
  }, [isOpen, checkBackendHealth]);

  // Periodic health check every 30s while open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [isOpen, checkBackendHealth]);

  // ── Reset greeting when reaction changes ───────────────
  useEffect(() => {
    if (currentReaction) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your AI lab assistant. Ask me anything about chemistry — try something like *"What happens when sodium reacts with water?"*\n\nCurrently viewing: **${currentReaction.name}**`,
        },
      ]);
    }
  }, [currentReaction?.id]);

  // ── Auto-scroll ────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // ── Mock fallback (kept for graceful degradation) ──────
  const generateMockResponse = (msg, reaction) => {
    const lowerMsg = msg.toLowerCase();
    if (!reaction) return "I don't have information on the current reaction.";

    if (lowerMsg.includes('equation') || lowerMsg.includes('formula')) {
      return `The chemical equation is: ${reaction.equation}.`;
    }
    if (lowerMsg.includes('temperature') || lowerMsg.includes('heat') || lowerMsg.includes('thermal') || lowerMsg.includes('hot')) {
      return `This reaction has an optimal temperature of around ${reaction.optimalTemp}K. ${reaction.conditionsDesc || ''}`;
    }
    if (lowerMsg.includes('pressure')) {
      return `The optimal pressure is around ${reaction.optimalPressure} atm.`;
    }
    if (lowerMsg.includes('activation energy') || lowerMsg.includes('energy')) {
      return `The activation energy for this process is ${reaction.activationEnergy} kJ/mol.`;
    }
    if (lowerMsg.includes('enthalpy') || lowerMsg.includes('exothermic') || lowerMsg.includes('endothermic')) {
      return `The enthalpy change (ΔH) is ${reaction.enthalpy} kJ/mol. It is an ${reaction.enthalpy < 0 ? 'exothermic' : 'endothermic'} reaction.`;
    }
    if (lowerMsg.includes('catalyst')) {
      return reaction.catalysts && reaction.catalysts.length > 0
        ? `Catalysts often used: ${reaction.catalysts.join(', ')}.`
        : `This reaction typically does not require a specific catalyst described here.`;
    }
    return `That's a great question about ${reaction.name}. As a molecular AI assistant, I can confirm this is an important chemical process: ${reaction.description}`;
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Try the real ML backend via the proxy
      const res = await fetch('/api/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          session_id: sessionIdRef.current,
        }),
      });

      const data = await res.json();

      if (data.fallback) {
        // Backend returned fallback flag → use mock
        throw new Error('Fallback triggered');
      }

      // Successful ML response
      setBackendOnline(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          source: data.source,
          raw: data.raw,
          docs: data.raw?.docs || [],
        },
      ]);
    } catch {
      // Fallback to mock response
      setBackendOnline(false);
      const fallbackResponse = generateMockResponse(userMessage, currentReaction);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackResponse,
          source: 'offline',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────
  const renderMessageContent = (content) => {
    // Simple markdown-ish rendering: **bold**, *italic*, \n → <br>
    const parts = content.split('\n').map((line, i) => {
      let html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\_(.+?)\_/g, '<em>$1</em>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });
    return parts.reduce((acc, el, i) => {
      if (i === 0) return [el];
      return [...acc, <br key={`br-${i}`} />, el];
    }, []);
  };

  const StatusDot = () => {
    if (backendOnline === null) return null;
    return (
      <div className="flex items-center gap-1.5 ml-auto">
        {backendOnline ? (
          <>
            <Zap size={10} className="text-emerald-400" />
            <span className="text-[9px] text-emerald-400/80 font-medium">ML Online</span>
          </>
        ) : (
          <>
            <ZapOff size={10} className="text-amber-400" />
            <span className="text-[9px] text-amber-400/80 font-medium">Offline</span>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Button - Crystalline Action */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 z-50 bg-white text-black p-4 rounded-none shadow-3xl transition-all duration-300 hover:scale-105 flex items-center justify-center pointer-events-auto border border-white group"
          title="TACTICAL AI SUPPORT"
        >
          <div className="relative">
            <Bot size={24} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-black border border-white animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window - Crystalline Matrix */}
      {isOpen && (
        <div className="absolute bottom-6 right-6 z-50 w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col bg-black/95 backdrop-blur-md border border-white/20 rounded-none shadow-3xl overflow-hidden pointer-events-auto transition-all duration-300 transform origin-bottom-right">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-black rounded-none">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Lab Assistant</h3>
                <p className="text-[8px] font-black tracking-[0.2em] text-white/20 mt-1 uppercase">Tactical Support [Active]</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusDot />
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-none border border-white/5"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar bg-gradient-to-b from-white/[0.01] to-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-none bg-white text-black flex items-center justify-center mr-3 mt-1 shrink-0">
                    <Bot size={12} />
                  </div>
                )}
                <div className={`max-w-[85%] p-4 rounded-none text-[11px] leading-relaxed font-bold tracking-wide ${
                  msg.role === 'user'
                    ? 'bg-white text-black shadow-2xl uppercase'
                    : 'bg-white/5 text-white/60 border border-white/10 shadow-inner'
                }`}>
                  <div>{renderMessageContent(msg.content)}</div>
                  {msg.docs && msg.docs.length > 0 && (
                    <div className="mt-4 text-[9px] border-t border-white/5 pt-3">
                        <details className="group">
                            <summary className="cursor-pointer text-white/40 hover:text-white font-black flex items-center gap-2 select-none uppercase tracking-widest">
                                <span className="text-[7px] transform group-open:rotate-90 transition-transform">▶</span>
                                DATA_STREAM [{msg.docs.length}]
                            </summary>
                            <div className="mt-3 flex flex-col gap-2 relative">
                                {msg.docs.map((doc, dIdx) => (
                                    <div key={dIdx} className="bg-black/30 p-3 rounded-none border border-white/5 text-[9px] text-white/40 leading-relaxed font-mono">
                                        {doc.content}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                  )}
                  {msg.source === 'offline' && (
                    <div className="mt-2 text-[8px] font-black text-white/20 flex items-center gap-1 uppercase tracking-widest">
                      <ZapOff size={8} /> Local Cache
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-none bg-white/10 flex items-center justify-center mr-3 mt-1 shrink-0">
                  <Bot size={12} className="text-white/40" />
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-none flex gap-1.5 items-center h-8 justify-center">
                  <div className="w-1 h-1 bg-white/40 rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-white/40 rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-white/40 rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/[0.02] flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="INPUT QUERY..."
              className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-[10px] font-bold text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 uppercase tracking-[0.2em]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-white hover:bg-gray-200 disabled:opacity-20 text-black px-4 py-2 rounded-none transition-all flex items-center justify-center shrink-0 border border-white shadow-2xl tap-animation"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ReactionChatbot;
