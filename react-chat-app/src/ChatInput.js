import React, { useState, useEffect, useRef } from 'react';

function ChatInput({ onSendMessage, setLoading, isDrawerOpen, conversationId, WEBHOOK_URL }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // Local n8n backend URL for development (fallback)
  const LOCAL_N8N_URL = 'http://localhost:5678';
  
  // Railway n8n backend URL (set in Vercel environment variables)
  // Support multiple variable names for flexibility
  const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 
                       process.env.NEXT_PUBLIC_N8N_BASE_URL ||
                       process.env.REACT_APP_N8N_WEBHOOK_URL?.replace('/webhook/answer', '').replace('/webhook/chat-memory', '') ||
                       process.env.REACT_APP_API_BASE_URL?.replace('/api', '');
  
  // Priority: 1. Local n8n, 2. Environment variables, 3. Production Railway, 4. Vercel API
  let CHAT_API_URL;
  
  if (WEBHOOK_URL) {
    CHAT_API_URL = WEBHOOK_URL;
  } else if (N8N_BASE_URL && !N8N_BASE_URL.includes('localhost')) {
    // Production Railway uses /webhook/answer path
    CHAT_API_URL = `${N8N_BASE_URL}/webhook/answer`;
  } else if (N8N_BASE_URL && N8N_BASE_URL.includes('localhost')) {
    CHAT_API_URL = `${N8N_BASE_URL}/webhook/answer`;
  } else {
    CHAT_API_URL = `${LOCAL_N8N_URL}/webhook/answer`;
  }

  useEffect(() => {
    if (isDrawerOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDrawerOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    onSendMessage(userMessage, 'user');
    setInput('');
    setLoading(true);

    try {
      console.log('Sending message:', userMessage);
      console.log('Using API URL:', CHAT_API_URL);
      console.log('Environment variables:', {
        REACT_APP_N8N_BASE_URL: process.env.REACT_APP_N8N_BASE_URL,
        NEXT_PUBLIC_N8N_BASE_URL: process.env.NEXT_PUBLIC_N8N_BASE_URL,
        REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL
      });

      // n8n expects: { text, conversationId } format
      const requestBody = { 
        text: userMessage, 
        conversationId: conversationId || 'default-' + Date.now() 
      };

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Chat API response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full n8n response:', data);

      // Extract bot message from n8n response
      let botMessage = 'I received your message but could not parse the response.';
      
      // Try different n8n response formats:
      
      // Format 1: Direct message field
      if (data.message) {
        botMessage = data.message;
      }
      // Format 2: response_message field
      else if (data.response_message) {
        botMessage = data.response_message;
      }
      // Format 3: Nested in json property (common in n8n)
      else if (data.json && data.json.response_message) {
        botMessage = data.json.response_message;
      }
      // Format 4: Nested in json with message field
      else if (data.json && data.json.message) {
        botMessage = data.json.message;
      }
      // Format 5: Array response from n8n
      else if (Array.isArray(data) && data[0] && data[0].json) {
        if (data[0].json.response_message) {
          botMessage = data[0].json.response_message;
        } else if (data[0].json.message) {
          botMessage = data[0].json.message;
        }
      }
      // Format 6: Text field
      else if (data.text) {
        botMessage = data.text;
      }
      // Format 7: Answer field
      else if (data.answer) {
        botMessage = data.answer;
      }
      // Format 8: Type-based format
      else if (data.type === 'direct_response' && data.text) {
        botMessage = data.text;
      }
      else if (data.type === 'direct_response' && data.message) {
        botMessage = data.message;
      }
      // Format 9: If nothing else works, stringify for debugging
      else {
        console.warn('Unknown n8n response format, showing raw data:', data);
        botMessage = `Response: ${JSON.stringify(data).substring(0, 150)}...`;
      }

      console.log('Extracted bot message:', botMessage);
      
      const historyCount = data.historyCount || 0;
      
      onSendMessage(botMessage, 'bot', {
        type: 'chat',
        historyCount: historyCount,
        intent: data.intent || data.json?.intent,
        confidence: data.confidence || data.json?.confidence
      });
    } catch (error) {
      console.error('Error:', error);
      onSendMessage('Sorry, I encountered an error. Please try again.', 'bot', {
        type: 'error',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug function to test n8n connection
  const testN8nConnection = async () => {
    console.log('=== Testing n8n Connection ===');
    console.log('API URL:', CHAT_API_URL);
    
    try {
      const testData = {
        text: "Hello",
        conversationId: conversationId || 'test-' + Date.now()
      };
      
      console.log('Sending test data:', testData);
      
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Full n8n response:', result);
      
      // Show in alert for debugging
      alert(`n8n Test Successful!\n\nURL: ${CHAT_API_URL}\n\nResponse Format:\n${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      alert(`n8n Test Failed!\n\nURL: ${CHAT_API_URL}\n\nError: ${error.message}`);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ padding: '15px', borderTop: '1px solid #ddd', display: 'flex' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#007bff'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            marginLeft: '12px',
            padding: '12px 24px',
            backgroundColor: input.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '700',
            transition: 'all 0.2s',
            boxShadow: input.trim() ? '0 2px 4px rgba(0,123,255,0.3)' : 'none'
          }}
        >
          Send
        </button>
      </form>
      
      {/* Debug button - can be removed after everything works */}
      <button 
        onClick={testN8nConnection}
        style={{
          position: 'fixed',
          bottom: '60px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 1000
        }}
      >
        Test n8n
      </button>
    </>
  );
}

export default ChatInput;