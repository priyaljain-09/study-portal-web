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

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date).replace(',', ' at');
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
    } else if (isTeacher && onEditAssignment) {
      // For teachers, clicking on assignment opens edit page
      onEditAssignment(assignment);
    } else if (onAssignmentClick) {
      // For students, clicking opens detail page
      onAssignmentClick(assignment);
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Assignment</span>
          </button>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-2">
        {assignments.map((assignment: any) => {
          const isSelected = selectedAssignmentId === assignment.id;
          const isDeleting = deletingAssignmentId === assignment.id;
          const statusInfo = !isTeacher ? getStatusIconAndColor(assignment) : null;

          return (
            <div
              key={assignment.id}
              className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition ${
                isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
              } ${isDeleting ? 'opacity-60' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(assignment.id);
              }}
            >
              <div
                onClick={() => handleClick(assignment)}
                className="p-4 cursor-pointer"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 font-medium">Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getAssignmentIcon(assignment)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Due: {formatDate(assignment.due_date || assignment.dueDate)}
                          </p>
                          
                          {/* Status for Students */}
                          {!isTeacher && statusInfo && (
                            <div className="flex items-center gap-2 mt-2">
                              {statusInfo.icon}
                              <span className={`text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </div>
                          )}

                          {/* Marks Display */}
                          <div className="flex items-center gap-4 mt-2">
                            {isTeacher ? (
                              <span className="text-sm font-semibold text-gray-700">
                                {assignment.total_marks || assignment.totalMarks || 0} Marks
                              </span>
                            ) : (
                              <span className={`text-sm font-semibold ${
                                assignment.submitted ? 'text-purple-600' : 'text-gray-600'
                              }`}>
                                {assignment.submitted 
                                  ? `✔️ ${assignment.total_marks || assignment.totalMarks || 0} Marks`
                                  : `- / ${assignment.total_marks || assignment.totalMarks || 0}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons (for teachers when selected) */}
                        {isTeacher && isSelected && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(assignment);
                              }}
                              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                              title="Edit Assignment"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(assignment.id);
                              }}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentList;

