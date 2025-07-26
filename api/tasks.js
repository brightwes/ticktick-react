const axios = require('axios');

// Mock data for testing
const mockTasks = [
  {
    id: '1',
    title: 'Review quarterly reports',
    content: 'Need to review and approve all Q4 reports before the deadline',
    dueDate: '2024-01-15',
    projectName: 'Finance',
    priority: 'High',
    tags: [],
    suggestedTags: ['work', 'important', 'review', 'deadline']
  },
  {
    id: '2',
    title: 'Call mom',
    content: 'Check in with mom about weekend plans',
    dueDate: '2024-01-10',
    projectName: 'Personal',
    priority: 'Normal',
    tags: [],
    suggestedTags: ['personal', 'family']
  },
  {
    id: '3',
    title: 'Design new landing page',
    content: 'Create wireframes and mockups for the new product landing page',
    dueDate: '2024-01-20',
    projectName: 'Marketing',
    priority: 'High',
    tags: [],
    suggestedTags: ['work', 'creative', 'design', 'project']
  },
  {
    id: '4',
    title: 'Grocery shopping',
    content: 'Buy ingredients for dinner this week',
    dueDate: '2024-01-08',
    projectName: 'Personal',
    priority: 'Normal',
    tags: [],
    suggestedTags: ['personal', 'shopping']
  },
  {
    id: '5',
    title: 'Emergency client meeting',
    content: 'Urgent meeting with client about project delays',
    dueDate: '2024-01-09',
    projectName: 'Client Relations',
    priority: 'High',
    tags: [],
    suggestedTags: ['work', 'urgent', 'meeting', 'client']
  }
];

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
      console.log('API: Using mock data (no API token configured)');
      // Return mock data for testing
      const tasksWithSuggestions = mockTasks.map(task => ({
        ...task,
        suggestedTags: suggestTags(task.title, task.content)
      }));
      return res.json(tasksWithSuggestions);
    }

    try {
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
    } catch (ticktickError) {
      console.error('API: TickTick API failed, using mock data:', ticktickError.message);
      // Fallback to mock data if TickTick API fails
      const tasksWithSuggestions = mockTasks.map(task => ({
        ...task,
        suggestedTags: suggestTags(task.title, task.content)
      }));
      res.json(tasksWithSuggestions);
    }
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