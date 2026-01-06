import React, { useState, useEffect, useRef } from 'react';

// This is a complete chat interface component (replaces ChatInput.js)
function ChatInterface({ isDrawerOpen = true }) {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}`);
  
  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // URLs
  const LOCAL_N8N_URL = 'http://localhost:5678';
  const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 
                       process.env.NEXT_PUBLIC_N8N_BASE_URL;
  let CHAT_API_URL;
  
  if (N8N_BASE_URL && !N8N_BASE_URL.includes('localhost')) {
    CHAT_API_URL = `${N8N_BASE_URL}/webhook/answer`;
  } else if (N8N_BASE_URL && N8N_BASE_URL.includes('localhost')) {
    CHAT_API_URL = `${N8N_BASE_URL}/webhook/answer`;
  } else {
    CHAT_API_URL = `${LOCAL_N8N_URL}/webhook/answer`;
  }

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
    console.log(`Added ${sender} message:`, text);
  };

  // Extract message from n8n response
  const extractMessage = (data) => {
    if (!data) return 'No response received';
    
    // Try different response formats in order
    if (data.message) return data.message;
    if (data.response_message) return data.response_message;
    if (data.text) return data.text;
    if (data.answer) return data.answer;
    
    if (data.json) {
      if (data.json.response_message) return data.json.response_message;
      if (data.json.message) return data.json.message;
      if (data.json.text) return data.json.text;
    }
    
    if (Array.isArray(data) && data[0] && data[0].json) {
      const json = data[0].json;
      if (json.response_message) return json.response_message;
      if (json.message) return json.message;
      if (json.text) return json.text;
    }
    
    if (data.type === 'direct_response') {
      if (data.message) return data.message;
      if (data.text) return data.text;
    }
    
    // Fallback: show first 100 chars of response
    return `Response (raw): ${JSON.stringify(data).substring(0, 100)}...`;
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
      console.log('Sending to n8n:', CHAT_API_URL);
      
      const requestBody = { 
        text: userMessage, 
        conversationId: conversationId
      };

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full n8n response:', data);

      // Extract bot message
      const botMessage = extractMessage(data);
      
      // Add bot message to chat
      addMessage(botMessage, 'bot', {
        intent: data.intent || data.json?.intent,
        confidence: data.confidence || data.json?.confidence
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage(`Error: ${error.message}`, 'bot', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Test connection button
  const testConnection = async () => {
    console.log('Testing connection to:', CHAT_API_URL);
    
    try {
      const testData = {
        text: 'Hello',
        conversationId: 'test-' + Date.now()
      };
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      console.log('Test response:', result);
      alert(`Test successful!\nResponse format:\n${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error.message}`);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={styles.container}>
      {/* Chat Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>Chat Assistant</h3>
          <span style={styles.conversationId}>ID: {conversationId.substring(0, 8)}...</span>
        </div>
        <div style={styles.headerRight}>
          <button onClick={testConnection} style={styles.testButton}>
            Test Connection
          </button>
          <button onClick={clearChat} style={styles.clearButton}>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.welcomeText}>Welcome! 👋</p>
            <p style={styles.instructionText}>Start a conversation by typing a message below.</p>
            <p style={styles.exampleText}>Try saying: "Hello" or "How much does a website cost?"</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{
                ...styles.messageBubble,
                ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble)
              }}
            >
              <div style={styles.messageHeader}>
                <strong style={styles.senderName}>
                  {msg.sender === 'user' ? 'You' : 'Assistant'}
                </strong>
                <span style={styles.timestamp}>{msg.timestamp}</span>
              </div>
              <div style={styles.messageContent}>{msg.text}</div>
              {msg.intent && (
                <div style={styles.metadata}>
                  Detected: <strong>{msg.intent}</strong>
                  {msg.confidence && ` (${Math.round(msg.confidence * 100)}% confidence)`}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          style={styles.inputField}
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            ...styles.sendButton,
            backgroundColor: (input.trim() && !loading) ? '#007bff' : '#ccc',
            cursor: (input.trim() && !loading) ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? (
            <span style={styles.loadingText}>Sending...</span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </form>

      {/* Debug Info */}
      <div style={styles.debugInfo}>
        <small>
          Endpoint: {CHAT_API_URL}<br />
          Messages: {messages.length} | Status: {loading ? 'Sending...' : 'Ready'}
        </small>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#007bff',
    color: 'white',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  conversationId: {
    fontSize: '11px',
    opacity: 0.8,
    marginTop: '3px',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  testButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  messagesArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
    minHeight: '300px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6c757d',
  },
  welcomeText: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '10px',
  },
  instructionText: {
    fontSize: '14px',
    marginBottom: '5px',
  },
  exampleText: {
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  messageBubble: {
    marginBottom: '15px',
    padding: '12px 16px',
    borderRadius: '18px',
    maxWidth: '80%',
    wordWrap: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  userBubble: {
    backgroundColor: '#007bff',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '5px',
  },
  botBubble: {
    backgroundColor: '#e9ecef',
    color: '#333',
    marginRight: 'auto',
    borderBottomLeftRadius: '5px',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
    fontSize: '12px',
    opacity: 0.9,
  },
  senderName: {
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: '11px',
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  metadata: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed rgba(0,0,0,0.1)',
    fontSize: '11px',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  inputForm: {
    display: 'flex',
    padding: '15px',
    borderTop: '1px solid #ddd',
    backgroundColor: 'white',
  },
  inputField: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '25px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputField: {
    '&:focus': {
      borderColor: '#007bff',
    },
  },
  sendButton: {
    marginLeft: '10px',
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '80px',
    transition: 'all 0.2s',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugInfo: {
    padding: '8px 15px',
    backgroundColor: '#f1f1f1',
    borderTop: '1px solid #ddd',
    fontSize: '11px',
    color: '#666',
    textAlign: 'center',
  },
};

export default ChatInterface;