const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// TickTick API configuration
const TICKTICK_API_BASE = 'https://api.ticktick.com/api/v2';
let accessToken = null;

// Clerk authentication middleware
const authenticateUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    const token = authHeader.substring(7);
    const session = await clerkClient.sessions.verifySession(token);
    
    if (!session) {
      throw new Error('Invalid session');
    }

    return session;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
};

// Authentication function for TickTick
async function authenticateTickTick() {
  try {
    const response = await axios.post(`${TICKTICK_API_BASE}/oauth/token`, {
      client_id: process.env.TICKTICK_CLIENT_ID,
      client_secret: process.env.TICKTICK_CLIENT_SECRET,
      grant_type: 'password',
      username: process.env.TICKTICK_USERNAME,
      password: process.env.TICKTICK_PASSWORD
    });
    
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    await authenticateTickTick();
  }
  
  try {
    const response = await axios.get(`${TICKTICK_API_BASE}/task/all`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error.message);
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user with Clerk
    const session = await authenticateUser(req);
    
    // Check if TickTick credentials are configured
    if (!process.env.TICKTICK_CLIENT_ID || !process.env.TICKTICK_CLIENT_SECRET) {
      return res.status(401).json({ 
        error: 'TickTick credentials not configured'
      });
    }

    const tasks = await getTasks();
    // Filter for unprocessed tasks (no "processed" tag)
    const unprocessedTasks = tasks.filter(task => 
      !task.tags || !task.tags.includes('processed')
    );
    
    // Add tag suggestions to each task
    const tasksWithSuggestions = unprocessedTasks.map(task => ({
      ...task,
      suggestedTags: suggestTags(task.title, task.content)
    }));
    
    res.json(tasksWithSuggestions);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    
    if (error.message.includes('Authentication')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}; 