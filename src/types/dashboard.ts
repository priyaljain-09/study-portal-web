export interface Subject {
  id: number;
  name: string;
  code?: string;
  description?: string;
  teacher_name?: string;
  classroom_id?: number;
  classroom_name?: string;
  section?: string;
  due_assignments?: number;
  upcoming_classes?: Array<{
    id: number;
    date: string;
    time: string;
    topic?: string;
  }>;
  icon?: string;
  color?: string;
}

export interface StudentDashboardData {
  subjects?: Subject[];
  upcoming_assignments?: Array<{
    id: number;
    title: string;
    subject_name: string;
    due_date: string;
    due_time?: string;
    status?: string;
  }>;
  announcements?: Array<{
    id: number;
    title: string;
    message: string;
    created_at: string;
    is_urgent?: boolean;
  }>;
  recent_activities?: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface TeacherDashboardData {
  subjects?: Array<{
    id: number;
    name: string;
    code?: string;
    classrooms?: Array<{
      id: number;
      name: string;
      section?: string;
      student_count?: number;
    }>;
    total_students?: number;
    upcoming_classes?: Array<{
      id: number;
      date: string;
      time: string;
      classroom_name: string;
      topic?: string;
    }>;
  }>;
  pending_assignments?: Array<{
    id: number;
    title: string;
    subject_name: string;
    classroom_name: string;
    submitted_count?: number;
    total_count?: number;
    due_date: string;
  }>;
  announcements?: Array<{
    id: number;
    title: string;
    message: string;
    created_at: string;
    is_urgent?: boolean;
  }>;
  recent_activities?: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface IDashboardState {
  allSubjects: StudentDashboardData | {};
  subjectSyllabus: any[];
  subjectPeople: any;
  teacherDashboardData: TeacherDashboardData | {};
}






