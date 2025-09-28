import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit, Save, X, HelpCircle, Image, Type, ChevronRight, Minus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuestionManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [questionContent, setQuestionContent] = useState({});
  const [optionsContent, setOptionsContent] = useState([{ content: {} }, { content: {} }, { content: {} }, { content: {} }]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();

  const watchedQuestionType = watch('question_type');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [quizzesResponse, languagesResponse] = await Promise.all([
        axios.get('/api/quizzes'),
        axios.get('/api/languages/active')
      ]);
      setQuizzes(quizzesResponse.data);
      setLanguages(languagesResponse.data);
      
      if (quizzesResponse.data.length > 0) {
        setSelectedQuiz(quizzesResponse.data[0].id.toString());
      }
      if (languagesResponse.data.length > 0) {
        setSelectedLanguage(languagesResponse.data[0].code);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedQuiz) return;
    
    try {
      const response = await axios.get(`/api/quizzes/${selectedQuiz}`);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load questions');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions();
    }
  }, [selectedQuiz]);

  const onSubmit = async (data) => {
    try {
      // Prepare content array from current state
      const content = Object.entries(questionContent).map(([langCode, content]) => ({
        language_code: langCode,
        question_text: content.question_text || '',
        media_url: content.media_url || null,
        explanation: content.explanation || null
      }));

      // Prepare options array from current state
      const options = optionsContent.map((option, index) => ({
        order_index: index + 1,
        is_correct: option.is_correct || false,
        content: Object.entries(option.content).map(([langCode, optContent]) => ({
          language_code: langCode,
          option_text: optContent.option_text || '',
          media_url: optContent.media_url || null
        }))
      }));

      const questionData = {
        quiz_id: parseInt(selectedQuiz),
        question_type: data.question_type,
        order_index: questions.length + 1,
        content,
        options
      };

      if (editingId) {
        await axios.put(`/api/questions/${editingId}`, questionData);
        toast.success('Question updated successfully');
        setEditingId(null);
      } else {
        await axios.post('/api/questions', questionData);
        toast.success('Question created successfully');
      }
      
      setShowAddForm(false);
      reset();
      setQuestionContent({});
      setOptionsContent([{ content: {} }, { content: {} }, { content: {} }, { content: {} }]);
      fetchQuestions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save question';
      toast.error(message);
    }
  };

  const handleEdit = (question) => {
    setEditingId(question.id);
    setValue('question_type', question.question_type);
    
    // Set question content
    const newQuestionContent = {};
    languages.forEach(lang => {
      const content = question.content[lang.code];
      if (content) {
        newQuestionContent[lang.code] = {
          question_text: content.question_text || '',
          media_url: content.media_url || '',
          explanation: content.explanation || ''
        };
      } else {
        newQuestionContent[lang.code] = {
          question_text: '',
          media_url: '',
          explanation: ''
        };
      }
    });
    setQuestionContent(newQuestionContent);

    // Set options
    const newOptionsContent = question.options.map(option => {
      const optionContent = {};
      languages.forEach(lang => {
        const content = option.content[lang.code];
        if (content) {
          optionContent[lang.code] = {
            option_text: content.option_text || '',
            media_url: content.media_url || ''
          };
        } else {
          optionContent[lang.code] = {
            option_text: '',
            media_url: ''
          };
        }
      });
      return {
        content: optionContent,
        is_correct: option.is_correct || false
      };
    });
    setOptionsContent(newOptionsContent);

    setShowAddForm(true);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setDeletingId(questionId);
      await axios.delete(`/api/questions/${questionId}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete question';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    reset();
    setQuestionContent({});
    setOptionsContent([{ content: {} }, { content: {} }, { content: {} }, { content: {} }]);
  };

  // Helper functions for managing content
  const updateQuestionContent = (field, value) => {
    setQuestionContent(prev => ({
      ...prev,
      [selectedLanguage]: {
        ...prev[selectedLanguage],
        [field]: value
      }
    }));
  };

  const updateOptionContent = (optionIndex, field, value) => {
    setOptionsContent(prev => {
      const newOptions = [...prev];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        content: {
          ...newOptions[optionIndex].content,
          [selectedLanguage]: {
            ...newOptions[optionIndex].content[selectedLanguage],
            [field]: value
          }
        }
      };
      return newOptions;
    });
  };


  const handleImageUpload = (type, optionIndex = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Create a local URL for the uploaded file
        const fileUrl = URL.createObjectURL(file);
        
        if (type === 'question') {
          updateQuestionContent('media_url', fileUrl);
        } else if (type === 'option' && optionIndex !== null) {
          updateOptionContent(optionIndex, 'media_url', fileUrl);
        }
        toast.success('Image uploaded successfully!');
      }
    };
    input.click();
  };

  const addOption = () => {
    setOptionsContent(prev => [...prev, { content: {} }]);
  };

  const removeOption = (index) => {
    if (optionsContent.length > 2) {
      setOptionsContent(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.error('At least 2 options are required');
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-indigo-600 animate-float" />
          <h2 className="text-2xl font-bold text-gray-900">Question Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary animate-bounceGentle"
          disabled={!selectedQuiz}
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Quiz Selection */}
      <div className="card mb-6 animate-slideUp">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Select Quiz
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {quizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => setSelectedQuiz(quiz.id.toString())}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                selectedQuiz === quiz.id.toString()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {quiz.title}
              {selectedQuiz === quiz.id.toString() && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Question Form */}
      {showAddForm && selectedQuiz && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">
              {editingId ? 'Edit Question' : 'Add New Question'}
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Question Type */}
            <div className="form-group">
              <label className="form-label">Question Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    className="form-radio"
                    {...register('question_type', { required: 'Question type is required' })}
                  />
                  <span className="ml-2 flex items-center">
                    <Type className="w-4 h-4 mr-1" />
                    Text Only
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="media"
                    className="form-radio"
                    {...register('question_type', { required: 'Question type is required' })}
                  />
                  <span className="ml-2 flex items-center">
                    <Image className="w-4 h-4 mr-1" />
                    Text + Media
                  </span>
                </label>
              </div>
              {errors.question_type && (
                <p className="error-message">{errors.question_type.message}</p>
              )}
            </div>

            {/* Language Selection */}
            <div className="form-group">
              <label className="form-label">Select Language to Add Content</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="form-input"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.native_name} ({language.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Language Content */}
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                {getLanguageName(selectedLanguage)} Content
              </h4>
              
              {/* Question Content */}
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder={`Enter question in ${getLanguageName(selectedLanguage)}`}
                  value={questionContent[selectedLanguage]?.question_text || ''}
                  onChange={(e) => updateQuestionContent('question_text', e.target.value)}
                />
              </div>

              {watchedQuestionType === 'media' && (
                <div className="form-group">
                  <label className="form-label">Question Media</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="form-input flex-1"
                        placeholder="Enter image URL or upload file"
                        value={questionContent[selectedLanguage]?.media_url || ''}
                        onChange={(e) => updateQuestionContent('media_url', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUpload('question')}
                        className="btn btn-outline"
                      >
                        <Image className="w-4 h-4" />
                        Upload Image
                      </button>
                    </div>
                    {questionContent[selectedLanguage]?.media_url && (
                      <div className="mt-2">
                        <img 
                          src={questionContent[selectedLanguage].media_url} 
                          alt="Question preview" 
                          className="w-48 h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Explanation (Optional)</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder={`Enter explanation in ${getLanguageName(selectedLanguage)}`}
                  value={questionContent[selectedLanguage]?.explanation || ''}
                  onChange={(e) => updateQuestionContent('explanation', e.target.value)}
                />
              </div>

              {/* Options */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Options</h5>
                  <button
                    type="button"
                    onClick={addOption}
                    className="btn btn-outline btn-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>
                {optionsContent.map((option, optionIndex) => (
                  <div key={optionIndex} className="border rounded-lg p-3 mb-3 bg-white animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={optionsContent[optionIndex]?.is_correct || false}
                            onChange={(e) => {
                              setOptionsContent(prev => {
                                const newOptions = [...prev];
                                newOptions[optionIndex] = {
                                  ...newOptions[optionIndex],
                                  is_correct: e.target.checked
                                };
                                return newOptions;
                              });
                            }}
                          />
                          <span className="font-medium">Option {optionIndex + 1}</span>
                          <span className="text-sm text-gray-500">(Mark as correct)</span>
                        </label>
                        {optionsContent[optionIndex]?.is_correct && (
                          <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                        )}
                      </div>
                      {optionsContent.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(optionIndex)}
                          className="btn btn-danger btn-sm"
                          title="Remove option"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Option Text</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`Option ${optionIndex + 1} in ${getLanguageName(selectedLanguage)}`}
                        value={optionsContent[optionIndex]?.content[selectedLanguage]?.option_text || ''}
                        onChange={(e) => updateOptionContent(optionIndex, 'option_text', e.target.value)}
                      />
                    </div>

                    {watchedQuestionType === 'media' && (
                      <div className="form-group">
                        <label className="form-label">Option Media</label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="url"
                              className="form-input flex-1"
                              placeholder="Enter image URL or upload file"
                              value={optionsContent[optionIndex]?.content[selectedLanguage]?.media_url || ''}
                              onChange={(e) => updateOptionContent(optionIndex, 'media_url', e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleImageUpload('option', optionIndex)}
                              className="btn btn-outline"
                            >
                              <Image className="w-4 h-4" />
                              Upload
                            </button>
                          </div>
                          {optionsContent[optionIndex]?.content[selectedLanguage]?.media_url && (
                            <div className="mt-2">
                              <img 
                                src={optionsContent[optionIndex].content[selectedLanguage].media_url} 
                                alt="Option preview" 
                                className="w-32 h-20 object-cover rounded border"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Language Progress */}
            <div className="mb-4">
              <h5 className="font-medium mb-2">Content Progress</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {languages.map((language) => {
                  const hasContent = questionContent[language.code]?.question_text;
                  const hasOptions = optionsContent.some(opt => opt.content[language.code]?.option_text);
                  return (
                    <div key={language.code} className={`p-2 rounded text-sm ${hasContent && hasOptions ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {language.native_name}
                      {hasContent && hasOptions && <span className="ml-1">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" />
                {editingId ? 'Update Question' : 'Create Question'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> You can mark multiple options as correct or leave all unchecked. 
                You can always edit the question later to set correct answers.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      {selectedQuiz && (
        <div className="card animate-slideUp">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {quizzes.find(q => q.id.toString() === selectedQuiz)?.title}
                <span className="text-indigo-600">({questions.length} questions)</span>
              </h3>
            </div>
          </div>
          
          {/* Question Tabs */}
          {questions.length > 0 ? (
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setSelectedQuestion(question)}
                    className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                      selectedQuestion?.id === question.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Q{index + 1}
                    {selectedQuestion?.id === question.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              
              {/* Selected Question Details */}
              {selectedQuestion && (
                <div className="border rounded-lg p-6 bg-gray-50 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Question {questions.findIndex(q => q.id === selectedQuestion.id) + 1}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(selectedQuestion)}
                        className="btn btn-outline btn-sm"
                        title="Edit question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedQuestion.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete question"
                        disabled={deletingId === selectedQuestion.id}
                      >
                        {deletingId === selectedQuestion.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Question Content</h5>
                            <div className="space-y-3">
                              {selectedQuestion.content && Object.entries(selectedQuestion.content).map(([langCode, content]) => (
                                <div key={langCode} className="flex items-start gap-3">
                                  <span className="text-sm font-medium w-16 mt-1">{langCode}:</span>
                                  <div className="flex-1">
                                    <span className="text-gray-700">{content.question_text}</span>
                                    {content.media_url && (
                                      <div className="mt-2">
                                        <img 
                                          src={content.media_url} 
                                          alt="Question image"
                                          className="w-32 h-20 object-cover rounded border"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                    {content.explanation && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                        <strong>Explanation:</strong> {content.explanation}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-2">Options</h5>
                      <div className="space-y-3">
                        {selectedQuestion.options && selectedQuestion.options.map((option, index) => (
                          <div key={option.id} className={`p-3 rounded-lg ${option.is_correct ? 'bg-green-100 border border-green-300' : 'bg-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">Option {index + 1}</span>
                              {option.is_correct && <span className="text-green-600 text-sm">✓ Correct</span>}
                            </div>
                            <div className="space-y-2">
                              {option.content && Object.entries(option.content).map(([langCode, optContent]) => (
                                <div key={langCode} className="flex items-start gap-3">
                                  <span className="text-sm font-medium w-16 mt-1">{langCode}:</span>
                                  <div className="flex-1">
                                    <span className="text-gray-700">{optContent.option_text}</span>
                                    {optContent.media_url && (
                                      <div className="mt-2">
                                        <img 
                                          src={optContent.media_url} 
                                          alt={`Option ${index + 1} image`}
                                          className="w-24 h-16 object-cover rounded border"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No questions found for this quiz.</p>
              <p className="text-sm mt-2">Click "Add Question" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
