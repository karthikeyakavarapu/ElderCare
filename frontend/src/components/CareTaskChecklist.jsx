import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CareTaskChecklist({ elder }) {
  const { authFetch, hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (elder?.id) {
      fetchTasks();
    }
  }, [elder]);

  const fetchTasks = async () => {
    try {
      const res = await authFetch(`/api/dashboard/care-tasks?elder_id=${elder.id}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !elder) return;
    
    setLoading(true);
    try {
      const res = await authFetch('/api/dashboard/care-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elder_id: elder.id,
          task_name: newTaskName
        })
      });
      if (res.ok) {
        setNewTaskName('');
        fetchTasks();
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    if (!hasRole('admin', 'caregiver')) return;
    
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await authFetch(`/api/dashboard/care-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
      fetchTasks(); 
    }
  };

  if (!elder) return <div className="card">Please select a patient to view tasks.</div>;

  return (
    <div className="card">
      <h2 className="card-title">✅ Daily Care Tasks</h2>
      
      {hasRole('admin', 'caregiver') && (
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            className="form-input" 
            style={{ flex: 1 }}
            placeholder="E.g., Morning Walk, Administer Insulin" 
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !newTaskName.trim()}>
            Add Task
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length === 0 ? (
          <p className="text-muted">No care tasks scheduled for this patient.</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '6px',
              borderLeft: `4px solid ${task.status === 'completed' ? '#10b981' : '#f59e0b'}`,
              transition: 'all 0.2s'
            }}>
              <input 
                type="checkbox" 
                checked={task.status === 'completed'}
                onChange={() => toggleTaskStatus(task.id, task.status)}
                disabled={!hasRole('admin', 'caregiver')}
                style={{ width: '20px', height: '20px', cursor: hasRole('admin', 'caregiver') ? 'pointer' : 'default' }}
              />
              <span style={{ 
                flex: 1, 
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                opacity: task.status === 'completed' ? 0.6 : 1
              }}>
                {task.task_name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
