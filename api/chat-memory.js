// Vercel serverless function for chat memory management
// Replaces n8n workflow functionality

const Redis = require('ioredis');

// Initialize Redis client
let redis = null;

async function getRedisClient() {
  if (!redis) {
    try {
      // Support both Redis URL format and separate host/port
      const redisUrl = process.env.REDIS_URL;
      const redisPassword = process.env.REDIS_PASSWORD;
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      // Parse Redis URL if it's a full connection string
      const config = {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        lazyConnect: false,
        enableReadyCheck: true,
      };

      // If password is provided separately, use it
      if (redisPassword) {
        config.password = redisPassword;
      }

      redis = new Redis(redisUrl, config);

      // Handle connection errors
      redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        redis = null; // Reset connection on error
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });

      // Test connection
      await redis.ping();
      console.log('Redis ping successful');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redis = null;
      throw error;
    }
  }
  return redis;
}

// Helper function to generate embedding (simplified version)
async function generateEmbedding(text) {
  // In production, you'd call an embedding service
  // For now, return a mock embedding
  return new Array(384).fill(0).map(() => Math.random());
}

// Helper function to generate bot response
async function generateBotResponse(userMessage, conversationHistory) {
  // Simple response generation - in production you'd use an AI service
  const responses = [
    `I understand you said: "${userMessage}"`,
    `That's interesting about: "${userMessage}"`,
    `I received your message: "${userMessage}"`,
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  const messageCount = conversationHistory.filter(msg => msg.role === 'user').length;
  
  return `${randomResponse}. This is message #${messageCount + 1} in our conversation.`;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    const conversationId = body.conversationId || `conv_${Date.now()}`;
    const userMessage = body.message || '';
    const action = body.action || 'chat';

    console.log('Chat memory request:', { conversationId, action, hasMessage: !!userMessage });

    // Get Redis client
    let redisClient;
    try {
      redisClient = await getRedisClient();
    } catch (error) {
      console.error('Redis connection failed:', error);
      return res.status(503).json({ 
        error: 'Redis service unavailable',
        message: 'Please check your Redis configuration'
      });
    }

    const redisKey = `chat:${conversationId}`;

    switch (action) {
      case 'chat':
        return await handleChat(redisClient, redisKey, conversationId, userMessage, res);
      
      case 'get':
        return await handleGet(redisClient, redisKey, conversationId, res);
      
      case 'clear':
        return await handleClear(redisClient, redisKey, conversationId, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action. Must be "chat", "get", or "clear"' });
    }
  } catch (error) {
    console.error('Chat memory error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

async function handleChat(redisClient, redisKey, conversationId, userMessage, res) {
  // Validate input
  if (!userMessage || userMessage.trim() === '') {
    return res.status(400).json({ 
      error: 'Message is required for chat action',
      conversationId 
    });
  }

  // Get existing conversation history
  let existingHistory = [];
  try {
    const stored = await redisClient.get(redisKey);
    if (stored) {
      existingHistory = JSON.parse(stored);
      console.log(`Retrieved ${existingHistory.length} messages from Redis for key: ${redisKey}`);
    } else {
      console.log(`No existing history found for key: ${redisKey}, starting fresh`);
    }
  } catch (error) {
    console.error('Error retrieving history from Redis:', error);
    // Continue with empty history
    existingHistory = [];
  }

  // Add new user message
  const newUserMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  };

  const newHistory = [...existingHistory, newUserMessage];

  // Generate bot response
  const botResponse = {
    role: 'assistant',
    content: await generateBotResponse(userMessage, existingHistory),
    timestamp: new Date().toISOString()
  };

  newHistory.push(botResponse);

  // Keep only last 20 messages (10 conversation turns)
  let finalHistory = newHistory;
  if (newHistory.length > 20) {
    console.log(`Trimming history from ${newHistory.length} to 20 messages`);
    finalHistory = newHistory.slice(-20);
  }

  // Store updated history in Redis
  try {
    const historyString = JSON.stringify(finalHistory);
    await redisClient.setex(redisKey, 86400, historyString); // 24 hours TTL
    console.log(`Successfully saved ${finalHistory.length} messages to Redis key: ${redisKey}`);
  } catch (error) {
    console.error('Error saving to Redis:', error);
    // Still return response even if save fails
    return res.status(200).json({
      conversationId,
      message: botResponse.content,
      historyCount: finalHistory.filter(msg => msg.role === 'user').length,
      timestamp: new Date().toISOString(),
      warning: 'Chat response generated but history may not have been saved'
    });
  }

  return res.status(200).json({
    conversationId,
    message: botResponse.content,
    historyCount: finalHistory.filter(msg => msg.role === 'user').length,
    timestamp: new Date().toISOString()
  });
}

async function handleGet(redisClient, redisKey, conversationId, res) {
  let history = [];
  let message = 'No history found';

  try {
    const stored = await redisClient.get(redisKey);
    if (stored) {
      history = JSON.parse(stored);
      const userMessages = history.filter(msg => msg.role === 'user').length;
      message = `Retrieved ${userMessages} conversation turns`;
    }
  } catch (error) {
    message = 'Error retrieving history';
  }

  return res.status(200).json({
    conversationId,
    action: 'get',
    message,
    history,
    historyCount: history.filter(msg => msg.role === 'user').length,
    timestamp: new Date().toISOString()
  });
}

async function handleClear(redisClient, redisKey, conversationId, res) {
  try {
    await redisClient.del(redisKey);
    return res.status(200).json({
      conversationId,
      action: 'clear',
      message: 'Chat history cleared successfully',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      conversationId,
      action: 'clear',
      message: 'Error clearing chat history',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
}
