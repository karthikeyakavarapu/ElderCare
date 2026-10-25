import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero container">
        <span className="hero-badge">✨ Trusted by 500+ Care Facilities</span>
        <h1>
          Compassionate <span className="gradient-text">Elder Care</span><br />
          Management System
        </h1>
        <p className="hero-subtitle">
          Empower caregivers, protect elders, and connect families with our intelligent 
          health monitoring, emergency response, and analytics platform.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-lg">📊 View Dashboard</Link>
              <Link to="/emergency" className="btn btn-danger btn-lg">🚨 Emergency</Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free →</Link>
              <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section container">
        <div className="section-title">
          <h2>Everything You Need for <span className="gradient-text">Elder Care</span></h2>
          <p>Comprehensive tools built for modern healthcare management</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🏥</span>
            <h3>Health Monitoring</h3>
            <p>Track vital signs including heart rate, blood pressure, oxygen levels, 
               and temperature with real-time analytics and trend visualization.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🚨</span>
            <h3>SOC Emergency Alerts</h3>
            <p>One-click emergency response system that instantly notifies caregivers 
               and family members via email and SMS alerts.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Analytics Dashboard</h3>
            <p>Interactive charts and graphs showing health trends, emergency patterns, 
               activity levels, and comprehensive care reports.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Role-Based Access</h3>
            <p>Least-privilege authorization with Admin, Caregiver, and Family roles. 
               Each role sees only what they need to see.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📧</span>
            <h3>Email & Messaging</h3>
            <p>Send updates, reports, and notifications via Gmail API integration. 
               Keep all stakeholders informed automatically.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👨‍👩‍👧‍👦</span>
            <h3>Family Connect</h3>
            <p>Family members can monitor their loved ones' health, receive emergency 
               alerts, and communicate with caregivers securely.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Care Facilities</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Elders Monitored</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">System Uptime</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">&lt;30s</div>
            <div className="stat-label">Emergency Response</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="features-section container">
        <div className="section-title">
          <h2>What Our Users <span className="gradient-text">Say</span></h2>
          <p>Trusted by healthcare professionals across the country</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>
              "ElderCare transformed how we manage our assisted living facility. 
              The emergency alert system alone has saved lives."
            </p>
            <div style={{ color: 'var(--text-accent)', fontWeight: '600' }}>— Dr. Sarah Mitchell</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Director, Sunrise Care Home</div>
          </div>
          <div className="feature-card">
            <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>
              "As a family member, having real-time access to my mother's health data 
              gives me peace of mind every single day."
            </p>
            <div style={{ color: 'var(--text-accent)', fontWeight: '600' }}>— Rajesh Kumar</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Family Member</div>
          </div>
          <div className="feature-card">
            <p style={{ fontStyle: 'italic', marginBottom: '16px' }}>
              "The analytics dashboard helps me track 20+ patients efficiently. 
              The role-based access keeps everything organized."
            </p>
            <div style={{ color: 'var(--text-accent)', fontWeight: '600' }}>— Nurse Priya Sharma</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Head Caregiver, Green Valley</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section container">
        <div className="cta-card">
          <h2>Ready to Transform Elder Care?</h2>
          <p>Join 500+ facilities already using ElderCare Management System</p>
          {!isAuthenticated && (
            <Link to="/signup" className="btn btn-lg" style={{ background: 'white', color: '#6366f1', fontWeight: '700' }}>
              Start Free Trial →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        <p>© 2026 ElderCare Management System. Built with ❤️ for better elder care.</p>
      </footer>
    </div>
  );
}
