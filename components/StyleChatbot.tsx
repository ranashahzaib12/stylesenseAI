import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToHuggingFace } from '../services/huggingFaceService';
import { getGeminiChatResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { USE_GEMINI_CHATBOT } from '../constants';

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-2xl max-w-sm md:max-w-md lg:max-w-lg shadow-sm ${
          isUser
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-background text-textPrimary border border-textSecondary/10 rounded-bl-none'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

const GREETING: ChatMessage = { sender: 'bot', text: "Hi! I'm StyleBot. How can I help you with your fashion questions today?" };

const StyleChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { weather, location, quizDetails, generatedOutfits, triedOnOutfits } = useAppContext();

  useEffect(() => {
    setMessages([GREETING]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let contextSummary = "You are StyleBot, a friendly and knowledgeable fashion advisor. Provide concise, helpful, and encouraging style tips. Keep your responses to 2-4 sentences. Use the following context about the user to personalize your response:\n";
    if (location) {
        contextSummary += `- User's location: ${location.name}, ${location.country}.\n`;
    }
    if (weather) {
        contextSummary += `- Current weather: ${weather.temp}°C, ${weather.description}.\n`;
    }
    if (quizDetails) {
        contextSummary += `- User's quiz results: Prefers a ${quizDetails.vibe} style and has a ${quizDetails.bodyType} body type.\n`;
    }
    if (generatedOutfits.length > 0) {
        contextSummary += `- User has recently generated ${generatedOutfits.length} outfit(s).\n`;
    }
    if (triedOnOutfits.length > 0) {
        contextSummary += `- User has recently tried on ${triedOnOutfits.length} outfit(s) virtually.\n`;
    }
    
    let botResponseText = '';

    try {
      if (USE_GEMINI_CHATBOT) {
          const fullPrompt = `${contextSummary}\n\nUser question: "${input}"`;
          botResponseText = await getGeminiChatResponse(fullPrompt);
      } else {
          const fullPrompt = `${contextSummary}\n[INST] ${input} [/INST]`;
          botResponseText = await sendMessageToHuggingFace(fullPrompt);
      }
    } catch {
      botResponseText = "I'm having trouble right now. Please try again in a moment.";
    }

    const botMessage: ChatMessage = { sender: 'bot', text: botResponseText };
    setMessages(prev => [...prev, botMessage]);
    setLoading(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold text-textPrimary">Style Chatbot</h2>
          <p className="mt-1 text-md text-textSecondary">Your personal AI fashion advisor.</p>
        </div>
        <button
          onClick={() => setMessages([GREETING])}
          disabled={messages.length <= 1}
          className="flex-shrink-0 mt-1 flex items-center gap-1 text-xs text-textSecondary hover:text-textPrimary border border-textSecondary/20 rounded-lg px-2.5 py-1.5 hover:bg-textSecondary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Clear conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>
      <div className="flex-1 bg-surface rounded-xl shadow-lg p-4 flex flex-col border border-textSecondary/5">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, index) => (
            <Message key={index} message={msg} />
          ))}
          {loading && (
             <div className="flex items-end justify-start">
                <div className="px-4 py-3 rounded-2xl max-w-sm bg-background border border-textSecondary/10 rounded-bl-none">
                   <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 bg-textSecondary rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-textSecondary rounded-full typing-dot" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-textSecondary rounded-full typing-dot" style={{animationDelay: '0.4s'}}></div>
                   </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 border-t border-textSecondary/10 pt-4 flex items-center">
          <input
            type="text"
            className="flex-1 appearance-none border border-textSecondary/20 rounded-full py-2 px-4 bg-background text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ask a style question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="ml-3 inline-flex items-center justify-center rounded-full h-10 w-10 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleChatbot;