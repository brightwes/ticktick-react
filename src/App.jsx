import { useState, useEffect } from 'react'
import { ClerkProvider, SignIn, SignUp, useUser, useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import './App.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_your_clerk_publishable_key_here'

function TaskTagger() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [tasks, setTasks] = useState([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [processedTasks, setProcessedTasks] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTasks = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const token = await getToken()
      const response = await axios.get('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setTasks(response.data)
      setCurrentTaskIndex(0)
      setProcessedTasks(0)
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('Failed to load tasks. Please check your TickTick configuration.')
    } finally {
      setLoading(false)
    }
  }

  const saveTask = async (selectedTags) => {
    if (!user || currentTaskIndex >= tasks.length) return
    
    try {
      const token = await getToken()
      const currentTask = tasks[currentTaskIndex]
      
      await axios.post(`/api/tasks/${currentTask.id}/tags`, {
        tags: selectedTags
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setProcessedTasks(prev => prev + 1)
      setCurrentTaskIndex(prev => prev + 1)
    } catch (err) {
      console.error('Error saving task:', err)
      setError('Failed to save task. Please try again.')
    }
  }

  useEffect(() => {
    if (user) {
      loadTasks()
    }
  }, [user])

  if (!isLoaded) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🔐 TickTick Task Tagger</h1>
          <p>Sign in to manage your tasks</p>
          <SignIn />
        </div>
      </div>
    )
  }

  const currentTask = tasks[currentTaskIndex]
  const remainingTasks = tasks.length - processedTasks

  return (
    <div className="app">
      <header className="header">
        <h1>🏷️ TickTick Task Tagger</h1>
        <p>Automatically tag your unprocessed tasks</p>
        <div className="user-info">
          <span>Welcome, {user.primaryEmailAddress?.emailAddress || 'User'}!</span>
          <button onClick={() => user.signOut()} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-number">{tasks.length}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-number">{processedTasks}</span>
          <span className="stat-label">Processed</span>
        </div>
        <div className="stat">
          <span className="stat-number">{remainingTasks}</span>
          <span className="stat-label">Remaining</span>
        </div>
      </div>

      <div className="task-container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="error">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={loadTasks} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks">
            <h3>📝 No Tasks Found</h3>
            <p>Either you have no unprocessed tasks, or you need to configure your TickTick credentials.</p>
            <button onClick={loadTasks} className="btn btn-primary">
              Refresh Tasks
            </button>
          </div>
        ) : currentTaskIndex >= tasks.length ? (
          <div className="completion">
            <h3>🎉 All Done!</h3>
            <p>You've successfully processed all {tasks.length} tasks.</p>
            <button onClick={loadTasks} className="btn btn-primary">
              Refresh Tasks
            </button>
          </div>
        ) : (
          <TaskCard 
            task={currentTask} 
            onSave={saveTask}
            onSkip={() => setCurrentTaskIndex(prev => prev + 1)}
          />
        )}
      </div>

      <div className="controls">
        <button onClick={loadTasks} className="btn btn-secondary">
          🔄 Refresh Tasks
        </button>
      </div>
    </div>
  )
}

function TaskCard({ task, onSave, onSkip }) {
  const [selectedTags, setSelectedTags] = useState(task.suggestedTags || [])
  
  const allTags = [
    'work', 'personal', 'urgent', 'important', 'low-priority', 
    'creative', 'detailed', 'review', 'meeting', 'project',
    'health', 'family', 'shopping', 'travel', 'exercise'
  ]

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSave = () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag')
      return
    }
    onSave(selectedTags)
  }

  return (
    <div className="task-card">
      <div className="task-header">
        <h2 className="task-title">{task.title}</h2>
        {task.content && (
          <div className="task-content">{task.content}</div>
        )}
        <div className="task-meta">
          <span>📅 {task.dueDate || 'No due date'}</span>
          <span>📁 {task.projectName || 'No project'}</span>
          <span>⚡ {task.priority || 'Normal'}</span>
        </div>
      </div>

      {task.suggestedTags && task.suggestedTags.length > 0 && (
        <div className="suggested-tags">
          <h4>💡 Suggested Tags</h4>
          <div className="tags-grid">
            {task.suggestedTags.map(tag => (
              <label key={tag} className="tag-label suggested">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="tags-section">
        <h3>🏷️ Available Tags</h3>
        <div className="tags-grid">
          {allTags.map(tag => (
            <label key={tag} className={`tag-label ${task.suggestedTags?.includes(tag) ? 'suggested' : ''}`}>
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagToggle(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="task-controls">
        <button onClick={onSkip} className="btn btn-secondary">
          ⏭️ Skip
        </button>
        <button onClick={handleSave} className="btn btn-primary">
          💾 Save & Continue
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <TaskTagger />
    </ClerkProvider>
  )
}

export default App
