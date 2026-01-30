import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  useGetModulesBySubjectQuery, 
  useGetModulesBySubjectAndClassroomQuery 
} from '../redux/api/moduleApi';
import ModulesList from '../components/modules/ModulesList';
import DiscussionList from '../components/discussions/DiscussionList';
import AnnouncementList from '../components/announcements/AnnouncementList';
import SyllabusList from '../components/syllabus/SyllabusList';
import PeopleList from '../components/people/PeopleList';
import AssignmentList from '../components/assignments/AssignmentList';
import GradesList from '../components/grades/GradesList';
import { BookOpen, MessageSquare, Bell, FileText, Award, Users, ClipboardList } from 'lucide-react';

const SubjectDetail = () => {
  const { subjectId, classroomId: classroomIdParam } = useParams<{ subjectId: string; classroomId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';
  const dashboardData = useAppSelector((state) => state.dashboard.allSubjects) as any;
  const teacherDashboardData = useAppSelector((state) => state.dashboard.teacherDashboardData) as any;
  
  // Get active tab from URL query parameter or default to 'module'
  const tabFromQuery = searchParams.get('tab') as 'module' | 'discussion' | 'announcement' | 'syllabus' | 'grades' | 'people' | 'assignment' | null;
  const [activeTab, setActiveTab] = useState<'module' | 'discussion' | 'announcement' | 'syllabus' | 'grades' | 'people' | 'assignment'>(
    tabFromQuery || 'module'
  );

  // Update URL when tab changes (but not on initial load if query param exists)
  useEffect(() => {
    if (tabFromQuery && tabFromQuery === activeTab) {
      // Tab matches query param, no need to update
      return;
    }
    if (!tabFromQuery && activeTab === 'module') {
      // Default state, no need to update URL
      return;
    }
    setSearchParams({ tab: activeTab });
  }, [activeTab, tabFromQuery, setSearchParams]);

  // Update active tab when query parameter changes (only if different)
  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Get subject name and color from dashboard data or location state
  const subjectName = useMemo(() => {
    if (location.state?.subjectName) {
      return location.state.subjectName;
    }
    if (dashboardData?.subjects && Array.isArray(dashboardData.subjects)) {
      const subject = dashboardData.subjects.find((s: any) => s.id === Number(subjectId));
      return subject?.name || 'Subject';
    }
    return 'Subject';
  }, [location.state, dashboardData, subjectId]);

  const subjectColor = useMemo(() => {
    if (dashboardData?.subjects && Array.isArray(dashboardData.subjects)) {
      const subject = dashboardData.subjects.find((s: any) => s.id === Number(subjectId));
      return subject?.color || '#8B5CF6'; // Default purple color
    }
    return '#8B5CF6';
  }, [dashboardData, subjectId]);

  // Get classroomId from URL params, location state, or dashboard data (for teachers)
  const classroomId = useMemo(() => {
    // First try URL params (for teacher routes)
    if (classroomIdParam) {
      return Number(classroomIdParam);
    }
    // Then try location state
    if (location.state?.classroomId) {
      return location.state.classroomId;
    }
    // If not in location state, try to get from teacher dashboard data
    if (userRole === 'teacher' && teacherDashboardData?.classes && Array.isArray(teacherDashboardData.classes)) {
      const classItem = teacherDashboardData.classes.find(
        (c: any) => c.subject_id === Number(subjectId)
      );
      if (classItem?.classroom_id) {
        return classItem.classroom_id;
      }
    }
    return undefined;
  }, [classroomIdParam, location.state, userRole, subjectId, teacherDashboardData]);

  // Helper function to get the correct route path based on user role
  const getRoutePath = (path: string) => {
    if (userRole === 'teacher' && classroomId) {
      return `/classroom/${classroomId}${path}`;
    }
    return path;
  };

  // Use different query based on user role
  const { data: studentModules, isLoading: studentModulesLoading } = useGetModulesBySubjectQuery(
    { subjectId: Number(subjectId) },
    { skip: !subjectId || activeTab !== 'module' || userRole === 'teacher' }
  );

  const { data: teacherModules, isLoading: teacherModulesLoading } = useGetModulesBySubjectAndClassroomQuery(
    { subjectId: Number(subjectId), classroomId: classroomId || 0 },
    { skip: !subjectId || activeTab !== 'module' || userRole !== 'teacher' || !classroomId }
  );

  const modulesResponse = userRole === 'teacher' ? teacherModules : studentModules;
  const modulesLoading = userRole === 'teacher' ? teacherModulesLoading : studentModulesLoading;
  // Handle both array response and object with modules property
  const modules = Array.isArray(modulesResponse) 
    ? modulesResponse 
    : (modulesResponse?.modules || []);

  const tabs = [
    { id: 'module' as const, label: 'Module', icon: BookOpen },
    { id: 'discussion' as const, label: 'Discussion', icon: MessageSquare },
    { id: 'announcement' as const, label: 'Announcement', icon: Bell },
    { id: 'syllabus' as const, label: 'Syllabus', icon: FileText },
    { id: 'grades' as const, label: 'Grades', icon: Award },
    { id: 'people' as const, label: 'People', icon: Users },
    { id: 'assignment' as const, label: 'Assignment', icon: ClipboardList },
  ];

  const userInitial = userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'module':
        return (
          <ModulesList
            modules={modules}
            isLoading={modulesLoading}
            userRole={userRole}
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            onAddModule={() => {
              navigate(getRoutePath(`/subject/${subjectId}/add-module`), {
                state: { subjectName, classroomId }
              });
            }}
            onChapterClick={(chapter, module) => {
              // Navigate to chapter detail page - only pass module (which contains its chapters)
              navigate(getRoutePath(`/subject/${subjectId}/chapter/${chapter.id}`), {
                state: { 
                  chapter, 
                  module, 
                  subjectName,
                  classroomId
                }
              });
            }}
            onAddChapter={(module) => {
              navigate(getRoutePath(`/subject/${subjectId}/add-chapter`), {
                state: { module, subjectName, classroomId, isEditMode: false }
              });
            }}
            onEditChapter={(chapter, module) => {
              navigate(getRoutePath(`/subject/${subjectId}/add-chapter`), {
                state: { chapter, module, subjectName, classroomId, isEditMode: true }
              });
            }}
          />
        );

      case 'discussion':
        return (
          <DiscussionList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            subjectName={subjectName}
            onAddDiscussion={() => {
              navigate(getRoutePath(`/subject/${subjectId}/add-discussion?tab=discussion`), {
                state: { subjectName, classroomId }
              });
            }}
            onDiscussionClick={(discussion) => {
              // Navigate to discussion detail page
              navigate(getRoutePath(`/subject/${subjectId}/discussion/${discussion.id}`), {
                state: { discussion, subjectName, classroomId }
              });
            }}
          />
        );

      case 'announcement':
        return (
          <AnnouncementList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            subjectName={subjectName}
            onAddAnnouncement={() => {
              navigate(getRoutePath(`/subject/${subjectId}/add-announcement?tab=announcement`), {
                state: { subjectName, classroomId }
              });
            }}
            onAnnouncementClick={(announcement) => {
              // Navigate to announcement detail page
              navigate(getRoutePath(`/subject/${subjectId}/announcement/${announcement.id}`), {
                state: { announcement, subjectName, classroomId }
              });
            }}
            onEditAnnouncement={(announcement) => {
              navigate(getRoutePath(`/subject/${subjectId}/edit-announcement/${announcement.id}?tab=announcement`), {
                state: { announcement, subjectName, classroomId }
              });
            }}
          />
        );

      case 'syllabus':
        return (
          <SyllabusList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            onAddSyllabus={() => {
              navigate(getRoutePath(`/subject/${subjectId}/add-syllabus?tab=syllabus`), {
                state: { subjectName, classroomId }
              });
            }}
            onEditSyllabus={(item) => {
              navigate(getRoutePath(`/subject/${subjectId}/edit-syllabus/${item.id}?tab=syllabus`), {
                state: { 
                  syllabusData: item, 
                  subjectName, 
                  classroomId,
                  isEditMode: true
                }
              });
            }}
          />
        );

      case 'grades':
        return (
          <GradesList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            courseColor={subjectColor}
            onAssignmentClick={(assignment) => {
              navigate(getRoutePath(`/subject/${subjectId}/assignment/${assignment.id}/grades`), {
                state: { 
                  assignment, 
                  subjectName, 
                  classroomId,
                  courseColor: subjectColor,
                  course: { id: Number(subjectId), title: subjectName, color: subjectColor }
                }
              });
            }}
            onGradeClick={(grade) => {
              navigate(`/subject/${subjectId}/grade/${grade.id}`, {
                state: { 
                  grade, 
                  courseColor: subjectColor,
                  subjectName
                }
              });
            }}
          />
        );

      case 'people':
        return (
          <PeopleList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            onPersonClick={(person) => {
              navigate(getRoutePath(`/subject/${subjectId}/person/${person.id}`), {
                state: {
                  person,
                  courseColor: subjectColor,
                  subjectName,
                  classroomId,
                },
              });
            }}
          />
        );

      case 'assignment':
        return (
          <AssignmentList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            onAddAssignment={() => {
              navigate(getRoutePath(`/subject/${subjectId}/add-assignment?tab=assignment`), {
                state: { subjectName, classroomId }
              });
            }}
            onEditAssignment={(assignment) => {
              navigate(getRoutePath(`/subject/${subjectId}/edit-assignment/${assignment.id}?tab=assignment`), {
                state: { 
                  assignment, 
                  subjectName, 
                  classroomId
                }
              });
            }}
            onAssignmentClick={(assignment) => {
              navigate(getRoutePath(`/subject/${subjectId}/assignment/${assignment.id}`), {
                state: { 
                  assignment, 
                  subjectName, 
                  classroomId,
                  courseColor: subjectColor,
                  course: { id: Number(subjectId), title: subjectName, color: subjectColor }
                }
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activePath="/dashboard" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={() => navigate('/dashboard')}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{subjectName}</h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchParams({ tab: tab.id });
                      }}
                      className={`
                        flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition
                        ${
                          isActive
                            ? 'border-[#043276] text-[#043276]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;

