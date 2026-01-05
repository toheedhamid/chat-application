// Vercel serverless function for status endpoint
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return status information
    return res.status(200).json({
      status: 'healthy',
      lastUpdate: new Date().toISOString(),
      version: '1.0.0',
      service: 'Vercel Chat API'
    });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
