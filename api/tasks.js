const axios = require('axios');

// TickTick API configuration
let accessToken = null;

// Authentication function for TickTick using API token
async function authenticateTickTick() {
  try {
    console.log('Authenticating with TickTick using API token...');
    
    // Use API token directly
    const apiToken = process.env.TICKTICK_API_TOKEN;
    
    if (!apiToken) {
      throw new Error('TickTick API token not configured');
    }
    
    accessToken = apiToken;
    console.log('TickTick API token authentication successful');
    return accessToken;
  } catch (error) {
    console.error('TickTick API token authentication failed:', error.message);
    throw error;
  }
}

// Get tasks from TickTick
async function getTasks() {
  if (!accessToken) {
    await authenticateTickTick();
  }
  
  try {
    // Use the correct endpoint for fetching tasks
    const response = await axios.get('https://ticktick.com/api/v2/task/all', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Successfully fetched tasks:', response.data.length || 0, 'tasks');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error.response?.data || error.message);
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
    
    // Check if TickTick API token is configured
    if (!process.env.TICKTICK_API_TOKEN) {
      console.error('API: TickTick API token not configured');
      return res.status(401).json({ 
        error: 'TickTick API token not configured. Please set TICKTICK_API_TOKEN in your environment variables.'
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
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'TickTick authentication failed. Please check your API token.'
      });
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