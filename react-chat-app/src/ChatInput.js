import React, { useState, useEffect, useRef } from 'react';

// Complete chat interface component
function ChatInterface({ isDrawerOpen = true }) {
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}`);
  
  // Refs
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Your PRODUCTION Railway n8n URL - only this one
  const N8N_PRODUCTION_URL = 'https://n8n-main-instance-production-0ed4.up.railway.app';
  const CHAT_API_URL = `${N8N_PRODUCTION_URL}/webhook/answer`;

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
    if (!data) return 'No response received from n8n';
    
    console.log('Parsing n8n response:', data);
    
    // Try different response formats in order (most common first)
    
    // Format 1: Direct response with message field
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    
    // Format 2: response_message field (common in your workflow)
    if (data.response_message && typeof data.response_message === 'string') {
      return data.response_message;
    }
    
    // Format 3: Nested in json property (n8n standard)
    if (data.json) {
      if (data.json.response_message && typeof data.json.response_message === 'string') {
        return data.json.response_message;
      }
      if (data.json.message && typeof data.json.message === 'string') {
        return data.json.message;
      }
    }
    
    // Format 4: text field
    if (data.text && typeof data.text === 'string') {
      return data.text;
    }
    
    // Format 5: Array response (n8n multi-output)
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
    
    // Format 6: Direct response with type field
    if (data.type === 'direct_response') {
      if (data.message) return data.message;
      if (data.text) return data.text;
    }
    
    // If nothing matches, show formatted response
    const responseStr = JSON.stringify(data, null, 2);
    if (responseStr.length < 200) {
      return `Response: ${responseStr}`;
    }
    
    return 'Received response but could not extract message. Check console for details.';
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
      console.log('=== Sending to n8n ===');
      console.log('URL:', CHAT_API_URL);
      
      const requestBody = { 
        text: userMessage, 
        conversationId: conversationId
      };

      console.log('Request body:', requestBody);

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n error ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log('=== n8n Response Data ===');
      console.log('Full response:', data);
      console.log('Response type:', typeof data);
      console.log('Is array?', Array.isArray(data));

      // Extract bot message
      const botMessage = extractMessage(data);
      
      console.log('Extracted message:', botMessage);
      
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

  // Test connection to n8n
  const testConnection = async () => {
    console.log('=== Testing n8n Connection ===');
    console.log('URL:', CHAT_API_URL);
    
    try {
      const testData = {
        text: 'Hello',
        conversationId: 'test-' + Date.now()
      };
      
      console.log('Test request:', testData);
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      console.log('Test response status:', response.status);
      const result = await response.json();
      console.log('Test response data:', result);
      
      // Show detailed alert
      const responseFormat = `Response Format Analysis:\n\n` +
        `1. Raw response: ${JSON.stringify(result, null, 2)}\n\n` +
        `2. Type: ${typeof result}\n` +
        `3. Is Array: ${Array.isArray(result)}\n` +
        `4. Keys: ${Object.keys(result).join(', ')}\n\n` +
        `5. Extracted message: "${extractMessage(result)}"`;
      
      alert(`✅ n8n Connection Test Successful!\n\n` +
            `URL: ${CHAT_API_URL}\n\n` +
            `${responseFormat}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      alert(`❌ n8n Connection Test Failed!\n\n` +
            `URL: ${CHAT_API_URL}\n\n` +
            `Error: ${error.message}\n\n` +
            `Check browser console for details.`);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  // Render chat interface
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>🤖 n8n Chat Assistant</h3>
          <div style={styles.urlInfo}>
            <small>Connected to: {N8N_PRODUCTION_URL}</small>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={testConnection} style={styles.testButton}>
            🔗 Test
          </button>
          <button onClick={clearChat} style={styles.clearButton}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.welcomeIcon}>💬</div>
            <p style={styles.welcomeText}>Start chatting with n8n</p>
            <p style={styles.instructionText}>Your messages will be processed by the n8n workflow</p>
            <p style={styles.exampleText}>Try: "Hello" or "What services do you offer?"</p>
            <button 
              onClick={testConnection}
              style={styles.testExampleButton}
            >
              Click here to test the connection
            </button>
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
                <div style={styles.senderInfo}>
                  <span style={styles.senderIcon}>
                    {msg.sender === 'user' ? '👤' : '🤖'}
                  </span>
                  <strong style={styles.senderName}>
                    {msg.sender === 'user' ? 'You' : 'n8n Assistant'}
                  </strong>
                </div>
                <span style={styles.timestamp}>{msg.timestamp}</span>
              </div>
              <div style={styles.messageContent}>{msg.text}</div>
              {msg.intent && (
                <div style={styles.metadata}>
                  <span style={styles.metadataLabel}>Intent:</span>
                  <strong style={styles.intentText}> {msg.intent}</strong>
                  {msg.confidence && (
                    <span style={styles.confidenceText}>
                      {' '}({Math.round(msg.confidence * 100)}% confidence)
                    </span>
                  )}
                </div>
              )}
              {msg.type === 'error' && (
                <div style={styles.errorMetadata}>
                  ⚠️ Error response
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
          placeholder="Type your message to n8n workflow..."
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
            <span style={styles.loadingText}>
              <span style={styles.spinner}>⏳</span> Sending...
            </span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </form>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusDot}></span>
          <small>
            Connected to: <strong>{N8N_PRODUCTION_URL}</strong>
          </small>
        </div>
        <div style={styles.statusRight}>
          <small>
            Messages: <strong>{messages.length}</strong> | 
            Status: <strong>{loading ? 'Processing...' : 'Ready'}</strong>
          </small>
        </div>
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
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    backgroundColor: '#007bff',
    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    color: 'white',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  urlInfo: {
    fontSize: '11px',
    opacity: 0.9,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '2px 6px',
    borderRadius: '3px',
    display: 'inline-block',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  testButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
  },
  messagesArea: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
    minHeight: '400px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d',
  },
  welcomeIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  welcomeText: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#343a40',
  },
  instructionText: {
    fontSize: '14px',
    marginBottom: '8px',
    color: '#6c757d',
  },
  exampleText: {
    fontSize: '13px',
    color: '#adb5bd',
    fontStyle: 'italic',
    marginBottom: '24px',
  },
  testExampleButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  messageBubble: {
    marginBottom: '16px',
    padding: '16px 20px',
    borderRadius: '18px',
    maxWidth: '85%',
    wordWrap: 'break-word',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    animation: 'fadeIn 0.3s ease-out',
  },
  userBubble: {
    backgroundColor: '#007bff',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '5px',
  },
  botBubble: {
    backgroundColor: 'white',
    color: '#343a40',
    marginRight: 'auto',
    borderBottomLeftRadius: '5px',
    border: '1px solid #e9ecef',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px',
    opacity: 0.9,
  },
  senderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  senderIcon: {
    fontSize: '14px',
  },
  senderName: {
    textTransform: 'capitalize',
    fontSize: '13px',
  },
  timestamp: {
    fontSize: '11px',
    opacity: 0.7,
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '8px',
  },
  metadata: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed rgba(0,0,0,0.1)',
    fontSize: '12px',
    color: '#6c757d',
  },
  metadataLabel: {
    opacity: 0.7,
  },
  intentText: {
    color: '#28a745',
  },
  confidenceText: {
    color: '#6c757d',
    fontSize: '11px',
  },
  errorMetadata: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed #dc3545',
    fontSize: '12px',
    color: '#dc3545',
  },
  inputForm: {
    display: 'flex',
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    backgroundColor: 'white',
  },
  inputField: {
    flex: 1,
    padding: '14px 18px',
    border: '2px solid #e0e0e0',
    borderRadius: '25px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  inputFieldFocus: {
    borderColor: '#007bff',
    boxShadow: '0 0 0 3px rgba(0,123,255,0.1)',
  },
  sendButton: {
    marginLeft: '12px',
    padding: '14px 28px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '90px',
    transition: 'all 0.2s',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef',
    fontSize: '12px',
    color: '#6c757d',
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#28a745',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  statusRight: {
    display: 'flex',
    gap: '15px',
  },
  '@global': {
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  },
};

export default ChatInterface;