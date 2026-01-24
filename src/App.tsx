import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './redux/hooks';
import { useEffect } from 'react';
import { loginsuccess, setUserRole, fetchUserProfile } from './redux/slices/applicationSlice';
import Login from './authentication/Login';
import Dashboard from './student/Dashboard';
import SubjectDetail from './student/SubjectDetail';
import ChapterDetail from './student/ChapterDetail';
import DiscussionDetail from './student/DiscussionDetail';
import AnnouncementDetail from './student/AnnouncementDetail';
import AssignmentDetail from './student/AssignmentDetail';
import AssignmentQuestions from './student/AssignmentQuestions';
import AssignmentSubmit from './student/AssignmentSubmit';
import PersonDetail from './student/PersonDetail';
import GradeDetail from './student/GradeDetail';
import AssignmentGrades from './teacher/AssignmentGrades';
import StudentSubmissionDetail from './teacher/StudentSubmissionDetail';
import AddModule from './teacher/AddModule';
import AddChapter from './teacher/AddChapter';
import AddDiscussion from './components/discussions/AddDiscussion';
import AddAnnouncement from './components/announcements/AddAnnouncement';
import AddSyllabus from './components/syllabus/AddSyllabus';
import AddAssignment from './components/assignments/AddAssignment';
import Toast from './components/ui/Toast';
import './App.css';

// Component to initialize auth state from localStorage
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.applicationData.successLogin);
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);

  useEffect(() => {
    // Check if user is already logged in (has token in localStorage)
    const accessToken = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (accessToken && !isAuthenticated) {
      // User has token but Redux state is not initialized
      // Initialize Redux state from localStorage
      dispatch(loginsuccess(true));
      if (userRole) {
        dispatch(setUserRole(userRole));
      }
      // Fetch user profile if not already loaded
      if (!userProfile || !userProfile.user?.id) {
        dispatch(fetchUserProfile());
      }
    } else if (!accessToken && isAuthenticated) {
      // Token was removed but Redux state still thinks user is logged in
      // This shouldn't happen, but handle it just in case
      dispatch(loginsuccess(false));
    }
  }, [dispatch, isAuthenticated, userProfile]);

  return <>{children}</>;
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.applicationData.successLogin);
  const accessToken = localStorage.getItem('accessToken');

  // Check both Redux state and localStorage for authentication
  const isAuth = isAuthenticated || !!accessToken;

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.applicationData.successLogin);
  const accessToken = localStorage.getItem('accessToken');

  // Check both Redux state and localStorage for authentication
  const isAuth = isAuthenticated || !!accessToken;

  if (isAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Toast />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          {/* Teacher routes with classroomId */}
          <Route path="/classroom/:classroomId/subject/:subjectId" element={<PrivateRoute><SubjectDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/chapter/:chapterId" element={<PrivateRoute><ChapterDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/discussion/:discussionId" element={<PrivateRoute><DiscussionDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/announcement/:announcementId" element={<PrivateRoute><AnnouncementDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/assignment/:assignmentId" element={<PrivateRoute><AssignmentDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/assignment/:assignmentId/questions" element={<PrivateRoute><AssignmentQuestions /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/assignment/:assignmentId/submit" element={<PrivateRoute><AssignmentSubmit /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/assignment/:assignmentId/grades" element={<PrivateRoute><AssignmentGrades /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/assignment/:assignmentId/submission/:submissionId" element={<PrivateRoute><StudentSubmissionDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/grade/:gradeId" element={<PrivateRoute><GradeDetail /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-module" element={<PrivateRoute><AddModule /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-chapter" element={<PrivateRoute><AddChapter /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-discussion" element={<PrivateRoute><AddDiscussion /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/edit-discussion/:discussionId" element={<PrivateRoute><AddDiscussion /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-announcement" element={<PrivateRoute><AddAnnouncement /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/edit-announcement/:announcementId" element={<PrivateRoute><AddAnnouncement /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-syllabus" element={<PrivateRoute><AddSyllabus /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/edit-syllabus/:syllabusItemId" element={<PrivateRoute><AddSyllabus /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/add-assignment" element={<PrivateRoute><AddAssignment /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/edit-assignment/:assignmentId" element={<PrivateRoute><AddAssignment /></PrivateRoute>} />
          <Route path="/classroom/:classroomId/subject/:subjectId/person/:personId" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
          {/* Student routes with subjectId only */}
          <Route path="/subject/:subjectId" element={<PrivateRoute><SubjectDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/chapter/:chapterId" element={<PrivateRoute><ChapterDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/discussion/:discussionId" element={<PrivateRoute><DiscussionDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/announcement/:announcementId" element={<PrivateRoute><AnnouncementDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/assignment/:assignmentId" element={<PrivateRoute><AssignmentDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/assignment/:assignmentId/questions" element={<PrivateRoute><AssignmentQuestions /></PrivateRoute>} />
          <Route path="/subject/:subjectId/assignment/:assignmentId/submit" element={<PrivateRoute><AssignmentSubmit /></PrivateRoute>} />
          <Route path="/subject/:subjectId/assignment/:assignmentId/grades" element={<PrivateRoute><AssignmentGrades /></PrivateRoute>} />
          <Route path="/subject/:subjectId/assignment/:assignmentId/submission/:submissionId" element={<PrivateRoute><StudentSubmissionDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/grade/:gradeId" element={<PrivateRoute><GradeDetail /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-module" element={<PrivateRoute><AddModule /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-chapter" element={<PrivateRoute><AddChapter /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-discussion" element={<PrivateRoute><AddDiscussion /></PrivateRoute>} />
          <Route path="/subject/:subjectId/edit-discussion/:discussionId" element={<PrivateRoute><AddDiscussion /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-announcement" element={<PrivateRoute><AddAnnouncement /></PrivateRoute>} />
          <Route path="/subject/:subjectId/edit-announcement/:announcementId" element={<PrivateRoute><AddAnnouncement /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-syllabus" element={<PrivateRoute><AddSyllabus /></PrivateRoute>} />
          <Route path="/subject/:subjectId/edit-syllabus/:syllabusItemId" element={<PrivateRoute><AddSyllabus /></PrivateRoute>} />
          <Route path="/subject/:subjectId/add-assignment" element={<PrivateRoute><AddAssignment /></PrivateRoute>} />
          <Route path="/subject/:subjectId/edit-assignment/:assignmentId" element={<PrivateRoute><AddAssignment /></PrivateRoute>} />
          <Route path="/subject/:subjectId/person/:personId" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}

export default App;
