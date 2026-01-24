import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import {
  useFetchTeacherGradesQuery,
  useFetchGradesBySubjectQuery,
} from '../../redux/api/gradesApi';

interface GradesListProps {
  subjectId: number;
  classroomId?: number;
  userRole: string;
  courseColor?: string;
  onGradeClick?: (grade: any) => void;
  onAssignmentClick?: (assignment: any) => void;
}

const GradesList: React.FC<GradesListProps> = ({
  subjectId,
  classroomId,
  userRole,
  courseColor = '#8B5CF6',
  onGradeClick,
  onAssignmentClick,
}) => {
  const navigate = useNavigate();
  const isTeacher = userRole === 'teacher';

  // Fetch teacher grades
  const {
    data: teacherGradesData,
    isLoading: isLoadingTeacher,
  } = useFetchTeacherGradesQuery(
    { subjectId, classroomId },
    { skip: !subjectId || !isTeacher || !classroomId }
  );

  // Fetch student grades
  const {
    data: subjectGradesData,
    isLoading: isLoadingStudent,
  } = useFetchGradesBySubjectQuery(subjectId, {
    skip: !subjectId || isTeacher,
  });

  const isLoading = isTeacher ? isLoadingTeacher : isLoadingStudent;

  // Extract data based on role
  const teacherAssignments = useMemo(() => {
    return teacherGradesData?.assignments || [];
  }, [teacherGradesData]);

  const studentGrades = useMemo(() => {
    return Array.isArray(subjectGradesData) ? subjectGradesData : [];
  }, [subjectGradesData]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleAssignmentClick = (assignment: any) => {
    if (onAssignmentClick) {
      onAssignmentClick(assignment);
    } else {
      // Default navigation for teacher
      const basePath = classroomId
        ? `/classroom/${classroomId}/subject/${subjectId}`
        : `/subject/${subjectId}`;
      navigate(`${basePath}/assignment/${assignment.id}/grades`, {
        state: { assignment, courseColor, classroomId },
      });
    }
  };

  const handleGradeClick = (grade: any) => {
    if (onGradeClick) {
      onGradeClick(grade);
    } else {
      // Default navigation for student
      navigate(`/subject/${subjectId}/grade/${grade.id}`, {
        state: { grade, courseColor },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"
            style={{ borderTopColor: courseColor }}
          ></div>
          <p className="text-gray-600 text-sm font-medium">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isTeacher ? (
        // Teacher view - show assignments list
        <>
          {teacherAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No assignments available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherAssignments.map((assignment: any) => {
                const submittedCount =
                  assignment.grades?.filter((g: any) => g.is_submitted).length || 0;
                const totalStudents = assignment.grades?.length || 0;

                return (
                  <div
                    key={assignment.id}
                    onClick={() => handleAssignmentClick(assignment)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          {assignment.title}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {assignment.classroom} • Due: {formatDate(assignment.due_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {submittedCount} of {totalStudents} students submitted
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div
                          className="text-sm font-semibold px-3 py-1 rounded"
                          style={{
                            color: courseColor,
                            backgroundColor: `${courseColor}15`,
                          }}
                        >
                          {assignment.total_marks} pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // Student view - show grades
        <>
          {studentGrades.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No grades available.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {studentGrades.map((grade: any) => (
                  <div
                    key={grade.id}
                    onClick={() => handleGradeClick(grade)}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">
                          {grade.assignment_title}
                        </h3>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-base font-semibold text-gray-700">
                          {grade.marks_obtained !== null
                            ? `${grade.marks_obtained}/${grade.total_marks}`
                            : `-- / ${grade.total_marks}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {studentGrades.length > 5 && (
                <div className="mt-4 text-right">
                  <button
                    onClick={() => {
                      // Navigate to full grades view if needed
                      navigate(`/subject/${subjectId}?tab=grades`);
                    }}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: courseColor }}
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GradesList;


