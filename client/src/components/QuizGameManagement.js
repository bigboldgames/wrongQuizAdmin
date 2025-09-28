import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Play, 
  Users, 
  Trophy, 
  Eye, 
  Plus, 
  Trash2, 
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuizGameManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [friendsData, setFriendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const watchedQuizId = watch('quiz_id');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [quizzesResponse, languagesResponse] = await Promise.all([
        axios.get('/api/quizzes'),
        axios.get('/api/languages/active')
      ]);
      setQuizzes(quizzesResponse.data);
      setLanguages(languagesResponse.data);
      await fetchSessions();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      // Get all sessions from database
      const response = await axios.get('/api/quiz-game/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // If endpoint doesn't exist, create mock data
      setSessions([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('/api/quiz-game/create-session', data);
      toast.success('Quiz session created successfully!');
      reset();
      await fetchSessions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create quiz session';
      toast.error(message);
    }
  };

  const fetchSessionData = async (uniqueId) => {
    try {
      const response = await axios.get(`/api/quiz-game/session/${uniqueId}`);
      setSessionData(response.data);
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      toast.error('Failed to load session data');
    }
  };

  const fetchFriendsScores = async (uniqueId) => {
    try {
      const response = await axios.get(`/api/quiz-game/friends-scores/${uniqueId}`);
      setFriendsData(response.data);
    } catch (error) {
      console.error('Failed to fetch friends scores:', error);
      toast.error('Failed to load friends scores');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getLanguageName = (code) => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.native_name : code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Play className="w-8 h-8 text-indigo-600" />
          Quiz Game Management
        </h1>
        <p className="text-gray-600">Manage quiz sessions, view results, and track player performance</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'sessions', label: 'Quiz Sessions', icon: Play },
            { id: 'create', label: 'Create Session', icon: Plus },
            { id: 'results', label: 'Results & Scores', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Session Tab */}
      {activeTab === 'create' && (
        <div className="card animate-slideUp">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Quiz Session
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="form-label">Select Quiz</label>
                <select
                  className="form-select"
                  {...register('quiz_id', { required: 'Quiz is required' })}
                >
                  <option value="">Choose a quiz...</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
                {errors.quiz_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.quiz_id.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">User Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter user name"
                  {...register('user_name', { required: 'User name is required' })}
                />
                {errors.user_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  {...register('language_code', { required: 'Language is required' })}
                >
                  <option value="">Choose language...</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.native_name} ({lang.code})
                    </option>
                  ))}
                </select>
                {errors.language_code && (
                  <p className="text-red-500 text-sm mt-1">{errors.language_code.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                <Play className="w-4 h-4" />
                Create Quiz Session
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="btn btn-outline"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quiz Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="card animate-slideUp">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Quiz Sessions
                </h3>
                <button
                  onClick={fetchSessions}
                  className="btn btn-outline btn-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {sessions.length > 0 ? (
                <div className="grid gap-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{session.user_name}</h4>
                            <span className="text-sm text-gray-500">
                              {getLanguageName(session.language_code)}
                            </span>
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                              {session.unique_id}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Quiz ID: {session.quiz_id} • Created: {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedSession(session);
                              fetchSessionData(session.unique_id);
                            }}
                            className="btn btn-outline btn-sm"
                            title="View Session Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(session.unique_id)}
                            className="btn btn-outline btn-sm"
                            title="Copy Unique ID"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No quiz sessions found.</p>
                  <p className="text-sm mt-2">Create a new session to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          {selectedSession && sessionData && (
            <div className="card animate-fadeIn">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Session Details: {selectedSession.unique_id}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Session Info</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>User:</strong> {sessionData.data.session.user_name}</p>
                      <p><strong>Quiz:</strong> {sessionData.data.session.quiz_title}</p>
                      <p><strong>Language:</strong> {getLanguageName(sessionData.data.session.language_code)}</p>
                      <p><strong>Questions:</strong> {sessionData.data.questions.length}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Quiz URL</h4>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-2 rounded text-sm">
                        {window.location.origin}/quiz/{selectedSession.unique_id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/quiz/${selectedSession.unique_id}`)}
                        className="btn btn-outline btn-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Questions Preview</h4>
                  {sessionData.data.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Q{index + 1}:</span>
                        <span className="text-sm text-gray-500">{question.question_type}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{question.question_text}</p>
                      {question.media_url && (
                        <img src={question.media_url} alt="Question" className="w-32 h-20 object-cover rounded" />
                      )}
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Options: {question.options.length}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results & Scores Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="card animate-slideUp">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Quiz Results & Scores
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="form-label">Enter Quiz Session ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Enter unique quiz ID (e.g., A1B2C3D4)"
                    value={selectedSession?.unique_id || ''}
                    onChange={(e) => {
                      const session = sessions.find(s => s.unique_id === e.target.value);
                      setSelectedSession(session || null);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (selectedSession) {
                        fetchFriendsScores(selectedSession.unique_id);
                      }
                    }}
                    className="btn btn-primary"
                    disabled={!selectedSession}
                  >
                    <Trophy className="w-4 h-4" />
                    Get Scores
                  </button>
                </div>
              </div>

              {friendsData && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">Quiz Session: {friendsData.data.session.unique_id}</h4>
                    <p className="text-gray-600">Host: {friendsData.data.session.user_name}</p>
                  </div>

                  <div className="grid gap-4">
                    {friendsData.data.friends.map((friend, index) => (
                      <div key={friend.friend_name} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-semibold">{friend.friend_name}</h5>
                              <p className="text-sm text-gray-500">
                                {friend.total_answers} questions answered
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                              {friend.score_percentage}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {friend.correct_answers}/{friend.total_answers} correct
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${friend.score_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGameManagement;


