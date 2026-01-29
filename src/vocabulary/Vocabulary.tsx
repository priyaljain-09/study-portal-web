import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import {
  useGetVocabularyTodayQuery,
  useGetVocabularyHistoryQuery,
  useSubmitVocabularyMutation,
} from '../redux/api/vocabularyApi';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { BookOpen, Plus, X } from 'lucide-react';

const Vocabulary = () => {
  const navigate = useNavigate();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const { data: todayWord, isLoading: isLoadingToday } = useGetVocabularyTodayQuery();
  const { data: historyData, isLoading: isLoadingHistory } = useGetVocabularyHistoryQuery({ limit: 10 });
  const [submitVocabulary, { isLoading: isSubmitting }] = useSubmitVocabularyMutation();

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    part_of_speech: '',
    example: '',
  });

  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const handleBackPress = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitVocabulary(formData).unwrap();
      setFormData({ word: '', definition: '', part_of_speech: '', example: '' });
      setShowSubmitForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const historyWords = historyData?.results || [];

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activePath="/vocabulary" />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBackPress}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Vocabulary</h1>
                <p className="text-sm text-gray-600">Learn new words every day</p>
              </div>
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Submit Word</span>
              </button>
            </div>

            {/* Submit Form */}
            {showSubmitForm && (
              <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Submit New Vocabulary Word</h2>
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Word <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.word}
                      onChange={(e) => handleInputChange('word', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter word"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Definition <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.definition}
                      onChange={(e) => handleInputChange('definition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter definition"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part of Speech <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.part_of_speech}
                      onChange={(e) => handleInputChange('part_of_speech', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., noun, verb, adjective"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Example <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.example}
                      onChange={(e) => handleInputChange('example', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter example sentence"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmitForm(false);
                        setFormData({ word: '', definition: '', part_of_speech: '', example: '' });
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Word of the Day */}
            {isLoadingToday ? (
              <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : todayWord ? (
              <div className="mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Word of the Day</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{todayWord.word}</h3>
                    <p className="text-sm opacity-90">{todayWord.part_of_speech}</p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">{todayWord.definition}</p>
                  </div>
                  {todayWord.example && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-sm font-medium mb-1">Example:</p>
                      <p className="text-base italic">{todayWord.example}</p>
                    </div>
                  )}
                  <div className="text-xs opacity-75 mt-4">
                    Submitted by {todayWord.created_by?.username || 'Teacher'} •{' '}
                    {new Date(todayWord.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* History - Top 10 Words */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Words</h2>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : historyWords.length > 0 ? (
                <div className="space-y-4">
                  {historyWords.map((word) => (
                    <div
                      key={word.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                          <p className="text-sm text-gray-500">{word.part_of_speech}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(word.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{word.definition}</p>
                      {word.example && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Example:</p>
                          <p className="text-sm text-gray-600 italic">{word.example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No vocabulary words yet.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Vocabulary;



