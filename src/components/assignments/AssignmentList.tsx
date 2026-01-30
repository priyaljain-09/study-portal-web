import { useState } from 'react';
import { 
  FileText, 
  Lock, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Plus, 
  Pencil, 
  Trash2,
  ClipboardList
} from 'lucide-react';
import {
  useGetTeacherAssignmentsQuery,
  useGetStudentAssignmentsQuery,
  useDeleteTeacherAssignmentMutation,
} from '../../redux/api/assignmentApi';

interface AssignmentListProps {
  subjectId: number;
  classroomId?: number;
  userRole: string;
  onAddAssignment?: () => void;
  onAssignmentClick?: (assignment: any) => void;
  onEditAssignment?: (assignment: any) => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  subjectId,
  classroomId,
  userRole,
  onAddAssignment,
  onAssignmentClick,
  onEditAssignment,
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<number | null>(null);

  const isTeacher = userRole === 'teacher';

  // Use different query based on user role
  const { data: studentAssignmentsData, isLoading: isLoadingStudent } = useGetStudentAssignmentsQuery(
    subjectId,
    { skip: !subjectId || isTeacher }
  );

  const { data: teacherAssignmentsData, isLoading: isLoadingTeacher } = useGetTeacherAssignmentsQuery(
    { subjectId, classroomId: classroomId || 0 },
    { skip: !subjectId || !isTeacher || !classroomId }
  );

  const [deleteTeacherAssignment] = useDeleteTeacherAssignmentMutation();

  const isLoading = isTeacher ? isLoadingTeacher : isLoadingStudent;

  // Extract assignments from response
  // Teacher assignments are already transformed to array in the API
  // Student assignments might be an object with assignments array
  const assignments = isTeacher 
    ? (teacherAssignmentsData || [])
    : (Array.isArray(studentAssignmentsData) ? studentAssignmentsData : studentAssignmentsData?.assignments || []);

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    // Simple date format matching mobile design
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIconAndColor = (item: any) => {
    const today = new Date();
    const dueDate = item.due_date ? new Date(item.due_date) : null;

    if (item.submitted) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        color: 'text-green-500',
        text: 'Submitted',
      };
    } else if (!item.submitted && dueDate && dueDate < today) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        color: 'text-red-500',
        text: 'Not Submitted',
      };
    } else {
      return {
        icon: <MinusCircle className="w-4 h-4 text-yellow-500" />,
        color: 'text-yellow-500',
        text: 'Pending',
      };
    }
  };

  const getAssignmentIcon = (item: any) => {
    if (item.isClosed || item.is_closed) {
      return <Lock className="w-5 h-5 text-gray-500" />;
    }
    return <FileText className="w-5 h-5 text-purple-600" />;
  };

  const handleLongPress = (assignmentId: number) => {
    if (isTeacher) {
      setSelectedAssignmentId(
        selectedAssignmentId === assignmentId ? null : assignmentId
      );
    }
  };

  const handleClick = (assignment: any) => {
    if (selectedAssignmentId === assignment.id) {
      setSelectedAssignmentId(null);
      return;
    }
    
    if (isTeacher && onEditAssignment) {
      // For teachers, clicking on assignment opens edit page
      onEditAssignment(assignment);
    } else if (!isTeacher) {
      // For students
      if (assignment.submitted) {
        // If already submitted, show alert
        alert('Already Submitted\nYou have already submitted this assignment.');
      } else if (onAssignmentClick) {
        // If not submitted, navigate to detail page
        onAssignmentClick(assignment);
      }
    }
  };

  const handleEdit = (assignment: any) => {
    setSelectedAssignmentId(null);
    if (onEditAssignment) {
      onEditAssignment(assignment);
    } else if (onAssignmentClick) {
      onAssignmentClick(assignment);
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    if (!classroomId) {
      alert('Classroom ID is required to delete assignment.');
      return;
    }

    setDeletingAssignmentId(assignmentId);
    try {
      await deleteTeacherAssignment({
        assignmentId,
        classroomId,
        subjectId,
      }).unwrap();
      setSelectedAssignmentId(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      // Error toast is handled by the API
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-4">
          {isTeacher ? 'No assignments yet' : 'No assignments available'}
        </p>
        {isTeacher && onAddAssignment && (
          <button
            onClick={onAddAssignment}
            className="px-4 py-2 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition"
          >
            Create Assignment
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Assignment Button for Teachers */}
      {isTeacher && onAddAssignment && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddAssignment}
            className="flex items-center space-x-2 px-4 py-2 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Assignment</span>
          </button>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-0">
        {assignments.map((assignment: any) => {
          const isSelected = selectedAssignmentId === assignment.id;
          const isDeleting = deletingAssignmentId === assignment.id;
          const statusInfo = !isTeacher ? getStatusIconAndColor(assignment) : null;

          return (
            <div
              key={assignment.id}
              className={`bg-white border-b border-gray-200 hover:bg-gray-50 transition relative ${
                isSelected ? 'bg-purple-50' : ''
              } ${isDeleting ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => !isDeleting && handleClick(assignment)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isTeacher) {
                  handleLongPress(assignment.id);
                }
              }}
            >
              {isDeleting && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 font-medium">Deleting...</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getAssignmentIcon(assignment)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    {assignment.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatDate(assignment.due_date || assignment.dueDate)}
                  </p>

                  {/* Status and Marks Row */}
                  <div className="flex items-center justify-between">
                    {isTeacher ? (
                      <span className="text-sm font-semibold text-gray-700">
                        {assignment.total_marks || assignment.totalMarks || 0} Marks
                      </span>
                    ) : (
                      <>
                        {/* Status for Students */}
                        {statusInfo && (
                          <div className="flex items-center gap-1.5">
                            {statusInfo.icon}
                            <span className={`text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        )}
                        {/* Marks Display for Students */}
                        <span className={`text-sm font-semibold ${
                          assignment.submitted ? 'text-purple-600' : 'text-gray-600'
                        }`}>
                          {assignment.submitted 
                            ? `✔️ ${assignment.total_marks || assignment.totalMarks || 0} Marks`
                            : `- / ${assignment.total_marks || assignment.totalMarks || 0}`}
                        </span>
                      </>
                    )}

                    {/* Action Buttons (for teachers when selected) */}
                    {isTeacher && isSelected && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(assignment);
                          }}
                          className="p-1.5 hover:bg-blue-100 rounded transition"
                          title="Edit Assignment"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(assignment.id);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded transition"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentList;

