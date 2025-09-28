import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  LogOut, 
  Menu,
  X,
  User,
  AlertCircle,
  CheckCircle,
  Info,
  Globe,
  FileText,
  BookOpen,
  HelpCircle,
  Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UsersManagement from '../components/UsersManagement';
import LanguageManagement from '../components/LanguageManagement';
import ContentManagement from '../components/ContentManagement';
import QuizManagement from '../components/QuizManagement';
import QuestionManagement from '../components/QuestionManagement';
import QuizGameManagement from '../components/QuizGameManagement';
import APIDocumentation from '../components/APIDocumentation';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lastUpdated: null
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/activity')
      ]);

      setStats(statsResponse.data);
      setActivity(activityResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Languages', href: '/dashboard/languages', icon: Globe },
    { name: 'Content', href: '/dashboard/content', icon: FileText },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: BookOpen },
    { name: 'Questions', href: '/dashboard/questions', icon: HelpCircle },
    { name: 'Quiz Game', href: '/dashboard/quiz-game', icon: Play },
    { name: 'API Docs', href: '/dashboard/api-docs', icon: BookOpen },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
      case 'user_login':
        return <User className="w-4 h-4" />;
      case 'order_created':
      case 'payment_received':
        return <CheckCircle className="w-4 h-4" />;
      case 'system_warning':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getActivityIconClass = (severity) => {
    switch (severity) {
      case 'success':
        return 'activity-icon success';
      case 'warning':
        return 'activity-icon warning';
      default:
        return 'activity-icon info';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="header-title">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="user-menu">
            <div className="user-info">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <Routes>
          <Route path="/" element={<UsersManagement />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/languages" element={<LanguageManagement />} />
          <Route path="/content" element={<ContentManagement />} />
          <Route path="/quizzes" element={<QuizManagement />} />
          <Route path="/questions" element={<QuestionManagement />} />
          <Route path="/quiz-game" element={<QuizGameManagement />} />
          <Route path="/api-docs" element={<APIDocumentation />} />
        </Routes>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
