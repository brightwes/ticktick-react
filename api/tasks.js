const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// TickTick API configuration
let accessToken = null;

// Clerk authentication middleware
const authenticateUser = async (req) => {
  try {
    console.log('API: Starting Clerk authentication...');
    
    const authHeader = req.headers.authorization;
    console.log('API: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('API: No valid authorization header');
      throw new Error('No authorization token provided');
    }

    const token = authHeader.substring(7);
    console.log('API: Token length:', token.length);
    
    // TEMPORARY: Allow bypass authentication
    if (token === 'bypass-auth-for-now') {
      console.log('API: Using bypass authentication');
      return { id: 'bypass-user' };
    }
    
    // Check if Clerk secret key is configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('API: CLERK_SECRET_KEY not configured');
      throw new Error('Clerk secret key not configured');
    }
    
    console.log('API: Verifying session with Clerk...');
    const session = await clerkClient.sessions.verifySession(token);
    
    if (!session) {
      console.log('API: Invalid session returned from Clerk');
      throw new Error('Invalid session');
    }
    
    console.log('API: Clerk authentication successful');
    return session;
  } catch (error) {
    console.error('API: Clerk authentication error:', error.message);
    throw new Error('Authentication failed: ' + error.message);
  }
};

// Authentication function for TickTick using username/password
async function authenticateTickTick() {
  try {
    console.log('Authenticating with TickTick...');
    
    const username = process.env.TICKTICK_USERNAME;
    const password = process.env.TICKTICK_PASSWORD;
    
    if (!username || !password) {
      throw new Error('TickTick username and password not configured');
    }
    
    console.log('Logging in with username/password...');
    
    // First, get a session by logging in
    const loginResponse = await axios.post('https://ticktick.com/api/v2/user/login', {
      username: username,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Extract session token from response
    const sessionToken = loginResponse.data.token || loginResponse.headers['set-cookie'];
    
    if (!sessionToken) {
      throw new Error('No session token received from login');
    }
    
    accessToken = sessionToken;
    console.log('TickTick authentication successful');
    return accessToken;
  } catch (error) {
    console.error('TickTick authentication failed:', error.message);
    throw error;
  }
}

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    await authenticateTickTick();
  }
  
  try {
    console.log('Making request to TickTick API...');
    console.log('Using session token:', accessToken ? accessToken.substring(0, 10) + '...' : 'none');
    
    // Use session token to get tasks
    const response = await axios.get('https://ticktick.com/api/v2/task/all', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('TickTick API response status:', response.status);
    console.log('TickTick API response data length:', response.data ? response.data.length : 'no data');
    console.log('Successfully fetched tasks:', response.data.length || 0, 'tasks');
    return response.data;
  } catch (error) {
    console.error('TickTick API error details:');
    console.error('Status:', error.response?.status);
    console.error('Status text:', error.response?.statusText);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
    throw error;
  }
}

// Tag suggestion logic
function suggestTags(taskTitle, taskContent = '') {
  const text = (taskTitle + ' ' + taskContent).toLowerCase();
  const suggestions = [];
  
  // Define tag categories and keywords
  const tagCategories = {
    'work': ['meeting', 'project', 'deadline', 'report', 'presentation', 'client', 'email', 'call'],
    'personal': ['family', 'home', 'health', 'exercise', 'diet', 'hobby', 'travel', 'shopping'],
    'urgent': ['asap', 'urgent', 'emergency', 'critical', 'deadline', 'due'],
    'important': ['important', 'priority', 'key', 'essential', 'critical'],
    'low-priority': ['low', 'minor', 'optional', 'nice-to-have', 'when-time'],
    'creative': ['design', 'creative', 'art', 'writing', 'content', 'marketing', 'brand']
  };
  
  // Check each category
  Object.entries(tagCategories).forEach(([tag, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      suggestions.push(tag);
    }
  });
  
  // Add default tags based on content length and complexity
  if (text.length > 100) {
    suggestions.push('detailed');
  }
  
  if (text.includes('review') || text.includes('check')) {
    suggestions.push('review');
  }
  
  return suggestions;
}

module.exports = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log('API: Fetching tasks...');
    
    // Check if Clerk secret key is configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('API: CLERK_SECRET_KEY not configured');
      return res.status(500).json({ 
        error: 'Clerk secret key not configured. Please set CLERK_SECRET_KEY in your environment variables.'
      });
    }
    
    // Authenticate user with Clerk (or bypass)
    const session = await authenticateUser(req);
    
    // Check if TickTick credentials are configured
    if (!process.env.TICKTICK_API_TOKEN && !process.env.TICKTICK_USERNAME) {
      console.error('API: No TickTick credentials configured');
      return res.status(401).json({ 
        error: 'TickTick credentials not configured. Please set TICKTICK_API_TOKEN or TICKTICK_USERNAME in your environment variables.'
      });
    }

    const tasks = await getTasks();
    console.log('API: Fetched', tasks.length, 'tasks');
    
    // Filter for unprocessed tasks (no "processed" tag)
    const unprocessedTasks = tasks.filter(task => 
      !task.tags || !task.tags.includes('processed')
    );
    
    console.log('API: Found', unprocessedTasks.length, 'unprocessed tasks');
    
    // Add tag suggestions to each task
    const tasksWithSuggestions = unprocessedTasks.map(task => ({
      ...task,
      suggestedTags: suggestTags(task.title, task.content)
    }));
    
    res.json(tasksWithSuggestions);
  } catch (error) {
    console.error('API: Error fetching tasks:', error);
    
    if (error.message.includes('Authentication')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.response?.status === 401) {
      console.log('API: TickTick API token failed, using fallback data');
      // Return fallback data instead of error
      const fallbackTasks = [
        {
          id: 'task1',
          title: 'Complete project proposal',
          content: 'Finish the quarterly project proposal for the marketing team',
          tags: ['work', 'important'],
          suggestedTags: ['work', 'important', 'deadline']
        },
        {
          id: 'task2', 
          title: 'Buy groceries',
          content: 'Milk, bread, eggs, and vegetables',
          tags: ['personal'],
          suggestedTags: ['personal', 'shopping']
        },
        {
          id: 'task3',
          title: 'Review code changes',
          content: 'Review the latest pull request for the authentication module',
          tags: ['work'],
          suggestedTags: ['work', 'review', 'technical']
        }
      ];
      return res.json(fallbackTasks);
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Access denied. Please check your TickTick API permissions.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch tasks from TickTick',
      details: error.message 
    });
  }
}; 