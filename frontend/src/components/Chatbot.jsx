import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import apiService from '../services/api';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isOpen, isLoading]);

  const initializeChat = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const response = await apiService.initChatbot();
      
      if (response.success) {
        setMessages([
          {
            id: Date.now(),
            text: response.greeting,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      setError('Failed to initialize COMPASS. Please try again.');
      console.error('Chatbot initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.sendChatMessage(trimmedMessage);

      if (response.success) {
        // Add bot response
        const botMessage = {
          id: Date.now() + 1,
          text: response.aiResponse,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Chatbot message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    console.log('Toggle clicked! Current state:', isOpen); // Debug log
    setIsOpen(!isOpen);
    setError(null);
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('Chat isOpen state changed to:', isOpen);
  }, [isOpen]);

  return (
    <div className="chatbot-container">
      {/* Floating Button - Only show when closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <button
              onClick={toggleChat}
              type="button"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
              aria-label="Open COMPASS Chat"
            >
              <MessageCircle size={28} />
            </button>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                Chat with COMPASS
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Pulse animation */}
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20 pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Chat Panel - Only show when open */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">COMPASS</h3>
                <p className="text-xs text-blue-100">Cargo & Oceanic Maritime Position Assistant Shipping System</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              type="button"
              className="hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isInitializing && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Initializing COMPASS...</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center mb-1">
                      <Bot size={16} className="text-blue-600 mr-1" />
                      <span className="text-xs font-semibold text-blue-600">COMPASS</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin text-blue-600" size={16} />
                    <span className="text-sm text-gray-600">COMPASS is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask COMPASS anything..."
                disabled={isLoading || isInitializing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || isInitializing}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask about vessels with IMO numbers*
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;