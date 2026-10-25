import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChatModule({ elder }) {
  const { authFetch, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [elder]);

  const fetchMessages = async () => {
    try {
      const res = await authFetch('/api/messaging/history');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.reverse()); // Chronological ordering
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !elder) return;
    
    const recipientEmail = user.role === 'caregiver' ? elder.family_contact_email : elder.caregiver_email;
    
    if (!recipientEmail) {
      alert("No linked contact found to message for this patient. Ensure a Family and Caregiver are both assigned.");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          subject: 'Direct Message',
          body: newMessage
        })
      });
      
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <h2 className="card-title">💬 Message Board</h2>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '15px' }}>
        {messages.length === 0 ? (
          <p className="text-muted text-center" style={{ marginTop: '20px' }}>No messages yet.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ 
              marginBottom: '10px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: msg.sender_id === user.user_id ? 'flex-end' : 'flex-start' 
            }}>
              <div style={{ 
                background: msg.sender_id === user.user_id ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)', 
                padding: '10px 15px', 
                borderRadius: '12px',
                maxWidth: '80%'
              }}>
                <p style={{ margin: 0 }}>{msg.body}</p>
                <small style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '5px', display: 'block' }}>
                  {new Date(msg.created_at).toLocaleTimeString().slice(0, 5)}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          className="form-input" 
          style={{ flex: 1, padding: '10px' }}
          placeholder="Type a message..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !newMessage.trim() || !elder}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
