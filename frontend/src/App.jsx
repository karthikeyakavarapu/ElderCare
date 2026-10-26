import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import './index.css';

// No login wall — AuthContext always provides a demo session synchronously.
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"           element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup"          element={<Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
      <Route path="/reset-password"  element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard"       element={<Dashboard />} />
      <Route path="/emergency"       element={<Emergency />} />
      <Route path="*"                element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
