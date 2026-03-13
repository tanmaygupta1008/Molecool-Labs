import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

const ReactionChatbot = ({ currentReaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize greeting only once or when reaction changes significantly, but let's just do it cleanly
  useEffect(() => {
    if (currentReaction) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Hello! I'm your AI lab assistant. What would you like to know about ${currentReaction.name}?` 
        }
      ]);
    }
  }, [currentReaction?.id]); // Restart chat context when reaction changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Mock AI response delay
    setTimeout(() => {
      const response = generateMockResponse(userMessage, currentReaction);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

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

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 z-50 bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-110 flex items-center justify-center pointer-events-auto border border-cyan-400/50 group"
          title="Ask AI Assistant"
        >
          <div className="relative">
            <Bot size={28} />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-cyan-200" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-6 right-6 z-50 w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all duration-300 transform origin-bottom-right">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-900/40 to-black/40">
            <div className="flex items-center gap-2">
              <Bot className="text-cyan-400" size={24} />
              <div>
                <h3 className="text-white font-bold tracking-wide text-sm">AI Lab Assistant</h3>
                <p className="text-cyan-400/60 text-xs">Molecool Labs</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center mr-2 mt-1 shrink-0 border border-cyan-500/30">
                    <Bot size={14} className="text-cyan-400" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-900/20' 
                    : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-none shadow-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center mr-2 mt-1 shrink-0 border border-cyan-500/30">
                    <Bot size={14} className="text-cyan-400" />
                  </div>
                <div className="bg-white/10 border border-white/5 p-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center h-10 w-16 justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${currentReaction?.name || 'reaction'}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-500"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 border border-cyan-400/30"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ReactionChatbot;
