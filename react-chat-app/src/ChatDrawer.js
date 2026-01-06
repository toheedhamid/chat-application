import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

function ChatDrawer({ isOpen, onClose, messages, onSendMessage, onFeedback, onClearChat, isLoading, setLoading, conversationId }) {
  
  // Production Railway n8n backend URL
  const PRODUCTION_N8N_URL = 'https://n8n-main-instance-production-0ed4.up.railway.app';
  
  // Local n8n backend URL for development (fallback)
  const LOCAL_N8N_URL = 'http://localhost:5678';
  
  // Railway n8n backend URL (set in Vercel environment variables)
  // Support multiple variable names for flexibility
  const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 
                       process.env.NEXT_PUBLIC_N8N_BASE_URL ||
                       process.env.REACT_APP_N8N_WEBHOOK_URL?.replace('/webhook/answer', '').replace('/webhook/chat-memory', '') ||
                       process.env.REACT_APP_API_BASE_URL?.replace('/api', '');
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const CALENDLY_LINK = 'https://calendly.com/your-link'; // Your actual Calendly link
  
  // API endpoints - Priority: 1. Local n8n, 2. Environment variables, 3. Production Railway, 4. Vercel API
  let chatEndpoint;
  
  if (N8N_BASE_URL && !N8N_BASE_URL.includes('localhost')) {
    chatEndpoint = `${N8N_BASE_URL}/webhook/answer`;
  } else if (N8N_BASE_URL && N8N_BASE_URL.includes('localhost')) {
    chatEndpoint = `${N8N_BASE_URL}/webhook-test/answer`;
  } else {
    chatEndpoint = `${LOCAL_N8N_URL}/webhook-test/answer`;
  }
  
  const API_ENDPOINTS = {
    chat: chatEndpoint,
    status: `${API_BASE_URL}/status` // Status endpoint stays on Vercel
  };

  // State for knowledge base last update timestamp
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);

  // Fetch knowledge base status on component mount and when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchKBStatus = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.status, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.lastUpdate) {
          setLastUpdateTimestamp(data.lastUpdate);
        }
      } catch (error) {
        console.error('Failed to fetch KB status:', error);
        // Don't set timestamp on error, leave it as null
      }
    };

    fetchKBStatus();
  }, [isOpen, API_ENDPOINTS.status]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return null;
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    try {
      // For now, show a placeholder message
      onSendMessage('Summarization feature is not yet available in this version.', 'bot', { type: 'info' });
    } catch (error) {
      console.error('Failed to summarize:', error);
      onSendMessage('Sorry, I couldn\'t generate a summary.', 'bot', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCaseStudies = async () => {
    setLoading(true);
    try {
      // For now, show a placeholder message
      onSendMessage('Case studies feature is not yet available in this version.', 'bot', { type: 'info' });
    } catch (error) {
      console.error('Failed to get case studies:', error);
      onSendMessage('Sorry, I couldn\'t retrieve case studies.', 'bot', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (option) => {
    // Handle escalation options from sentiment/guardrails
    if (option.action === 'navigate') {
      if (option.destination === 'book') {
        // Open Calendly for booking
        window.open(CALENDLY_LINK, '_blank');
        onSendMessage('Opening booking calendar...', 'bot');
      } else {
        // For now, show a placeholder message for other navigation
        onSendMessage(`Navigation to ${option.destination} is not yet available in this version.`, 'bot', { type: 'info' });
      }
    } else if (option.action === 'mailto') {
      window.location.href = `mailto:${option.destination}`;
    } else if (option.action === 'dismiss') {
      onSendMessage('Thanks! I\'m here if you need anything else.', 'bot');
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all chat history?')) {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversationId || 'default',
            action: 'clear'
          })
        });

        if (response.ok) {
          onClearChat();
        } else {
          throw new Error('Failed to clear chat on server');
        }
      } catch (error) {
        console.error('Failed to clear chat:', error);
        // Still clear local chat even if server call fails
        onClearChat();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      right: isOpen ? '0' : '-450px',
      width: '450px',
      height: '700px',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'right 0.3s ease-in-out',
      zIndex: 1000,
      borderTopLeftRadius: '12px'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#007bff',
        color: 'white',
        borderTopLeftRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>AI Assistant</h3>
            {lastUpdateTimestamp && (
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '11px', 
                opacity: 0.9,
                fontWeight: 'normal'
              }}>
                Knowledge base last updated: {formatTimestamp(lastUpdateTimestamp)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: 'white',
              padding: '0',
              lineHeight: '1'
            }}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSummarize}
            disabled={messages.length < 3 || isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: messages.length >= 3 && !isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: messages.length >= 3 && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              opacity: messages.length >= 3 && !isLoading ? 1 : 0.5
            }}
            title={messages.length < 3 ? "Need at least 3 messages to summarize" : "Summarize conversation"}
          >
            📝 Summarize
          </button>
          
          <button
            onClick={handleCaseStudies}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: !isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              opacity: !isLoading ? 1 : 0.5
            }}
            title="Show case studies"
          >
            📂 Case Studies
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Clear all chat history?')) {
                handleClearChat();
              }
            }}
            disabled={messages.length === 0 || isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: messages.length > 0 && !isLoading ? 'rgba(220, 53, 69, 0.8)' : 'rgba(220, 53, 69, 0.4)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: messages.length > 0 && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              opacity: messages.length > 0 && !isLoading ? 1 : 0.5
            }}
            title="Clear chat history"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
      
      <MessageList 
        messages={messages} 
        onFeedback={onFeedback} 
        isLoading={isLoading}
        onOptionClick={handleOptionClick}
        CALENDLY_LINK={CALENDLY_LINK}
      />
      
      <ChatInput 
        onSendMessage={onSendMessage} 
        setLoading={setLoading}
        isDrawerOpen={isOpen}
        conversationId={conversationId}
        WEBHOOK_URL={API_ENDPOINTS.chat}
      />
    </div>
  );
}

export default ChatDrawer;