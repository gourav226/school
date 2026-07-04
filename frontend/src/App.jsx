import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:5000/api';

// Request Headers manage karne ka helper function
const getHeaders = () => {
  const token = localStorage.getItem('school_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer {token}`;
  }
  return headers;
};

function App() {
  const [currentView, setCurrentView] = useState('home'); // home, about, apply, login, admin
  const [announcements, setAnnouncements] = useState([]);
  
  // Admin authentication state variables
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('school_admin_token'));
  const [adminUser, setAdminUser] = useState(localStorage.getItem('school_admin_user') || '');

  // Admin dashboard tables dynamic states
  const [admissions, setAdmissions] = useState([]);
  const [stats, setStats] = useState({ totalAdmissions: 0, pendingAdmissions: 0, totalAnnouncements: 0 });
  const [adminTab, setAdminTab] = useState('inquiries');

  // Login Form input values (Password check: gourav289)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Admission inquiry form input values
  const [admissionForm, setAdmissionForm] = useState({
    student_name: '',
    parent_name: '',
    email: '',
    phone: '',
    grade_level: 'Grade 9',
    message: ''
  });
  const [admissionStatus, setAdmissionStatus] = useState({ type: '', msg: '' });
  const [admissionLoading, setAdmissionLoading] = useState(false);

  // Announcement post form input values
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'Medium'
  });
  const [announcementStatus, setAnnouncementStatus] = useState({ type: '', msg: '' });
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // Load announcements on component load
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Refresh admin panel if admin is logged in
  useEffect(() => {
    if (currentView === 'admin' && isAuth) {
      loadAdminDashboard();
    }
  }, [currentView, isAuth]);

  // Load announcements
  const loadAnnouncements = async () => {
    try {
      const res = await fetch(`${BASE_URL}/announcements`);
      if (!res.ok) throw new Error('Could not fetch announcements');
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error("Error load announcements:", err);
    }
  };

  // Load admin dashboard statistics
  const loadAdminDashboard = async () => {
    try {
      const token = localStorage.getItem('school_admin_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const admRes = await fetch(`${BASE_URL}/admissions`, { headers });
      if (!admRes.ok) throw new Error('Failed to fetch admissions');
      const admData = await admRes.json();
      setAdmissions(admData);

      const statRes = await fetch(`${BASE_URL}/stats`, { headers });
      if (!statRes.ok) throw new Error('Failed to fetch stats');
      const statData = await statRes.json();
      setStats(statData);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      handleLogout();
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      localStorage.setItem('school_admin_token', data.token);
      localStorage.setItem('school_admin_user', data.username);
      setIsAuth(true);
      setAdminUser(data.username);
      setCurrentView('admin');
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.message || 'Login details are incorrect.');
    } finally {
      setLoginForm({ username: '', password: '' });
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    const token = localStorage.getItem('school_admin_token');
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Logout request error:", e);
    }
    localStorage.removeItem('school_admin_token');
    localStorage.removeItem('school_admin_user');
    setIsAuth(false);
    setAdminUser('');
    setCurrentView('home');
  };

  // Admission inquiry handler
  const handleApply = async (e) => {
    e.preventDefault();
    setAdmissionStatus({ type: '', msg: '' });
    setAdmissionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admissions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admissionForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setAdmissionStatus({
        type: 'success',
        msg: 'Admission Inquiry Form successfully submit ho gaya hai. Hum jald hi aapse contact karenge!'
      });
      setAdmissionForm({
        student_name: '',
        parent_name: '',
        email: '',
        phone: '',
        grade_level: 'Grade 9',
        message: ''
      });
    } catch (err) {
      setAdmissionStatus({ type: 'error', msg: err.message });
    } finally {
      setAdmissionLoading(false);
    }
  };

  // Create announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementStatus({ type: '', msg: '' });
    setAnnouncementLoading(true);
    const token = localStorage.getItem('school_admin_token');
    try {
      const res = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish announcement');

      setAnnouncementStatus({ type: 'success', msg: 'Announcement successfully publish ho gaya!' });
      setAnnouncementForm({ title: '', content: '', priority: 'Medium' });
      loadAnnouncements();
      loadAdminDashboard();
    } catch (err) {
      setAnnouncementStatus({ type: 'error', msg: err.message });
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Delete announcement
  const handleDeleteAnn = async (id) => {
    if (!window.confirm("Kya aap sach me ye update delete karna chahte hain?")) return;
    const token = localStorage.getItem('school_admin_token');
    try {
      const res = await fetch(`${BASE_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      loadAnnouncements();
      loadAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  // Status update
  const handleStatusUpdate = async (id, status) => {
    const token = localStorage.getItem('school_admin_token');
    try {
      const res = await fetch(`${BASE_URL}/admissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Status update failed');
      loadAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  // Smooth scroll navigate helper
  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Top Utility Information Bar */}
      <div className="top-info-bar">
        <div className="top-info-contact">
          <span>📞 +91 99777 29994</span>
          <span>✉️ admissions@gouravinternational.edu.in</span>
        </div>
        <div className="top-info-ticker">
          <span>Updates</span> Admissions open for Grade 6 to Grade 12 (Session 2026-27)
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => navigateTo('home')}>
          🏫 Gourav <span>International School</span>
        </div>
        <nav className="nav-links">
          <span className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>Home</span>
          <span className={`nav-item ${currentView === 'about' ? 'active' : ''}`} onClick={() => navigateTo('about')}>Academics & Faculty</span>
          <span className={`nav-item ${currentView === 'apply' ? 'active' : ''}`} onClick={() => navigateTo('apply')}>Admissions</span>
          {isAuth ? (
            <>
              <span className={`nav-item ${currentView === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')}>Dashboard</span>
              <button className="nav-btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => navigateTo('login')}>Admin Portal</button>
          )}
        </nav>
      </header>

      {/* Main Sections */}
      <main>
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <span>🎓 Affiliated to Central Board (CBSE)</span>
                </div>
                <h1 className="hero-title">
                  Preparing Leaders for a <span>Better Tomorrow</span>
                </h1>
                <p className="hero-description">
                  At Gourav International School, we offer a comprehensive academic curriculum designed 
                  to develop analytical thinking, strong ethical values, and digital readiness in a healthy campus environment.
                </p>
                <div className="hero-cta">
                  <button className="nav-btn" onClick={() => navigateTo('apply')}>Enroll Your Child Today</button>
                  <button className="nav-btn-secondary" onClick={() => navigateTo('about')}>Browse Curriculum</button>
                </div>
              </div>
              <div className="hero-image-container">
                <div className="hero-visual">
                  <img src="/school_campus.png" alt="Gourav School Campus" className="hero-image" />
                </div>
              </div>
            </section>

            {/* Quick Metrics Cards */}
            <section className="stats-section">
              <div className="stat-card glass-panel">
                <div className="stat-number">1,200+</div>
                <div className="stat-label">Happy Students</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">100%</div>
                <div className="stat-label">Board Exam Pass Rate</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">75+</div>
                <div className="stat-label">Expert Mentors & Teachers</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">15+</div>
                <div className="stat-label">Sports & STEM Labs</div>
              </div>
            </section>

            {/* Principal Welcome Message */}
            <section className="principal-section">
              <div className="principal-photo-card glass-panel">
                <div className="principal-avatar">DS</div>
                <h4 className="principal-name">Dr. Dev Sharma</h4>
                <span className="principal-title">Principal's Address</span>
              </div>
              <div className="principal-content">
                <span className="section-tag">Welcome Note</span>
                <h2 className="section-title">Message from the Principal</h2>
                <p className="principal-welcome-text">
                  "Welcome to Gourav International School! We believe that education is not merely the acquisition of knowledge, 
                  but the development of character, integrity, and analytical curiosity. Our campus offers students 
                  state-of-the-art facilities, modern computer centers, and an expansive athletic complex designed to support 
                  holistic growth. We work closely with parents to ensure each child receives the care, support, and guidance 
                  required to build a successful and meaningful path."
                </p>
              </div>
            </section>

            {/* Core Streams */}
            <div className="section-header">
              <span className="section-tag">Learning Pathways</span>
              <h2 className="section-title">Our Academic Streams</h2>
              <p className="section-subtitle">
                Designed to prepare students for top universities and analytical problem solving.
              </p>
            </div>

            <section className="programs-section">
              <div className="program-card glass-panel">
                <div className="program-icon-box">🔬</div>
                <h3 className="program-title">Advanced Science</h3>
                <p className="program-text">
                  Focus on Physics, Chemistry, Mathematics, Biology, and Biotechnology with extensive practical sessions.
                </p>
                <ul className="program-features">
                  <li>Well-equipped Chemistry & Biology Labs</li>
                  <li>In-depth board and competitive exam training</li>
                  <li>Project exhibitions and olympiads</li>
                </ul>
              </div>
              <div className="program-card glass-panel">
                <div className="program-icon-box">📊</div>
                <h3 className="program-title">Commerce & Finance</h3>
                <p className="program-text">
                  Core modules in Accountancy, Business Studies, Economics, and Financial Mathematics.
                </p>
                <ul className="program-features">
                  <li>Simulated trading and enterprise workshops</li>
                  <li>Guest lectures from industry professionals</li>
                  <li>Case-study based business projects</li>
                </ul>
              </div>
              <div className="program-card glass-panel">
                <div className="program-icon-box">🎨</div>
                <h3 className="program-title">Humanities & Design</h3>
                <p className="program-text">
                  Encouraging creative writing, political science, history, literature, and digital design.
                </p>
                <ul className="program-features">
                  <li>Weekly debates, creative writing, and MUNs</li>
                  <li>Integrated digital arts and UI design studio</li>
                  <li>Specialist courses in liberal studies</li>
                </ul>
              </div>
            </section>

            {/* Life at Nebula / School Facility Showcase */}
            <div className="section-header">
              <span className="section-tag">Campus Tour</span>
              <h2 className="section-title">Life at Gourav</h2>
              <p className="section-subtitle">
                A glimpse into our state-of-the-art infrastructure and student activities.
              </p>
            </div>

            <section className="gallery-section">
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <div className="gallery-emoji">🔬</div>
                  <h4 className="gallery-title">Modern Science Labs</h4>
                  <p className="gallery-desc">Hands-on research and exploration facilities.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <div className="gallery-emoji">💻</div>
                  <h4 className="gallery-title">Smart Classrooms</h4>
                  <p className="gallery-desc">Interactive digital displays and hybrid audio setups.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <div className="gallery-emoji">🏀</div>
                  <h4 className="gallery-title">Sports Complex</h4>
                  <p className="gallery-desc">Basketball, football, badminton, and outdoor athletic tracks.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <div className="gallery-emoji">🎨</div>
                  <h4 className="gallery-title">Creative Art Studio</h4>
                  <p className="gallery-desc">Music classes, classical dance, and visual art studios.</p>
                </div>
              </div>
            </section>

            {/* Announcements */}
            <div className="section-header">
              <span className="section-tag">Notice Board</span>
              <h2 className="section-title">School Announcements</h2>
              <p className="section-subtitle">
                Latest updates, notifications, and details of scheduled events at Gourav.
              </p>
            </div>

            <section className="announcements-container">
              {announcements.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active notices found at this time.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="ann-card glass-panel">
                    <div className="ann-header">
                      <div className="ann-title-group">
                        <h4 className="ann-title">{ann.title}</h4>
                        <span className={`ann-badge ${ann.priority.toLowerCase()}`}>
                          {ann.priority} Priority
                        </span>
                      </div>
                      <span className="ann-date">
                        {new Date(ann.date_posted).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="ann-content">{ann.content}</p>
                  </div>
                ))
              )}
            </section>

            {/* Admissions Banner CTA */}
            <section className="cta-banner">
              <h2>Enroll Your Child for Academic Excellence</h2>
              <p>Admissions are officially open for academic session 2026-2027. Contact our counselors today to schedule a school tour.</p>
              <button className="nav-btn" onClick={() => navigateTo('apply')}>Apply for Admission Now</button>
            </section>
          </>
        )}

        {currentView === 'about' && (
          <>
            <div className="section-header">
              <span className="section-tag">Educators</span>
              <h2 className="section-title">Our Expert Faculty</h2>
              <p className="section-subtitle">
                Our faculty consists of certified mentors, subject matter experts, and research guides.
              </p>
            </div>

            <section className="faculty-section">
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar">DS</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Dr. Dev Sharma</h4>
                  <span className="faculty-role">Principal & Physics Mentor</span>
                  <span className="faculty-exp">PhD in Physics, 18 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar">AP</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Anjali Patel</h4>
                  <span className="faculty-role">Mathematics HOD</span>
                  <span className="faculty-exp">M.Sc Mathematics, 12 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar">RK</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Rajesh Kumar</h4>
                  <span className="faculty-role">Lead Computer Science Faculty</span>
                  <span className="faculty-exp">M.Tech Computer Science, 10 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar">SC</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Sarah Carter</h4>
                  <span className="faculty-role">English Literature HOD</span>
                  <span className="faculty-exp">M.A. English (Oxford), 8 Yrs Experience</span>
                </div>
              </div>
            </section>

            {/* School Philosophy */}
            <div className="form-container glass-panel" style={{ maxWidth: '850px' }}>
              <h3 className="form-title" style={{ marginBottom: '1rem' }}>Our Core Ideals</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.8' }}>
                We believe that education must extend beyond books. Our core training methodologies center on:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent-blue)' }}>
                  <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>Science & Practical</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Working in smart labs to formulate scientific results and learn engineering basics.</p>
                </div>
                <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent-gold)' }}>
                  <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-gold-dark)' }}>Character Building</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Focusing on discipline, global cooperation, public speaking, and community service.</p>
                </div>
                <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent-light-blue)' }}>
                  <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-light-blue)' }}>Digital Literacy</h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Providing computational thinking and software foundation classes across junior and senior school.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'apply' && (
          <div className="form-container glass-panel">
            <h2 className="form-title">Admissions & Inquiry</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Please fill out the form below, and our administration will reach back within 24-48 business hours.
            </p>

            {admissionStatus.msg && (
              <div className={`form-alert ${admissionStatus.type}`}>
                {admissionStatus.msg}
              </div>
            )}

            <form onSubmit={handleApply}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter student name"
                    value={admissionForm.student_name}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, student_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter parent name"
                    value={admissionForm.parent_name}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, parent_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@example.com"
                    value={admissionForm.email}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={admissionForm.phone}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Grade / Class Applying For</label>
                <select
                  className="form-select"
                  value={admissionForm.grade_level}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, grade_level: e.target.value })}
                >
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11 (Science)</option>
                  <option>Grade 11 (Commerce)</option>
                  <option>Grade 12 (Science)</option>
                  <option>Grade 12 (Commerce)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message / Student Details</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ask us about transport options, boarding facilities, or specific sports requirements..."
                  value={admissionForm.message}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, message: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="form-btn" disabled={admissionLoading}>
                {admissionLoading ? 'Submitting Form...' : 'Submit Admission Inquiry'}
              </button>
            </form>
          </div>
        )}

        {currentView === 'login' && (
          <div className="form-container glass-panel" style={{ maxWidth: '450px' }}>
            <h2 className="form-title">Admin Login</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Sign in to manage student inquiries, edit notice boards, and view statistics.
            </p>

            {loginError && <div className="form-alert error">{loginError}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="admin"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className="form-btn" disabled={loginLoading}>
                {loginLoading ? 'Verifying...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        )}

        {currentView === 'admin' && isAuth && (
          <div className="admin-container">
            {/* Admin Header */}
            <div className="admin-header">
              <div className="admin-title-area">
                <span className="admin-badge-user">Admin: {adminUser}</span>
                <h2>Gourav Management Center</h2>
              </div>
              <button className="nav-btn-secondary" onClick={handleLogout}>Log Out</button>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{stats.totalAdmissions}</span>
                  <span className="admin-stat-label">Total Inquiries</span>
                </div>
                <div className="admin-stat-icon">📩</div>
              </div>
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value" style={{ color: stats.pendingAdmissions > 0 ? 'var(--warning)' : 'inherit' }}>
                    {stats.pendingAdmissions}
                  </span>
                  <span className="admin-stat-label">Pending Reviews</span>
                </div>
                <div className="admin-stat-icon">🕒</div>
              </div>
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{stats.totalAnnouncements}</span>
                  <span className="admin-stat-label">Notices Published</span>
                </div>
                <div className="admin-stat-icon">📢</div>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="admin-tabs">
              <button
                className={`admin-tab ${adminTab === 'inquiries' ? 'active' : ''}`}
                onClick={() => setAdminTab('inquiries')}
              >
                Admission Requests
              </button>
              <button
                className={`admin-tab ${adminTab === 'announcements' ? 'active' : ''}`}
                onClick={() => setAdminTab('announcements')}
              >
                Announcements Board
              </button>
            </div>

            {/* Tab 1: Admissions requests table */}
            {adminTab === 'inquiries' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>Student Admission Inquiries</h3>
                {admissions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No inquiries submitted in database.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Parent Name</th>
                          <th>Email & Phone</th>
                          <th>Grade</th>
                          <th>Status</th>
                          <th>Update Status</th>
                          <th>Date Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admissions.map((adm) => (
                          <tr key={adm.id}>
                            <td>
                              <strong>{adm.student_name}</strong>
                              {adm.message && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                                  "{adm.message}"
                                </div>
                              )}
                            </td>
                            <td>{adm.parent_name}</td>
                            <td>
                              <div>{adm.email}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{adm.phone}</div>
                            </td>
                            <td><span style={{ fontWeight: 700 }}>{adm.grade_level}</span></td>
                            <td>
                              <span className={`status-badge ${adm.status}`}>{adm.status}</span>
                            </td>
                            <td className="status-actions">
                              <select
                                value={adm.status}
                                onChange={(e) => handleStatusUpdate(adm.id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                              {new Date(adm.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Announcements editor */}
            {adminTab === 'announcements' && (
              <div className="ann-manager-layout">
                <div className="glass-panel ann-form-panel">
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>Create Notice</h3>
                  
                  {announcementStatus.msg && (
                    <div className={`form-alert ${announcementStatus.type}`}>
                      {announcementStatus.msg}
                    </div>
                  )}

                  <form onSubmit={handleCreateAnnouncement}>
                    <div className="form-group">
                      <label className="form-label">Notice Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g., Autumn Term Exam Date Sheet"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={announcementForm.priority}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description / Notice Details</label>
                      <textarea
                        required
                        className="form-textarea"
                        placeholder="Provide details about the scheduled notices..."
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      ></textarea>
                    </div>

                    <button type="submit" className="form-btn" disabled={announcementLoading}>
                      {announcementLoading ? 'Publishing Notice...' : 'Publish Update'}
                    </button>
                  </form>
                </div>

                <div className="ann-list-panel">
                  <h3 style={{ color: 'var(--accent-blue)' }}>Active Notices</h3>
                  {announcements.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No announcements posted.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="ann-list-item glass-panel">
                        <div className="ann-list-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-blue)' }}>{ann.title}</strong>
                            <span className={`ann-badge ${ann.priority.toLowerCase()}`}>{ann.priority}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                            Published: {new Date(ann.date_posted).toLocaleString()}
                          </span>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {ann.content}
                          </p>
                        </div>
                        <button className="ann-delete-btn" onClick={() => handleDeleteAnn(ann.id)}>
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-info">
            <div className="footer-logo">🏫 Gourav <span>International School</span></div>
            <p className="footer-text">
              Nurturing character, building knowledge, and guiding tomorrow's leaders under CBSE curriculum frameworks.
            </p>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-title">Quick Portals</h4>
            <ul className="footer-links-list">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Home Page</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('about'); }}>Academics & Faculty</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('apply'); }}>Admission Applications</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-title">Campus Contact</h4>
            <ul className="footer-links-list">
              <li>📍 Sector 15, Gourav Educational Park, India</li>
              <li>📞 +91 99777 29994</li>
              <li>✉️ info@gouravinternational.edu.in</li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-title">Social Links</h4>
            <div className="footer-socials">
              <a href="#" className="footer-social-icon" onClick={(e) => e.preventDefault()}>𝕏</a>
              <a href="#" className="footer-social-icon" onClick={(e) => e.preventDefault()}>💬</a>
              <a href="#" className="footer-social-icon" onClick={(e) => e.preventDefault()}>📺</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Gourav International School. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
