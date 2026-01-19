import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { BookOpen, MessageSquare, Bell, FileText, Award, Users, ClipboardList } from 'lucide-react';

const SubjectDetail = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userRole = useAppSelector((state) => state.applicationData.userRole) || localStorage.getItem('userRole') || 'student';
  const dashboardData = useAppSelector((state) => state.dashboard.allSubjects) as any;
  
  const [activeTab, setActiveTab] = useState<'module' | 'discussion' | 'announcement' | 'syllabus' | 'grades' | 'people' | 'assignment'>('module');

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

  // Get classroomId from location state if available (for teachers)
  const classroomId = useMemo(() => {
    return location.state?.classroomId;
  }, [location.state]);

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
              navigate(`/subject/${subjectId}/add-module`, {
                state: { subjectName, classroomId }
              });
            }}
            onChapterClick={(chapter, module) => {
              // Navigate to chapter detail page - only pass module (which contains its chapters)
              navigate(`/subject/${subjectId}/chapter/${chapter.id}`, {
                state: { 
                  chapter, 
                  module, 
                  subjectName
                }
              });
            }}
            onAddChapter={(module) => {
              navigate(`/subject/${subjectId}/add-chapter`, {
                state: { module, subjectName, classroomId, isEditMode: false }
              });
            }}
            onEditChapter={(chapter, module) => {
              navigate(`/subject/${subjectId}/add-chapter`, {
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
            onAddDiscussion={() => {
              // Navigate to add discussion page or show modal
              alert('Add Discussion functionality - to be implemented');
            }}
            onDiscussionClick={(discussion) => {
              // Navigate to discussion detail page
              navigate(`/subject/${subjectId}/discussion/${discussion.id}`, {
                state: { discussion, subjectName }
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
            onAddAnnouncement={() => {
              // Navigate to add announcement page or show modal
              alert('Add Announcement functionality - to be implemented');
            }}
            onAnnouncementClick={(announcement) => {
              // Navigate to announcement detail page
              navigate(`/subject/${subjectId}/announcement/${announcement.id}`, {
                state: { announcement, subjectName }
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
              // Navigate to add syllabus page or show modal
              alert('Add Syllabus functionality - to be implemented');
            }}
            onEditSyllabus={(_item) => {
              // Navigate to edit syllabus page
              alert('Edit Syllabus functionality - to be implemented');
            }}
          />
        );

      case 'grades':
        return (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Grades tab - API integration pending</p>
          </div>
        );

      case 'people':
        return (
          <PeopleList
            subjectId={Number(subjectId)}
            classroomId={classroomId}
            userRole={userRole}
            onPersonClick={(person) => {
              // Navigate to person detail page
              alert(`Person Detail: ${person.name} - to be implemented`);
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
              // Navigate to add assignment page or show modal
              alert('Add Assignment functionality - to be implemented');
            }}
            onAssignmentClick={(assignment) => {
              // Navigate to assignment detail page
              navigate(`/subject/${subjectId}/assignment/${assignment.id}`, {
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
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition
                        ${
                          isActive
                            ? 'border-purple-600 text-purple-600'
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

