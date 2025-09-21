import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '../config/api';

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

// Utility function to clean AI responses for markdown parsing
const cleanAIResponse = (text) => {
  if (!text) return text;
  
  // Clean up the text for better markdown parsing
  let cleanedText = text.trim();
  
  // Ensure proper spacing around headers
  cleanedText = cleanedText.replace(/^##/gm, '\n##');
  cleanedText = cleanedText.replace(/^###/gm, '\n###');
  
  return cleanedText;
};

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // Try to get existing session ID from localStorage
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) {
      return savedSessionId;
    }
    // Generate new session ID if none exists
    const newSessionId = uuidv4();
    localStorage.setItem('chat_session_id', newSessionId);
    return newSessionId;
  });
  const [chatSessions, setChatSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (message, user) => {
    if (!message.trim()) return;

    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    addMessage(userMessage);
    setIsTyping(true);

    try {
      const response = await fetch('API_ENDPOINTS.CHAT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          message,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Debug logging to see what we're getting from the backend
      console.log('Backend response:', data);
      console.log('Response text:', data.response);
      console.log('Response type:', typeof data.response);
      
      const aiMessage = {
        id: uuidv4(),
        text: cleanAIResponse(data.response),
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: uuidv4(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(uuidv4());
  }, []);

  const loadChatSessions = useCallback(async (user) => {
    try {
      const response = await fetch('API_ENDPOINTS.CHAT/sessions', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  }, []);

  const loadChatHistory = useCallback(async (sessionId, user) => {
    try {
      const response = await fetch(`API_ENDPOINTS.CHAT/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const historyMessages = data.messages.map(msg => ({
          id: uuidv4(),
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: msg.timestamp
        }));
        setMessages(historyMessages);
        setSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('chat_session_id', newSessionId);
    setShowHistory(false);
  }, []);

  // Load chat history when component mounts or user changes
  useEffect(() => {
    const loadInitialHistory = async () => {
      try {
        if (user && sessionId) {
          await loadChatHistory(sessionId, user);
        }
      } catch (error) {
        console.error('Error loading initial chat history:', error);
      }
    };
    
    loadInitialHistory();
  }, [sessionId, loadChatHistory, user]);

  // Load chat sessions when user changes
  useEffect(() => {
    if (user) {
      loadChatSessions(user);
    }
  }, [user, loadChatSessions]);

  const value = {
    messages,
    isTyping,
    sessionId,
    chatSessions,
    showHistory,
    addMessage,
    sendMessage,
    clearMessages,
    loadChatSessions,
    loadChatHistory,
    startNewChat,
    setShowHistory
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

