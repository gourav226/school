import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Sun, 
  Moon, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Download, 
  Building2, 
  Sparkles, 
  Clock, 
  Lock, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Star,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  XCircle,
  AlertCircle
} from 'lucide-react';

const BASE_URL = 'http://localhost:5000/api';

// Request Headers helper
const getHeaders = () => {
  const token = localStorage.getItem('school_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

function App() {
  const [currentView, setCurrentView] = useState('home'); // home, about, apply, faq, contact, login, admin
  const [announcements, setAnnouncements] = useState([]);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Admin authentication state variables
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('school_admin_token'));
  const [adminUser, setAdminUser] = useState(localStorage.getItem('school_admin_user') || '');

  // Admin dashboard tables dynamic states
  const [admissions, setAdmissions] = useState([]);
  const [stats, setStats] = useState({ totalAdmissions: 0, pendingAdmissions: 0, totalAnnouncements: 0 });
  const [adminTab, setAdminTab] = useState('inquiries');

  // Admin Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');

  // Login Form input values
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

  // FAQ Active Item tracker
  const [activeFaq, setActiveFaq] = useState(null);

  // Apply dark mode theme class on mount/change
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load announcements on component load
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Refresh admin panel if admin is logged in
  useEffect(() => {
    if (currentView === 'admin') {
      if (isAuth) {
        loadAdminDashboard();
      } else {
        // Enforce security: redirect to login if attempting to view dashboard without auth
        setCurrentView('login');
      }
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
      console.error("Error loading announcements:", err);
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
        msg: 'Admission Inquiry Form submitted successfully! Our counselors will contact you shortly.'
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

      setAnnouncementStatus({ type: 'success', msg: 'Announcement successfully published to notice board!' });
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
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
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

  // Export admissions records as CSV
  const handleExportCSV = () => {
    if (admissions.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Student Name", "Parent Name", "Email", "Phone", "Grade Level", "Status", "Date Submitted", "Message"];
    const rows = admissions.map(adm => [
      `"${adm.student_name.replace(/"/g, '""')}"`,
      `"${adm.parent_name.replace(/"/g, '""')}"`,
      `"${adm.email}"`,
      `"${adm.phone}"`,
      `"${adm.grade_level}"`,
      `"${adm.status}"`,
      `"${new Date(adm.created_at).toLocaleDateString()}"`,
      `"${(adm.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gourav_admissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smooth scroll navigate helper
  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle dark/light theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Toggle FAQ items
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // FAQ data
  const faqs = [
    {
      q: "What is the admission procedure at Gourav International School?",
      a: "Parents can fill out the online Inquiry Form under the 'Admissions' tab. Our admin office will contact you within 24-48 hours to schedule an interaction and campus tour. Following a successful interaction, admission is finalized upon fee payment and document verification."
    },
    {
      q: "Is the school affiliated with CBSE?",
      a: "Yes, Gourav International School is fully affiliated with the Central Board of Secondary Education (CBSE), offering Science, Commerce, and Liberal Arts streams for secondary and senior secondary levels."
    },
    {
      q: "What sports and extra-curricular facilities are offered?",
      a: "Our campus offers a comprehensive indoor sports complex, professional basketball courts, a football field, table tennis, badminton arenas, computational thinking labs, STEM/robotics modules, and modern visual/creative art studios."
    },
    {
      q: "Does the school provide transport facility?",
      a: "Yes, the school runs GPS-enabled, security-monitored school bus services across all major sectors and local residential areas. Every bus includes a trained conductor and a lady helper."
    },
    {
      q: "What is the teacher-to-student ratio?",
      a: "We maintain an optimal ratio of 1:25. This ensures tailored mentoring, support, and specialized attention to nurture every student's learning outcomes."
    }
  ];

  // Testimonial data
  const testimonials = [
    {
      name: "Sanjay Sharma",
      role: "Parent of Grade 10 Student",
      text: "The STEM and practical science labs are incredible. My son has developed a strong interest in programming and coding classes. The mentors are highly professional.",
      rating: 5
    },
    {
      name: "Meera Deshmukh",
      role: "Parent of Grade 8 Student",
      text: "Gourav International School offers the perfect balance between academics and co-curricular activities. The focus on public speaking and character building is visible.",
      rating: 5
    },
    {
      name: "Anand Verma",
      role: "Alumni (Class of 2024)",
      text: "The preparation for CBSE board exams combined with university counseling sessions set me up perfectly for admission to my choice computer science program.",
      rating: 5
    }
  ];

  // Filter admissions for dashboard display
  const filteredAdmissions = admissions.filter(adm => {
    const matchesSearch = 
      adm.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.phone.includes(searchTerm);
      
    const matchesStatus = statusFilter === 'All' || adm.status === statusFilter;
    const matchesGrade = gradeFilter === 'All' || adm.grade_level === gradeFilter;
    
    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Calculate dynamic data for the SVG column chart (Inquiries by Grade)
  const gradeList = [
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", 
    "Grade 11 (Science)", "Grade 11 (Commerce)", "Grade 12 (Science)", "Grade 12 (Commerce)"
  ];
  
  const gradeCounts = gradeList.reduce((acc, grade) => {
    acc[grade] = admissions.filter(adm => adm.grade_level === grade).length;
    return acc;
  }, {});
  
  const maxCount = Math.max(...Object.values(gradeCounts), 1); // Avoid division by zero

  return (
    <div className="app-container">
      {/* Top Utility Information Bar */}
      <div className="top-info-bar">
        <div className="top-info-contact">
          <span><Phone size={14} /> +91 99777 29994</span>
          <span><Mail size={14} /> info@gouravinternational.edu.in</span>
        </div>
        <div className="top-info-ticker">
          <span>Updates</span> Admissions Open for Grades 6-12 (Session 2026-27)
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => navigateTo('home')}>
          <GraduationCap size={32} color="var(--accent-gold)" /> Gourav <span>International School</span>
        </div>
        <nav className="nav-links">
          <span className={`nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>Home</span>
          <span className={`nav-item ${currentView === 'about' ? 'active' : ''}`} onClick={() => navigateTo('about')}>Academics & Life</span>
          <span className={`nav-item ${currentView === 'apply' ? 'active' : ''}`} onClick={() => navigateTo('apply')}>Admissions</span>
          <span className={`nav-item ${currentView === 'faq' ? 'active' : ''}`} onClick={() => navigateTo('faq')}>FAQs</span>
          <span className={`nav-item ${currentView === 'contact' ? 'active' : ''}`} onClick={() => navigateTo('contact')}>Contact Us</span>
          
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuth ? (
            <>
              <span className={`nav-item ${currentView === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')}>Dashboard</span>
              <button className="nav-btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => navigateTo('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={16} /> Admin Portal
            </button>
          )}
        </nav>
      </header>

      {/* Main Sections */}
      <main>
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-section" style={{ background: 'var(--hero-gradient)' }}>
              <div className="hero-content">
                <div className="hero-badge">
                  <Award size={16} /> <span>CBSE Affiliated Academic Council</span>
                </div>
                <h1 className="hero-title">
                  Preparing Leaders for a <span>Better Tomorrow</span>
                </h1>
                <p className="hero-description">
                  At Gourav International School, we offer a modern CBSE curriculum designed 
                  to develop analytical thinking, digital readiness, and strong ethical values in a state-of-the-art campus.
                </p>
                <div className="hero-cta">
                  <button className="nav-btn" onClick={() => navigateTo('apply')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Enroll Your Child Now <ArrowRight size={18} />
                  </button>
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
                <div className="stat-label">Enrolled Students</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">100%</div>
                <div className="stat-label">Board Pass Rate</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">75+</div>
                <div className="stat-label">Expert Mentors & Faculty</div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-number">15+</div>
                <div className="stat-label">STEM & Sports Facilities</div>
              </div>
            </section>

            {/* Principal Welcome Message */}
            <section className="principal-section">
              <div className="principal-photo-card glass-panel">
                <div className="principal-avatar" style={{ background: 'var(--accent-gradient)' }}>
                  <Users size={64} color="var(--text-white)" />
                </div>
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

            {/* Why Choose Us */}
            <div className="section-header">
              <span className="section-tag">Why Choose Us</span>
              <h2 className="section-title">Core Ideals of Gourav</h2>
              <p className="section-subtitle">Our educational model is focused on producing future innovators and upright global citizens.</p>
            </div>
            
            <section className="why-us-section">
              <div className="why-us-card glass-panel blue">
                <Sparkles size={36} color="var(--accent-light-blue)" />
                <h3 className="program-title">Science & Practical Labs</h3>
                <p className="program-text">
                  Working in smart labs to formulate scientific results and learn basic software/hardware architectures.
                </p>
              </div>
              <div className="why-us-card glass-panel gold">
                <Award size={36} color="var(--accent-gold)" />
                <h3 className="program-title">Character Building</h3>
                <p className="program-text">
                  Focusing on discipline, leadership seminars, global environmental cooperation, and public speaking.
                </p>
              </div>
              <div className="why-us-card glass-panel">
                <BookOpen size={36} color="var(--accent-blue)" />
                <h3 className="program-title">Digital Literacy</h3>
                <p className="program-text">
                  Providing early computational thinking, cloud basics, and foundational digital logic across all grade divisions.
                </p>
              </div>
            </section>

            {/* Parent Testimonials */}
            <div className="section-header">
              <span className="section-tag">Testimonials</span>
              <h2 className="section-title">What Parents Say</h2>
              <p className="section-subtitle">Hear reviews from families about their experience with our curriculum and mentors.</p>
            </div>

            <section className="testimonials-section">
              {testimonials.map((test, idx) => (
                <div key={idx} className="testimonial-card glass-panel">
                  <div className="testimonial-rating">
                    {[...Array(test.rating)].map((_, i) => <Star key={i} size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
                  </div>
                  <p className="testimonial-text">"{test.text}"</p>
                  <div className="testimonial-user">
                    <div className="testimonial-user-avatar">
                      {test.name.charAt(0)}
                    </div>
                    <div className="testimonial-user-info">
                      <span className="testimonial-user-name">{test.name}</span>
                      <span className="testimonial-user-role">{test.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* School Notice Board (Announcements) */}
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
                Our faculty consists of certified mentors, subject matter experts, and CBSE research guides.
              </p>
            </div>

            <section className="faculty-section">
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar" style={{ background: 'var(--accent-gradient)' }}>DS</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Dr. Dev Sharma</h4>
                  <span className="faculty-role">Principal & Physics Mentor</span>
                  <span className="faculty-exp">PhD in Physics, 18 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar" style={{ background: 'var(--accent-gradient)' }}>AP</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Anjali Patel</h4>
                  <span className="faculty-role">Mathematics HOD</span>
                  <span className="faculty-exp">M.Sc Mathematics, 12 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar" style={{ background: 'var(--accent-gradient)' }}>RK</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Rajesh Kumar</h4>
                  <span className="faculty-role">Lead Computer Science Faculty</span>
                  <span className="faculty-exp">M.Tech Computer Science, 10 Yrs Experience</span>
                </div>
              </div>
              <div className="faculty-card glass-panel">
                <div className="faculty-avatar" style={{ background: 'var(--accent-gradient)' }}>SC</div>
                <div className="faculty-info">
                  <h4 className="faculty-name">Sarah Carter</h4>
                  <span className="faculty-role">English Literature HOD</span>
                  <span className="faculty-exp">M.A. English (Oxford), 8 Yrs Experience</span>
                </div>
              </div>
            </section>

            <div className="section-header">
              <span className="section-tag">Campus Infrastructure</span>
              <h2 className="section-title">Life at Campus</h2>
              <p className="section-subtitle">A glimpse into our state-of-the-art facilities and student activities.</p>
            </div>

            <section className="gallery-section">
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <Building2 size={36} color="var(--text-white)" style={{ marginBottom: '0.5rem' }} />
                  <h4 className="gallery-title">Modern Science Labs</h4>
                  <p className="gallery-desc">Hands-on experimentation and physics equipment.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <Building2 size={36} color="var(--text-white)" style={{ marginBottom: '0.5rem' }} />
                  <h4 className="gallery-title">Smart Classrooms</h4>
                  <p className="gallery-desc">Interactive digital displays and hybrid audio setups.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <Building2 size={36} color="var(--text-white)" style={{ marginBottom: '0.5rem' }} />
                  <h4 className="gallery-title">Sports Complex</h4>
                  <p className="gallery-desc">Basketball, football, badminton, and outdoor athletic tracks.</p>
                </div>
              </div>
              <div className="gallery-card glass-panel">
                <div className="gallery-overlay">
                  <Building2 size={36} color="var(--text-white)" style={{ marginBottom: '0.5rem' }} />
                  <h4 className="gallery-title">Creative Art Studio</h4>
                  <p className="gallery-desc">Music classes, classical dance, and visual art studios.</p>
                </div>
              </div>
            </section>
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

        {currentView === 'faq' && (
          <>
            <div className="section-header">
              <span className="section-tag">Information Desk</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">Find immediate answers to key guidelines, fee inquiries, and board queries.</p>
            </div>

            <div className="faq-container">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                  <div className="faq-question" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    {activeFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentView === 'contact' && (
          <>
            <div className="section-header">
              <span className="section-tag">Get In Touch</span>
              <h2 className="section-title">Contact Our Admissions Office</h2>
              <p className="section-subtitle">Reach out to schedule a campus tour or discuss secondary curriculum guides.</p>
            </div>

            <div className="contact-layout">
              <div className="contact-info-panel">
                <div className="contact-item">
                  <div className="contact-icon">
                    <MapPin size={22} />
                  </div>
                  <div className="contact-text-group">
                    <span className="contact-label">Campus Location</span>
                    <span className="contact-value">Sector 15, Gourav Educational Park, India</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <Phone size={22} />
                  </div>
                  <div className="contact-text-group">
                    <span className="contact-label">Telephone Admissions</span>
                    <span className="contact-value">+91 99777 29994 / +91 99777 29995</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <Mail size={22} />
                  </div>
                  <div className="contact-text-group">
                    <span className="contact-label">Email Support Desk</span>
                    <span className="contact-value">info@gouravinternational.edu.in</span>
                  </div>
                </div>

                <div className="map-placeholder">
                  <MapPin size={48} color="var(--accent-light-blue)" />
                  <div>
                    <strong>Campus Tour Map Preview</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '0.5rem' }}>
                      Google Map placeholder. Live maps can be integrated per client domains.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--accent-blue)', marginBottom: '1.5rem', fontWeight: 700 }}>Quick Inquiry Message</h3>
                <form onSubmit={handleApply}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Your Name"
                      value={admissionForm.student_name}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, student_name: e.target.value, parent_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
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
                      placeholder="Contact number"
                      value={admissionForm.phone}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message Details</label>
                    <textarea
                      required
                      className="form-textarea"
                      placeholder="Write your query details here..."
                      value={admissionForm.message}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, message: e.target.value })}
                    ></textarea>
                  </div>
                  <button type="submit" className="form-btn" disabled={admissionLoading}>
                    {admissionLoading ? 'Sending...' : 'Send Inquiry Message'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {currentView === 'login' && (
          <div className="form-container glass-panel" style={{ maxWidth: '450px' }}>
            <h2 className="form-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Lock size={26} /> Admin Login
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Sign in to manage student inquiries, edit notice boards, and view statistics.
            </p>

            {loginError && (
              <div className="form-alert error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

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
                {loginLoading ? 'Verifying Credentials...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        )}

        {currentView === 'admin' && isAuth && (
          <div className="admin-container">
            {/* Admin Header */}
            <div className="admin-header">
              <div className="admin-title-area">
                <span className="admin-badge-user" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={12} /> Admin: {adminUser}
                </span>
                <h2>Executive Administration Portal</h2>
              </div>
              <button className="nav-btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogOut size={16} /> Log Out
              </button>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{stats.totalAdmissions}</span>
                  <span className="admin-stat-label">Total Inquiries</span>
                </div>
                <div className="admin-stat-icon"><Mail size={36} color="var(--accent-blue)" /></div>
              </div>
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value" style={{ color: stats.pendingAdmissions > 0 ? 'var(--warning)' : 'inherit' }}>
                    {stats.pendingAdmissions}
                  </span>
                  <span className="admin-stat-label">Pending Reviews</span>
                </div>
                <div className="admin-stat-icon"><Clock size={36} color="var(--warning)" /></div>
              </div>
              <div className="admin-stat-card glass-panel">
                <div className="admin-stat-info">
                  <span className="admin-stat-value">{stats.totalAnnouncements}</span>
                  <span className="admin-stat-label">Notices Published</span>
                </div>
                <div className="admin-stat-icon"><Calendar size={36} color="var(--success)" /></div>
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
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>Student Admission Inquiries</h3>
                  <button className="btn-csv" onClick={handleExportCSV}>
                    <FileSpreadsheet size={16} /> Export to CSV (Excel)
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="admin-filters-bar">
                  <div className="admin-search-wrapper">
                    <div className="admin-search-icon">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder="Search name, parent or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select
                      className="admin-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <select
                      className="admin-filter-select"
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                    >
                      <option value="All">All Grades</option>
                      {gradeList.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {filteredAdmissions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No inquiries found matching the search filters.
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
                        {filteredAdmissions.map((adm) => (
                          <tr key={adm.id}>
                            <td>
                              <strong style={{ color: 'var(--accent-blue)' }}>{adm.student_name}</strong>
                              {adm.message && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '0.4rem', borderLeft: '2px solid var(--accent-gold)', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
                                  "{adm.message}"
                                </div>
                              )}
                            </td>
                            <td>{adm.parent_name}</td>
                            <td>
                              <div>{adm.email}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 600 }}>{adm.phone}</div>
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

                {/* SVG Visual Metrics Chart Dashboard */}
                <div className="admin-dashboard-metrics">
                  <div className="admin-chart-card">
                    <div className="chart-title">
                      <BarChart3 size={20} color="var(--accent-light-blue)" /> Inquiries Volume by Grade Level
                    </div>
                    <div className="chart-container">
                      {gradeList.map((grade, idx) => {
                        const count = gradeCounts[grade] || 0;
                        const heightPercent = (count / maxCount) * 80; // scale up to max 80% height
                        const labelShort = grade.replace("Grade ", "G").replace(" (Science)", " Sci").replace(" (Commerce)", " Com");
                        return (
                          <div key={idx} className="chart-bar-wrapper">
                            <div 
                              className="chart-bar" 
                              style={{ height: `${Math.max(heightPercent, 2)}%` }}
                              data-value={count}
                            ></div>
                            <span className="chart-label">{labelShort}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="admin-chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    <h4 style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>Quick Actions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <strong>Direct Export:</strong> Download all database inquiries in Excel CSV format for offline backups.
                      </div>
                      <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <strong> CBSE Verification:</strong> Registered details are fully synchronized with our CBSE administration backend pipelines.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Announcements editor */}
            {adminTab === 'announcements' && (
              <div className="ann-manager-layout">
                <div className="glass-panel ann-form-panel" style={{ borderRadius: '12px' }}>
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-blue)', fontWeight: 700 }}>Create Notice</h3>
                  
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

                    <button type="submit" className="form-btn" disabled={announcementLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <PlusCircle size={18} /> {announcementLoading ? 'Publishing Notice...' : 'Publish Update'}
                    </button>
                  </form>
                </div>

                <div className="ann-list-panel">
                  <h3 style={{ color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '0.5rem' }}>Active Notices</h3>
                  {announcements.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No announcements posted.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="ann-list-item glass-panel" style={{ borderRadius: '12px' }}>
                        <div className="ann-list-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                        <button className="ann-delete-btn" onClick={() => handleDeleteAnn(ann.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={14} /> Delete
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
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={28} color="var(--accent-gold)" /> Gourav <span>International School</span>
            </div>
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
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('faq'); }}>Frequently Asked Questions</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-title">Campus Contact</h4>
            <ul className="footer-links-list">
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={16} /> Sector 15, Gourav Educational Park, India</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Phone size={16} /> +91 99777 29994</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Mail size={16} /> info@gouravinternational.edu.in</li>
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
