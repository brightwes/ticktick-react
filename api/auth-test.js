const { clerkClient } = require('@clerk/clerk-sdk-node');

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log('Auth Test: Starting...');
    
    // Check environment variables
    const hasClerkSecret = !!process.env.CLERK_SECRET_KEY;
    const hasClerkPublishable = !!process.env.VITE_CLERK_PUBLISHABLE_KEY;
    
    console.log('Auth Test: Environment check:', { hasClerkSecret, hasClerkPublishable });
    
    if (!hasClerkSecret) {
      return res.status(500).json({ 
        error: 'CLERK_SECRET_KEY not configured',
        hasClerkSecret,
        hasClerkPublishable
      });
    }

    // Check if authorization header is present
    const authHeader = req.headers.authorization;
    console.log('Auth Test: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No authorization header',
        hasClerkSecret,
        hasClerkPublishable,
        authHeaderPresent: !!authHeader
      });
    }

    const token = authHeader.substring(7);
    console.log('Auth Test: Token length:', token.length);
    
    try {
      console.log('Auth Test: Verifying session...');
      const session = await clerkClient.sessions.verifySession(token);
      
      if (!session) {
        console.log('Auth Test: Invalid session');
        return res.status(401).json({ 
          error: 'Invalid session',
          hasClerkSecret,
          hasClerkPublishable,
          tokenLength: token.length
        });
      }
      
      console.log('Auth Test: Session verified successfully');
      return res.json({ 
        success: true, 
        message: 'Authentication successful',
        hasClerkSecret,
        hasClerkPublishable,
        sessionId: session.id
      });
      
    } catch (clerkError) {
      console.error('Auth Test: Clerk error:', clerkError.message);
      return res.status(401).json({ 
        error: 'Clerk verification failed',
        clerkError: clerkError.message,
        hasClerkSecret,
        hasClerkPublishable,
        tokenLength: token.length
      });
    }
    
  } catch (error) {
    console.error('Auth Test: Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error',
      details: error.message
    });
  }
}; 