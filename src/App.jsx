import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// Mock data for testing without authentication
const mockTasks = [
  {
    id: '1',
    title: 'Review quarterly reports',
    content: 'Need to review and approve all quarterly financial reports before the board meeting',
    dueDate: '2024-01-15',
    projectName: 'Finance',
    priority: 'High',
    suggestedTags: ['work', 'important', 'review']
  },
  {
    id: '2',
    title: 'Buy groceries for dinner',
    content: 'Need to pick up ingredients for tonight\'s dinner including vegetables and meat',
    dueDate: '2024-01-10',
    projectName: 'Personal',
    priority: 'Normal',
    suggestedTags: ['personal', 'shopping']
  },
  {
    id: '3',
    title: 'Schedule team meeting',
    content: 'Coordinate with team members to schedule the weekly standup meeting',
    dueDate: '2024-01-12',
    projectName: 'Work',
    priority: 'Normal',
    suggestedTags: ['work', 'meeting']
  }
]

function TaskTagger() {
  const [tasks, setTasks] = useState([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [processedTasks, setProcessedTasks] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadTasks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // For now, use mock data instead of API call
      // In production, this would be: const response = await axios.get('/api/tasks')
      setTasks(mockTasks)
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
    if (currentTaskIndex >= tasks.length) return
    
    try {
      // For now, just simulate saving
      // In production, this would be: await axios.post(`/api/tasks/${currentTask.id}/tags`, { tags: selectedTags })
      console.log('Saving task with tags:', selectedTags)
      
      setProcessedTasks(prev => prev + 1)
      setCurrentTaskIndex(prev => prev + 1)
    } catch (err) {
      console.error('Error saving task:', err)
      setError('Failed to save task. Please try again.')
    }
  }

  useEffect(() => {
    // Load tasks on component mount
    loadTasks()
  }, [])

  const currentTask = tasks[currentTaskIndex]
  const remainingTasks = tasks.length - processedTasks

  return (
    <div className="app">
      <header className="header">
        <h1>🏷️ TickTick Task Tagger</h1>
        <p>Automatically tag your unprocessed tasks</p>
        <div className="user-info">
          <span>Welcome! (Demo Mode)</span>
          <button onClick={() => setIsAuthenticated(!isAuthenticated)} className="btn btn-secondary">
            {isAuthenticated ? 'Sign Out' : 'Sign In'}
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
  return <TaskTagger />
}

export default App
