module.exports = (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const hasApiToken = !!process.env.TICKTICK_API_TOKEN;
    const tokenLength = hasApiToken ? process.env.TICKTICK_API_TOKEN.length : 0;
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: {
        hasApiToken,
        tokenLength,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      message: hasApiToken 
        ? 'TickTick API token is configured' 
        : 'TickTick API token is NOT configured'
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ 
      error: 'Test API failed',
      details: error.message 
    });
  }
}; 