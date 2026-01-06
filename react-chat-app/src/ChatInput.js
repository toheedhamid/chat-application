import React, { useState, useEffect, useRef } from 'react';

// Complete modern chat interface component
function ChatInterface({ isDrawerOpen = true }) {
  // State - load from localStorage if available
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('n8n_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isDrawerOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  }, [messages, isTyping]);

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
    if (!data) return 'No response received';
    
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
        return data.message;
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
    
    return 'I received your message.';
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
    setIsTyping(true);

    try {
      const requestBody = { 
        text: userMessage, 
        conversationId: conversationId
      };

      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

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
      
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract bot message
      const botMessage = extractMessage(data);
      
      // Add bot message to chat
      addMessage(botMessage, 'assistant', {
        intent: data.intent || data.json?.intent,
        confidence: data.confidence || data.json?.confidence
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage(`Sorry, I encountered an issue. Please try again.`, 'assistant', { type: 'error' });
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  // Clear chat (with confirmation)
  const clearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Clear all chat messages?')) {
        setMessages([]);
        // Generate new conversation ID
        const newId = `conv_${Date.now()}`;
        localStorage.setItem('n8n_chat_conversation_id', newId);
      }
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return timestamp;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatar}>
            <span style={styles.avatarText}>AI</span>
          </div>
          <div style={styles.headerInfo}>
            <h3 style={styles.title}>Assistant</h3>
            {isTyping ? (
              <div style={styles.typingStatus}>
                <div style={styles.typingDots}>
                  <div style={styles.dot}></div>
                  <div style={styles.dot}></div>
                  <div style={styles.dot}></div>
                </div>
                <span style={styles.typingText}>typing...</span>
              </div>
            ) : (
              <p style={styles.subtitle}>Ask me anything</p>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} style={styles.clearButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.welcomeIllustration}>
              <div style={styles.welcomeIcon}>💬</div>
            </div>
            <h3 style={styles.welcomeTitle}>Start a conversation</h3>
            <p style={styles.welcomeText}>I'm here to help with your questions about services, pricing, and more.</p>
            <div style={styles.suggestions}>
              <button 
                onClick={() => setInput("What services do you offer?")}
                style={styles.suggestionButton}
              >
                What services do you offer?
              </button>
              <button 
                onClick={() => setInput("Tell me about pricing")}
                style={styles.suggestionButton}
              >
                Tell me about pricing
              </button>
              <button 
                onClick={() => setInput("How can I contact support?")}
                style={styles.suggestionButton}
              >
                How can I contact support?
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={msg.id}>
                {/* Show date separator for new days */}
                {index > 0 && new Date(msg.id).toDateString() !== new Date(messages[index - 1].id).toDateString() && (
                  <div style={styles.dateSeparator}>
                    <span>{new Date(msg.id).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                
                {/* Message bubble */}
                <div 
                  style={{
                    ...styles.messageContainer,
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.sender === 'assistant' && (
                    <div style={styles.assistantAvatar}>
                      <span style={styles.assistantAvatarText}>AI</span>
                    </div>
                  )}
                  
                  <div 
                    style={{
                      ...styles.messageBubble,
                      ...(msg.sender === 'user' ? styles.userBubble : styles.assistantBubble),
                      marginLeft: msg.sender === 'assistant' ? '8px' : '0',
                      marginRight: msg.sender === 'user' ? '0' : '8px',
                    }}
                  >
                    <div style={styles.messageContent}>{msg.text}</div>
                    <div style={styles.messageFooter}>
                      <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
                      {msg.intent && (
                        <span style={styles.intentBadge}>
                          {msg.intent}
                          {msg.confidence && (
                            <span style={styles.confidenceBadge}>
                              {Math.round(msg.confidence * 100)}%
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {msg.sender === 'user' && (
                    <div style={styles.userAvatar}>
                      <span style={styles.userAvatarText}>You</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div style={styles.messageContainer}>
                <div style={styles.assistantAvatar}>
                  <span style={styles.assistantAvatarText}>AI</span>
                </div>
                <div style={styles.typingBubble}>
                  <div style={styles.typingIndicator}>
                    <div style={styles.typingDot}></div>
                    <div style={styles.typingDot}></div>
                    <div style={styles.typingDot}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} style={styles.scrollAnchor} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
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
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={styles.sendButton}
            >
              {loading ? (
                <div style={styles.sendButtonLoading}>
                  <div style={styles.spinner}></div>
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </div>
          <div style={styles.inputHint}>
            Press Enter to send • Shift + Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}

// Modern Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16px',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400',
  },
  typingStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse 1.4s infinite ease-in-out',
  },
  typingText: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '500',
  },
  clearButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  clearButtonHover: {
    backgroundColor: '#f3f4f6',
    color: '#ef4444',
    borderColor: '#fca5a5',
  },
  messagesArea: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#fafafa',
    scrollBehavior: 'smooth',
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
  welcomeIllustration: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  welcomeIcon: {
    fontSize: '36px',
    color: '#6366f1',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  welcomeText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.5',
    maxWidth: '400px',
    margin: '0 0 32px 0',
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
  },
  suggestionButton: {
    padding: '14px 20px',
    backgroundColor: '#ffffff',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  suggestionButtonHover: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  messageContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '20px',
    animation: 'fadeInUp 0.3s ease-out',
  },
  dateSeparator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '24px 0',
    position: 'relative',
  },
  dateSeparatorText: {
    backgroundColor: '#f3f4f6',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  assistantAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  assistantAvatarText: {
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: 'calc(100% - 100px)',
    padding: '16px 20px',
    borderRadius: '20px',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderBottomLeftRadius: '8px',
  },
  userBubble: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderBottomRightRadius: '8px',
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    opacity: 0.8,
    gap: '12px',
  },
  timestamp: {
    fontSize: '11px',
  },
  intentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
  },
  typingBubble: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    padding: '16px 24px',
    borderRadius: '20px',
    borderBottomLeftRadius: '8px',
    marginLeft: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  typingIndicator: {
    display: 'flex',
    gap: '6px',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
    animation: 'typing 1.4s infinite ease-in-out',
  },
  scrollAnchor: {
    height: '1px',
  },
  inputArea: {
    padding: '20px 24px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f0f0f0',
  },
  inputForm: {
    width: '100%',
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    padding: '16px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
  },
  inputFieldFocus: {
    borderColor: '#6366f1',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  sendButton: {
    width: '52px',
    height: '52px',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
    cursor: 'not-allowed',
  },
  sendButtonLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  inputHint: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '12px',
  },
  '@global': {
    '@keyframes fadeInUp': {
      from: { 
        opacity: 0, 
        transform: 'translateY(10px)',
      },
      to: { 
        opacity: 1, 
        transform: 'translateY(0)',
      },
    },
    '@keyframes pulse': {
      '0%, 100%': { 
        opacity: 0.4,
        transform: 'scale(0.8)',
      },
      '50%': { 
        opacity: 1,
        transform: 'scale(1)',
      },
    },
    '@keyframes typing': {
      '0%, 60%, 100%': { 
        transform: 'translateY(0)',
      },
      '30%': { 
        transform: 'translateY(-6px)',
      },
    },
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },
};

// Add global styles
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  button {
    font-family: inherit;
  }
  
  input {
    font-family: inherit;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

export default ChatInterface;