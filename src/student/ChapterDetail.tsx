import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useGetChapterByIdQuery } from '../redux/api/moduleApi';
import HTMLContentViewer from '../components/HTMLContentViewer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ChapterDetail = () => {
  const { subjectId, chapterId } = useParams<{ subjectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  // Get data from location state
  const { chapter, module, subjectName } = location.state || {};

  // Get chapters from the current module only (not all modules)
  const moduleChapters = useMemo(() => {
    if (module?.chapters && Array.isArray(module.chapters)) {
      return [...module.chapters].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }
    return [];
  }, [module]);

  // Find current chapter index within the module
  const chapterIndex = useMemo(() => {
    if (chapterId && moduleChapters.length > 0) {
      const index = moduleChapters.findIndex((ch: any) => ch.id === Number(chapterId));
      return index >= 0 ? index : 0;
    }
    return 0;
  }, [chapterId, moduleChapters]);

  const { data: chapterDetail, isLoading } = useGetChapterByIdQuery(Number(chapterId), {
    skip: !chapterId,
  });

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const canGoToPrevious = chapterIndex > 0;
  const canGoToNext = moduleChapters.length > 0 && chapterIndex < moduleChapters.length - 1;

  const goToPreviousChapter = () => {
    if (canGoToPrevious && moduleChapters.length > 0) {
      const previousChapter = moduleChapters[chapterIndex - 1];
      navigate(`/subject/${subjectId}/chapter/${previousChapter.id}`, {
        state: {
          chapter: previousChapter,
          module,
          subjectName,
        },
        replace: true,
      });
    }
  };

  const goToNextChapter = () => {
    if (canGoToNext && moduleChapters.length > 0) {
      const nextChapter = moduleChapters[chapterIndex + 1];
      navigate(`/subject/${subjectId}/chapter/${nextChapter.id}`, {
        state: {
          chapter: nextChapter,
          module,
          subjectName,
        },
        replace: true,
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activePath={`/subject/${subjectId}`} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => navigate(`/subject/${subjectId}`)}
        />

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white" style={{ paddingBottom: '80px' }}>
          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : chapterDetail ? (
              <>
                {/* Chapter Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {chapterDetail.name}
                </h1>

                {/* Chapter Content */}
                <div>
                  {chapterDetail.description ? (
                    <HTMLContentViewer html={chapterDetail.description} textColor="#444" />
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-gray-500 text-lg">No content available for this chapter.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-lg">Chapter not found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-8 py-4 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousChapter}
              disabled={!canGoToPrevious}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
                canGoToPrevious
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-semibold">Previous</span>
            </button>

            <div className="text-sm text-gray-600">
              {moduleChapters.length > 0 && (
                <span>
                  {chapterIndex + 1} of {moduleChapters.length}
                </span>
              )}
            </div>

            <button
              onClick={goToNextChapter}
              disabled={!canGoToNext}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
                canGoToNext
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="font-semibold">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterDetail;

