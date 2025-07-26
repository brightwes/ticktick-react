const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

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

async function updateTask(taskId, tags) {
  if (!accessToken) {
    await authenticateTickTick();
  }

  try {
    // Add "processed" tag to mark this task as completed
    const tagsWithProcessed = [...tags, 'processed'];
    
    console.log('Updating task', taskId, 'with tags:', tagsWithProcessed);
    
    const response = await axios.put(`https://ticktick.com/api/v2/task/${taskId}`, {
      tags: tagsWithProcessed
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Successfully updated task:', taskId);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log('API: Updating task...');
    
    // Authenticate user with Clerk
    const session = await authenticateUser(req);
    
    const { taskId } = req.query;
    const { tags } = req.body;

    if (!taskId || !tags) {
      return res.status(400).json({ error: 'Missing taskId or tags' });
    }

    if (!process.env.TICKTICK_API_TOKEN) {
      return res.status(401).json({ 
        error: 'TickTick API token not configured. Please set TICKTICK_API_TOKEN in your environment variables.'
      });
    }

    const updatedTask = await updateTask(taskId, tags);
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('API: Error updating task:', error);
    
    if (error.message.includes('Authentication')) {
      return res.status(401).json({ error: error.message });
    }
    
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
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Task not found. The task may have been deleted or moved.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message 
    });
  }
}; 