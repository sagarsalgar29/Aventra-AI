import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign,
  Heart,
  Star,
  MessageCircle,
  BookOpen,
  Utensils,
  Compass,
  Users,
  X
} from 'lucide-react';

function Chat() {
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    clearMessages, 
    chatSessions, 
    showHistory, 
    loadChatSessions, 
    loadChatHistory, 
    startNewChat, 
    setShowHistory 
  } = useChat();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadChatSessions(user);
    }
  }, [user, loadChatSessions]);

  useEffect(() => {
    // Handle URL parameters for pre-filled messages
    const messageParam = searchParams.get('message');
    if (messageParam && !messages.length) {
      setInputMessage(decodeURIComponent(messageParam));
    }
  }, [searchParams, messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await sendMessage(inputMessage, user);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const [quickActions, setQuickActions] = useState([
    { text: "Show my trips", icon: Calendar, category: "trips" },
    { text: "Analyze my spending", icon: DollarSign, category: "expenses" },
    { text: "Check crowd levels", icon: Users, category: "location" },
    { text: "Find travelers", icon: Heart, category: "social" },
    { text: "Get directions", icon: MapPin, category: "navigation" },
    { text: "Budget recommendations", icon: Star, category: "budget" }
  ]);

  // Load personalized quick actions based on user history
  React.useEffect(() => {
    loadPersonalizedActions();
  }, []);

  const loadPersonalizedActions = async () => {
    try {
      // This would fetch from user profile and AI suggestions
      const personalizedActions = [
        { text: "Plan my next cultural trip", icon: BookOpen, category: "personalized" },
        { text: "Find food experiences in Asia", icon: Utensils, category: "personalized" },
        { text: "Budget-friendly destinations", icon: DollarSign, category: "personalized" },
        { text: "Solo travel recommendations", icon: Compass, category: "personalized" },
        { text: "Weekend getaway ideas", icon: Calendar, category: "personalized" }
      ];
      setQuickActions(personalizedActions);
    } catch (error) {
      console.error('Error loading personalized actions:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Trip Planner</h1>
              <p className="text-sm text-gray-500">Your personal travel assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>History</span>
            </button>
            <button
              onClick={startNewChat}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          <button
            onClick={clearMessages}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
              Clear
          </button>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="bg-white w-80 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {chatSessions.length > 0 ? (
                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        loadChatHistory(session.id, user);
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {session.messages?.[0]?.content?.substring(0, 50) || 'New Chat'}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No chat history yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start a conversation to see your history here</p>
                </div>
              )}
            </div>
          </div>
          <div 
            className="flex-1" 
            onClick={() => setShowHistory(false)}
          ></div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome back, {user?.displayName || 'Traveler'}!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              I'm your AI travel assistant, ready to help you plan amazing trips. 
              I can create complete itineraries, find accommodations, suggest activities, 
              and answer any travel questions you have!
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left border border-gray-200 hover:border-blue-300"
                >
                  <action.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-3xl ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.sender === 'ai' && !message.isError ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 mb-2 mt-2">{children}</h3>,
                          p: ({children}) => <p className="text-sm text-gray-800 mb-2 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="text-sm text-gray-800 mb-2 ml-4 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="text-sm text-gray-800 mb-2 ml-4 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-sm text-gray-800">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-700">{children}</em>
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    </div>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white text-gray-900 shadow-sm border border-gray-200 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your trip..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          AI-powered travel planning • Ask about destinations, accommodations, activities, and more
          <div className="mt-1 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Personalized with your trip data</span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            ✨ Full access to: Expenses • Live Location • Social Travel • Analytics • Reviews
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;

