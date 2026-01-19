import { useAppSelector } from '../redux/hooks';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from '../teacher/TeacherDashboard';

const Dashboard = () => {
  const userRole = useAppSelector((state) => state.applicationData.userRole);
  const roleFromStorage = localStorage.getItem('userRole');

  // Determine user role - prefer Redux state, fallback to localStorage
  const role = userRole || roleFromStorage || 'student';

  // Route to appropriate dashboard based on role
  if (role.toLowerCase() === 'teacher') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;
