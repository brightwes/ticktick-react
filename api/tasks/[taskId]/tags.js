const axios = require('axios');
const { clerkClient } = require('@clerk/clerk-sdk-node');

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

// Authentication function for TickTick using direct login
async function authenticateTickTick() {
  try {
    console.log('Authenticating with TickTick using direct login...');
    
    // Use direct login instead of OAuth2
    const loginResponse = await axios.post('https://ticktick.com/api/v2/user/login', {
      username: process.env.TICKTICK_USERNAME,
      password: process.env.TICKTICK_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      accessToken = loginResponse.data.token;
      console.log('TickTick direct authentication successful');
      return accessToken;
    } else {
      throw new Error('No access token received from TickTick');
    }
  } catch (error) {
    console.error('TickTick direct authentication failed:', error.response?.data || error.message);
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
    
    const response = await axios.put(`https://ticktick.com/api/v2/task/${taskId}`, {
      tags: tagsWithProcessed
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating task:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user with Clerk
    const session = await authenticateUser(req);
    
    const { taskId } = req.query;
    const { tags } = req.body;

    if (!taskId || !tags) {
      return res.status(400).json({ error: 'Missing taskId or tags' });
    }

    const updatedTask = await updateTask(taskId, tags);
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.message.includes('Authentication')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update task' });
  }
}; 