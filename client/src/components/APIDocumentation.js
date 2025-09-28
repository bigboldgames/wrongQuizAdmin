import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Code,
  Database,
  Globe,
  Users,
  FileText,
  HelpCircle,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const APIDocumentation = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedMethod, setSelectedMethod] = useState('GET');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const apiEndpoints = [
    {
      category: 'Authentication',
      icon: Users,
      color: 'text-blue-600',
      endpoints: [
        {
          method: 'POST',
          url: '/api/auth/login',
          description: 'User login',
          requestBody: {
            username: 'string (required)',
            password: 'string (required)'
          },
          response: {
            success: true,
            message: 'Login successful',
            token: 'JWT_TOKEN',
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin'
            }
          },
          example: {
            request: {
              username: 'admin',
              password: 'admin123'
            },
            response: {
              success: true,
              message: 'Login successful',
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin'
              }
            }
          }
        },
        {
          method: 'POST',
          url: '/api/auth/logout',
          description: 'User logout',
          headers: {
            'Authorization': 'Bearer JWT_TOKEN (required)'
          },
          response: {
            success: true,
            message: 'Logout successful'
          }
        },
        {
          method: 'GET',
          url: '/api/auth/me',
          description: 'Get current user info',
          headers: {
            'Authorization': 'Bearer JWT_TOKEN (required)'
          },
          response: {
            success: true,
            user: {
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin'
            }
          }
        }
      ]
    },
    {
      category: 'Languages',
      icon: Globe,
      color: 'text-green-600',
      endpoints: [
        {
          method: 'GET',
          url: '/api/languages',
          description: 'Get all languages',
          response: {
            success: true,
            data: [
              {
                id: 1,
                code: 'en',
                name: 'English',
                native_name: 'English',
                is_active: true
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/languages/active',
          description: 'Get active languages only',
          response: {
            success: true,
            data: [
              {
                id: 1,
                code: 'en',
                name: 'English',
                native_name: 'English',
                is_active: true
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/languages/:code',
          description: 'Get language by code',
          response: {
            success: true,
            data: {
              id: 1,
              code: 'en',
              name: 'English',
              native_name: 'English',
              is_active: true
            }
          }
        },
        {
          method: 'POST',
          url: '/api/languages',
          description: 'Create new language',
          requestBody: {
            code: 'string (required)',
            name: 'string (required)',
            native_name: 'string (required)',
            is_active: 'boolean (optional, default: true)'
          },
          response: {
            success: true,
            message: 'Language created successfully',
            data: {
              id: 2,
              code: 'es',
              name: 'Spanish',
              native_name: 'Español',
              is_active: true
            }
          }
        },
        {
          method: 'PUT',
          url: '/api/languages/:id',
          description: 'Update language',
          requestBody: {
            code: 'string (optional)',
            name: 'string (optional)',
            native_name: 'string (optional)',
            is_active: 'boolean (optional)'
          },
          response: {
            success: true,
            message: 'Language updated successfully'
          }
        },
        {
          method: 'DELETE',
          url: '/api/languages/:id',
          description: 'Delete language',
          response: {
            success: true,
            message: 'Language deleted successfully'
          }
        }
      ]
    },
    {
      category: 'Content Management',
      icon: FileText,
      color: 'text-purple-600',
      endpoints: [
        {
          method: 'GET',
          url: '/api/content/all',
          description: 'Get all page content in one call (organized by page and language)',
          response: {
            success: true,
            data: {
              home: {
                page_title: 'Home Page',
                languages: {
                  en: {
                    language_name: 'English',
                    sections: {
                      hero: {
                        title: {
                          id: 1,
                          content: 'Welcome to Our Platform',
                          created_at: '2025-09-27 06:05:14',
                          updated_at: '2025-09-27 06:05:14'
                        }
                      }
                    }
                  }
                }
              }
            },
            total_items: 13
          }
        },
        {
          method: 'GET',
          url: '/api/content/simple',
          description: 'Get all page content in simplified format - Page: {attribute: {content: "value"}}',
          response: {
            success: true,
            data: {
              home: {
                hero_title: {
                  content: 'Welcome to Our Platform',
                  language: 'en',
                  language_name: 'English'
                },
                hero_subtitle: {
                  content: 'Build amazing things with our tools',
                  language: 'en',
                  language_name: 'English'
                }
              },
              about: {
                main_title: {
                  content: 'About Our Company',
                  language: 'en',
                  language_name: 'English'
                }
              }
            },
            total_items: 13
          }
        },
        {
          method: 'GET',
          url: '/api/content/simple/:languageCode',
          description: 'Get page content for specific language in simplified format',
          response: {
            success: true,
            language_code: 'en',
            language_name: 'English',
            data: {
              home: {
                hero_title: {
                  content: 'Welcome to Our Platform'
                },
                hero_subtitle: {
                  content: 'Build amazing things with our tools'
                }
              },
              about: {
                main_title: {
                  content: 'About Our Company'
                }
              }
            },
            total_items: 5
          }
        },
        {
          method: 'GET',
          url: '/api/content',
          description: 'Get all content (alternative endpoint)',
          queryParams: {
            page: 'string (optional)',
            section: 'string (optional)',
            key: 'string (optional)',
            language_code: 'string (optional)'
          },
          response: {
            success: true,
            data: [
              {
                id: 1,
                page: 'home',
                section: 'hero',
                key: 'title',
                language_code: 'en',
                content: 'Welcome to our platform',
                created_at: '2024-01-01T00:00:00.000Z'
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/content/:page/:section/:key/:language_code',
          description: 'Get specific content',
          response: {
            success: true,
            data: {
              id: 1,
              page: 'home',
              section: 'hero',
              key: 'title',
              language_code: 'en',
              content: 'Welcome to our platform',
              created_at: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        {
          method: 'POST',
          url: '/api/content',
          description: 'Create new content',
          requestBody: {
            page: 'string (required)',
            section: 'string (required)',
            key: 'string (required)',
            language_code: 'string (required)',
            content: 'string (required)'
          },
          response: {
            success: true,
            message: 'Content created successfully'
          }
        },
        {
          method: 'PUT',
          url: '/api/content/:id',
          description: 'Update content',
          requestBody: {
            page: 'string (optional)',
            section: 'string (optional)',
            key: 'string (optional)',
            language_code: 'string (optional)',
            content: 'string (optional)'
          },
          response: {
            success: true,
            message: 'Content updated successfully'
          }
        },
        {
          method: 'DELETE',
          url: '/api/content/:id',
          description: 'Delete content',
          response: {
            success: true,
            message: 'Content deleted successfully'
          }
        }
      ]
    },
    {
      category: 'Quizzes',
      icon: BookOpen,
      color: 'text-orange-600',
      endpoints: [
        {
          method: 'GET',
          url: '/api/quizzes',
          description: 'Get all quizzes',
          response: {
            success: true,
            data: [
              {
                id: 1,
                title: 'General Knowledge Quiz',
                description: 'Test your general knowledge',
                is_active: true,
                created_at: '2024-01-01T00:00:00.000Z'
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/quizzes/:id',
          description: 'Get quiz by ID',
          response: {
            success: true,
            data: {
              id: 1,
              title: 'General Knowledge Quiz',
              description: 'Test your general knowledge',
              is_active: true,
              created_at: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        {
          method: 'POST',
          url: '/api/quizzes',
          description: 'Create new quiz',
          requestBody: {
            title: 'string (required)',
            description: 'string (required)',
            is_active: 'boolean (optional, default: true)'
          },
          response: {
            success: true,
            message: 'Quiz created successfully',
            data: {
              id: 2,
              title: 'Science Quiz',
              description: 'Test your science knowledge',
              is_active: true
            }
          }
        },
        {
          method: 'PUT',
          url: '/api/quizzes/:id',
          description: 'Update quiz',
          requestBody: {
            title: 'string (optional)',
            description: 'string (optional)',
            is_active: 'boolean (optional)'
          },
          response: {
            success: true,
            message: 'Quiz updated successfully'
          }
        },
        {
          method: 'DELETE',
          url: '/api/quizzes/:id',
          description: 'Delete quiz',
          response: {
            success: true,
            message: 'Quiz deleted successfully'
          }
        }
      ]
    },
    {
      category: 'Questions',
      icon: HelpCircle,
      color: 'text-indigo-600',
      endpoints: [
        {
          method: 'GET',
          url: '/api/questions',
          description: 'Get all questions',
          queryParams: {
            quiz_id: 'number (optional)'
          },
          response: {
            success: true,
            data: [
              {
                id: 1,
                quiz_id: 1,
                question_type: 'text',
                content: {
                  en: {
                    question_text: 'What is the capital of France?',
                    explanation: 'Paris is the capital of France'
                  }
                },
                options: [
                  {
                    id: 1,
                    question_id: 1,
                    is_correct: true,
                    content: {
                      en: {
                        option_text: 'Paris',
                        media_url: null
                      }
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/questions/:id',
          description: 'Get question by ID',
          response: {
            success: true,
            data: {
              id: 1,
              quiz_id: 1,
              question_type: 'text',
              content: {
                en: {
                  question_text: 'What is the capital of France?',
                  explanation: 'Paris is the capital of France'
                }
              },
              options: [
                {
                  id: 1,
                  question_id: 1,
                  is_correct: true,
                  content: {
                    en: {
                      option_text: 'Paris',
                      media_url: null
                    }
                  }
                }
              ]
            }
          }
        },
        {
          method: 'POST',
          url: '/api/questions',
          description: 'Create new question',
          requestBody: {
            quiz_id: 'number (required)',
            question_type: 'string (required, text|media)',
            content: 'object (required)',
            options: 'array (required, min 2)'
          },
          response: {
            success: true,
            message: 'Question created successfully'
          }
        },
        {
          method: 'PUT',
          url: '/api/questions/:id',
          description: 'Update question',
          requestBody: {
            quiz_id: 'number (optional)',
            question_type: 'string (optional)',
            content: 'object (optional)',
            options: 'array (optional)'
          },
          response: {
            success: true,
            message: 'Question updated successfully'
          }
        },
        {
          method: 'DELETE',
          url: '/api/questions/:id',
          description: 'Delete question',
          response: {
            success: true,
            message: 'Question deleted successfully'
          }
        }
      ]
    },
    {
      category: 'Quiz Game',
      icon: Play,
      color: 'text-red-600',
      endpoints: [
        {
          method: 'POST',
          url: '/api/quiz-game/create-session',
          description: 'Create new quiz session',
          requestBody: {
            quiz_id: 'number (required)',
            user_name: 'string (required)',
            language_code: 'string (required)'
          },
          response: {
            success: true,
            message: 'Quiz session created successfully',
            data: {
              session_id: 1,
              unique_id: 'A1B2C3D4',
              quiz_id: 1,
              user_name: 'John Doe',
              language_code: 'en'
            }
          }
        },
        {
          method: 'GET',
          url: '/api/quiz-game/sessions',
          description: 'Get all quiz sessions (Admin only)',
          response: {
            success: true,
            data: [
              {
                id: 1,
                quiz_id: 1,
                unique_id: 'A1B2C3D4',
                user_name: 'John Doe',
                language_code: 'en',
                quiz_title: 'General Knowledge Quiz',
                is_active: true,
                created_at: '2024-01-01T00:00:00.000Z'
              }
            ]
          }
        },
        {
          method: 'GET',
          url: '/api/quiz-game/session/:unique_id',
          description: 'Get quiz session details',
          response: {
            success: true,
            data: {
              session: {
                id: 1,
                unique_id: 'A1B2C3D4',
                user_name: 'John Doe',
                language_code: 'en',
                quiz_title: 'General Knowledge Quiz'
              },
              questions: [
                {
                  id: 1,
                  question_type: 'text',
                  question_text: 'What is the capital of France?',
                  media_url: null,
                  options: [
                    {
                      id: 1,
                      option_text: 'Paris',
                      media_url: null,
                      is_correct: true
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          method: 'POST',
          url: '/api/quiz-game/add-friend',
          description: 'Add friend to quiz session',
          requestBody: {
            unique_id: 'string (required)',
            friend_name: 'string (required)'
          },
          response: {
            success: true,
            message: 'Friend added successfully'
          }
        },
        {
          method: 'POST',
          url: '/api/quiz-game/save-answer',
          description: 'Save friend answer',
          requestBody: {
            unique_id: 'string (required)',
            friend_name: 'string (required)',
            question_id: 'number (required)',
            selected_option_id: 'number (required)'
          },
          response: {
            success: true,
            message: 'Answer saved successfully',
            data: {
              is_correct: true,
              correct_option_id: 1
            }
          }
        },
        {
          method: 'GET',
          url: '/api/quiz-game/friends-scores/:unique_id',
          description: 'Get friends scores',
          response: {
            success: true,
            data: {
              session: {
                unique_id: 'A1B2C3D4',
                user_name: 'John Doe'
              },
              friends: [
                {
                  friend_name: 'Alice',
                  total_answers: 5,
                  correct_answers: 4,
                  score_percentage: 80
                }
              ]
            }
          }
        },
        {
          method: 'GET',
          url: '/api/quiz-game/view-answers/:unique_id/:friend_name',
          description: 'View friend answers',
          response: {
            success: true,
            data: {
              friend_name: 'Alice',
              answers: [
                {
                  question_id: 1,
                  question_text: 'What is the capital of France?',
                  selected_option: 'Paris',
                  correct_option: 'Paris',
                  is_correct: true
                }
              ]
            }
          }
        },
        {
          method: 'GET',
          url: '/api/quiz-game/friends/:unique_id',
          description: 'Get session friends',
          response: {
            success: true,
            data: [
              {
                id: 1,
                friend_name: 'Alice',
                is_active: true,
                created_at: '2024-01-01T00:00:00.000Z'
              }
            ]
          }
        }
      ]
    },
    {
      category: 'Health Check',
      icon: CheckCircle,
      color: 'text-green-600',
      endpoints: [
        {
          method: 'GET',
          url: '/api/health',
          description: 'Server health check',
          response: {
            status: 'OK',
            timestamp: '2024-01-01T00:00:00.000Z'
          }
        }
      ]
    }
  ];

  const renderJsonExample = (data) => {
    return (
      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          API Documentation
        </h1>
        <p className="text-gray-600">Complete API reference for the Admin Panel and Quiz Game system</p>
      </div>

      {/* Base URL */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Base URL
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono">
              http://localhost:5000
            </code>
            <button
              onClick={() => copyToClipboard('http://localhost:5000')}
              className="btn btn-outline btn-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="space-y-6">
        {apiEndpoints.map((category, categoryIndex) => (
          <div key={categoryIndex} className="card">
            <div 
              className="card-header cursor-pointer"
              onClick={() => toggleSection(categoryIndex)}
            >
              <div className="flex items-center justify-between">
                <h3 className="card-title flex items-center gap-2">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  {category.category}
                </h3>
                {expandedSections[categoryIndex] ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>

            {expandedSections[categoryIndex] && (
              <div className="p-6 space-y-6">
                {category.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                        {endpoint.url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`http://localhost:5000${endpoint.url}`)}
                        className="btn btn-outline btn-xs"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-gray-700 mb-3">{endpoint.description}</p>

                    {/* Request Body */}
                    {endpoint.requestBody && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Database className="w-4 h-4" />
                          Request Body
                        </h5>
                        {renderJsonExample(endpoint.requestBody)}
                      </div>
                    )}

                    {/* Headers */}
                    {endpoint.headers && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          Headers
                        </h5>
                        {renderJsonExample(endpoint.headers)}
                      </div>
                    )}

                    {/* Query Parameters */}
                    {endpoint.queryParams && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          Query Parameters
                        </h5>
                        {renderJsonExample(endpoint.queryParams)}
                      </div>
                    )}

                    {/* Response */}
                    {endpoint.response && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Response
                        </h5>
                        {renderJsonExample(endpoint.response)}
                      </div>
                    )}

                    {/* Example */}
                    {endpoint.example && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          Example
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <h6 className="text-xs font-medium text-gray-600 mb-1">Request:</h6>
                            {renderJsonExample(endpoint.example.request)}
                          </div>
                          <div>
                            <h6 className="text-xs font-medium text-gray-600 mb-1">Response:</h6>
                            {renderJsonExample(endpoint.example.response)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Authentication Info */}
      <div className="card mt-8">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Authentication
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">JWT Token Authentication</h5>
              <p className="text-gray-600 text-sm mb-2">
                Most endpoints require authentication. Include the JWT token in the Authorization header:
              </p>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                Authorization: Bearer YOUR_JWT_TOKEN
              </code>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Default Admin Credentials</h5>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm"><strong>Username:</strong> admin</p>
                <p className="text-sm"><strong>Password:</strong> admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;
