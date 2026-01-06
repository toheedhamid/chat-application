import React, { useState, useEffect, useRef } from 'react';

// Complete chat interface component
function ChatInterface({ isDrawerOpen = true }) {
  // State - load from localStorage if available
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('n8n_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => {
    const saved = localStorage.getItem('n8n_chat_conversation_id');
    return saved || `conv_${Date.now()}`;
  });
  
  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Your PRODUCTION Railway n8n URL
  const N8N_PRODUCTION_URL = 'https://n8n-main-instance-production-0ed4.up.railway.app';
  const CHAT_API_URL = `${N8N_PRODUCTION_URL}/webhook/answer`;

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('n8n_chat_messages', JSON.stringify(messages));
    localStorage.setItem('n8n_chat_conversation_id', conversationId);
  }, [messages, conversationId]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isDrawerOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDrawerOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add a message to chat
  const addMessage = (text, sender, metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      text: text,
      sender: sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Extract message from n8n response
  const extractMessage = (data) => {
    if (!data) return 'No response received from n8n';
    
    // Try different response formats in order
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    
    if (data.response_message && typeof data.response_message === 'string') {
      return data.response_message;
    }
    
    if (data.json) {
      if (data.json.response_message && typeof data.json.response_message === 'string') {
        return data.json.response_message;
      }
      if (data.json.message && typeof data.json.message === 'string') {
        return data.json.message;
      }
    }
    
    if (data.text && typeof data.text === 'string') {
      return data.text;
    }
    
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (firstItem.json) {
        if (firstItem.json.response_message) return firstItem.json.response_message;
        if (firstItem.json.message) return firstItem.json.message;
        if (firstItem.json.text) return firstItem.json.text;
      }
      if (firstItem.response_message) return firstItem.response_message;
      if (firstItem.message) return firstItem.message;
    }
    
    if (data.type === 'direct_response') {
      if (data.message) return data.message;
      if (data.text) return data.text;
    }
    
    // If nothing matches, show formatted response
    const responseStr = JSON.stringify(data, null, 2);
    if (responseStr.length < 200) {
      return `Response: ${responseStr}`;
    }
    
    return 'Received response but could not extract message.';
  };

  // Handle sending message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    
    // Add user message to chat
    addMessage(userMessage, 'user');
    
    // Clear input and show loading
    setInput('');
    setLoading(true);

    try {
      const requestBody = { 
        text: userMessage, 
        conversationId: conversationId
      };

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      
      // Extract bot message
      const botMessage = extractMessage(data);
      
      // Add bot message to chat
      addMessage(botMessage, 'bot', {
        intent: data.intent || data.json?.intent,
        confidence: data.confidence || data.json?.confidence
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage(`Sorry, there was an error processing your message.`, 'bot', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Clear chat (with confirmation)
  const clearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Are you sure you want to clear the chat history?')) {
        setMessages([]);
        // Generate new conversation ID
        const newId = `conv_${Date.now()}`;
        localStorage.setItem('n8n_chat_conversation_id', newId);
        window.location.reload(); // Refresh to use new ID
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 style={styles.title}>AI Assistant</h3>
              {messages.length > 0 && (
                <small style={styles.messageCount}>
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </small>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={styles.clearButton}>
              <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrapper}>
              <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 10h.01M12 10h.01M16 10h.01"/>
              </svg>
            </div>
            <h4 style={styles.emptyTitle}>Start a conversation</h4>
            <p style={styles.emptyDescription}>
              Ask me anything! I'm here to help you with your questions.
            </p>
            <div style={styles.suggestions}>
              <div style={styles.suggestionChip}>💼 Services</div>
              <div style={styles.suggestionChip}>💰 Pricing</div>
              <div style={styles.suggestionChip}>📞 Contact</div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{
                ...styles.messageRow,
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {msg.sender === 'bot' && (
                <div style={styles.avatarBot}>
                  <svg style={styles.avatarIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z"/>
                  </svg>
                </div>
              )}
              <div 
                style={{
                  ...styles.messageBubble,
                  ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble)
                }}
              >
                <div style={styles.messageContent}>{msg.text}</div>
                <div style={styles.messageFooter}>
                  <span style={styles.timestamp}>{msg.timestamp}</span>
                  {msg.intent && (
                    <span style={styles.intentBadge}>
                      {msg.intent}
                      {msg.confidence && ` • ${Math.round(msg.confidence * 100)}%`}
                    </span>
                  )}
                </div>
              </div>
              {msg.sender === 'user' && (
                <div style={styles.avatarUser}>
                  <svg style={styles.avatarIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={styles.inputContainer}>
        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <div style={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={styles.inputField}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendButton,
                opacity: (input.trim() && !loading) ? 1 : 0.4,
              }}
            >
              {loading ? (
                <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="15">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              ) : (
                <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '22px',
    height: '22px',
    color: '#ffffff',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: '-0.02em',
  },
  messageCount: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '400',
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  buttonIcon: {
    width: '16px',
    height: '16px',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: '#f9fafb',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
  },
  emptyIcon: {
    width: '40px',
    height: '40px',
    color: '#ffffff',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  emptyDescription: {
    fontSize: '15px',
    color: '#6b7280',
    margin: '0 0 32px 0',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  suggestions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionChip: {
    padding: '10px 20px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  messageRow: {
    display: 'flex',
    marginBottom: '16px',
    gap: '12px',
    maxWidth: '800px',
    margin: '0 auto 16px auto',
  },
  avatarBot: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarIcon: {
    width: '20px',
    height: '20px',
    color: '#ffffff',
  },
  messageBubble: {
    padding: '12px 16px',
    borderRadius: '16px',
    maxWidth: '70%',
    wordWrap: 'break-word',
    animation: 'slideIn 0.3s ease-out',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  botBubble: {
    backgroundColor: '#ffffff',
    color: '#111827',
    borderBottomLeftRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '6px',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '4px',
  },
  timestamp: {
    fontSize: '11px',
    opacity: 0.7,
  },
  intentBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    borderRadius: '4px',
    fontWeight: '500',
  },
  inputContainer: {
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    padding: '16px 24px',
  },
  inputForm: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    padding: '14px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: '48px',
    height: '48px',
    padding: '0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
};

export default ChatInterface;