import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Bot, User, Trash2 } from 'lucide-react';

export default function ChatInterface({ initialConversationId, onFeedback }) {
  // Store conversation ID in state and localStorage
  const [conversationId, setConversationId] = useState(() => {
    return initialConversationId || localStorage.getItem('chatConversationId') || `conv_${Date.now()}`;
  });
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 'http://localhost:5678';
  const WEBHOOK_URL = `${N8N_BASE_URL}/webhook/chat-memory`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save conversation ID when it changes
  useEffect(() => {
    localStorage.setItem('chatConversationId', conversationId);
  }, [conversationId]);

  // Load existing conversation history when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            conversationId: conversationId,
            action: 'get'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Loaded history:', data);
          
          if (data.history && data.history.length > 0) {
            // Convert Redis history format to your message format
            const loadedMessages = data.history.map((msg, index) => ({
              id: Date.now() - index,
              type: msg.role === 'user' ? 'user' : 'bot',
              text: msg.content,
              timestamp: new Date(msg.timestamp),
              metadata: {
                historyCount: data.historyCount
              }
            }));
            setMessages(loadedMessages);
          } else if (messages.length === 0) {
            // Show welcome message only if no messages loaded
            setMessages([{
              id: 1,
              type: 'bot',
              text: 'Hello! How can I help you with our software development services?',
              timestamp: new Date(),
              metadata: {
                historyCount: 0
              }
            }]);
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
        // Show welcome message on error
        if (messages.length === 0) {
          setMessages([{
            id: 1,
            type: 'bot',
            text: 'Hello! How can I help you with our software development services?',
            timestamp: new Date(),
            metadata: {
              historyCount: 0
            }
          }]);
        }
      }
    };

    loadHistory();
  }, [conversationId]);

  const clearHistory = async () => {
    try {
      // Call n8n workflow to clear Redis memory
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId: conversationId,
          action: 'clear'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear memory');
      }
      
      // Clear local messages and show welcome message
      setMessages([{
        id: 1,
        type: 'bot',
        text: 'Hello! How can I help you with our software development services?',
        timestamp: new Date(),
        metadata: {
          historyCount: 0
        }
      }]);
      
      // Generate new conversation ID
      const newConvId = `conv_${Date.now()}`;
      setConversationId(newConvId);
      localStorage.setItem('chatConversationId', newConvId);
      
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending message:', input);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversationId: conversationId,
          message: input,
          action: 'chat'
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Handle response from Redis-based workflow
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.message || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: {
          historyCount: data.historyCount || 0,
          conversationId: data.conversationId,
          messageNumber: data.historyCount
        }
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFeedbackClick = (messageId, isPositive) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
    const message = messages.find(m => m.id === messageId);
    if (message && onFeedback) {
      onFeedback(message, isPositive ? 'positive' : 'negative');
    }
  };

  const renderMessageContent = (message) => {
    const metadata = message.metadata || {};
    const responseType = metadata.responseType || 'answer';

    // Escalation message
    if (responseType === 'escalation') {
      return (
        <div>
          <div className="flex items-center gap-2 text-orange-600 mb-2 text-sm font-bold">
            ⚠️ Escalation Suggested
          </div>
          <p className="whitespace-pre-wrap mb-3">{message.text}</p>
          {metadata.options && metadata.options.length > 0 && (
            <div className="flex flex-col gap-2">
              {metadata.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (option.action === 'navigate' && option.destination === 'book') {
                      window.open('https://calendly.com/your-link', '_blank');
                    } else if (option.action === 'mailto') {
                      window.location.href = `mailto:${option.destination}`;
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{
                    backgroundColor: option.id === 'book' ? '#007bff' : option.id === 'email' ? '#28a745' : '#6c757d'
                  }}
                >
                  {option.id === 'book' && '📅 '}
                  {option.id === 'email' && '✉️ '}
                  {option.id === 'continue' && '💬 '}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Guardrail message
    if (responseType === 'guardrail') {
      return (
        <div>
          <div className="flex items-center gap-2 text-red-600 mb-2 text-sm font-bold">
            🚫 Off-Topic Detected
          </div>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      );
    }

    // Clarification message
    if (responseType === 'clarification') {
      return <p className="whitespace-pre-wrap">{message.text}</p>;
    }

    // Greeting message
    if (responseType === 'greeting') {
      return (
        <div>
          <p className="whitespace-pre-wrap">{message.text}</p>
          {metadata.intent && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 italic">
              Intent: {metadata.intent}
              {metadata.confidence && ` (${(metadata.confidence * 100).toFixed(0)}% confidence)`}
            </div>
          )}
        </div>
      );
    }

    // Normal answer with sources
    return (
      <div>
        <p className="whitespace-pre-wrap mb-2">{message.text}</p>
        {metadata.sources && metadata.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">📚 Sources Used:</div>
            {metadata.sources.slice(0, 3).map((source, i) => (
              <div key={i} className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-1">
                {source.topic} • {source.page} • {(parseFloat(source.score) * 100).toFixed(0)}% confidence
              </div>
            ))}
          </div>
        )}
        {metadata.intent && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            <div>Intent: {metadata.intent}</div>
            {metadata.confidence && (
              <div>Confidence: {(metadata.confidence * 100).toFixed(0)}%</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AI Assistant</h1>
            <p className="text-sm text-gray-500">
              Conversation: <span className="font-mono text-xs">{conversationId}</span>
            </p>
          </div>
        </div>
        
        {/* Clear History Button */}
        <button
          onClick={clearHistory}
          className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
          title="Start new conversation"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-sm">Loading conversation...</div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' ? 'bg-indigo-500' : 'bg-gray-300'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-gray-700" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col max-w-xl ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  {renderMessageContent(message)}
                </div>

                {/* Timestamp and Feedback */}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.metadata?.messageNumber && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        #{message.metadata.messageNumber}
                      </span>
                    )}
                  </span>
                  
                  {message.type === 'bot' && !message.isError && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleFeedbackClick(message.id, true)}
                        className="hover:text-green-600 transition-colors"
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedbackClick(message.id, false)}
                        className="hover:text-red-600 transition-colors"
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-gray-700" />
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 bg-white border-t border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {['What are your prices?', 'What services do you offer?', 'How long does a project take?', 'Tell me about your experience'].map((topic) => (
            <button
              key={topic}
              onClick={() => setInput(topic)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap transition-colors"
            >
              💡 {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


