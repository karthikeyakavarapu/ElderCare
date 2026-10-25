import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏥</span>
          <span className="brand-text">ElderCare</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>🏠 Home</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
              <Link to="/emergency" className={isActive('/emergency')}>🚨 Emergency</Link>
              
              <div className="nav-user-section">
                <span className={`nav-role-badge ${user?.role}`}>{user?.role}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')}>🔑 Login</Link>
              <Link to="/signup" className="btn btn-sm btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
