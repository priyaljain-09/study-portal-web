import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const assignmentApi = createApi({
  reducerPath: 'assignmentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Assignments', 'Assignment', 'StudentAssignments'],
  endpoints: (builder) => ({
    getTeacherAssignments: builder.query<
      any[],
      { classroomId: number; subjectId: number }
    >({
      query: ({ classroomId, subjectId }) => ({
        url: `/users/teacher/assignments/${classroomId}/${subjectId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { classroomId, subjectId }) => [
        { type: 'Assignments', id: `teacher-${classroomId}-${subjectId}` },
        'Assignments',
      ],
      keepUnusedDataFor: 300,
      transformResponse: (response: any) => {
        return Array.isArray(response) ? response : [];
      },
    }),
    // Get student assignments by subject
    getStudentAssignments: builder.query<any, number>({
      query: (subjectId) => ({
        url: `/users/assignments/subject/${subjectId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, subjectId) => [
        { type: 'StudentAssignments', id: subjectId },
        'StudentAssignments',
      ],
      keepUnusedDataFor: 300,
    }),
    // Get single assignment by ID (teacher)
    getTeacherAssignmentById: builder.query<any, number>({
      query: (assignmentId) => ({
        url: `/users/teacher/assignment/${assignmentId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
        'Assignment',
      ],
      keepUnusedDataFor: 600,
    }),
    // Create assignment (Teacher)
    createTeacherAssignment: builder.mutation<
      any,
      {
        classroomId: number;
        subjectId: number;
        assignmentData: {
          title: string;
          description: string;
          assignment_type: string;
          total_marks: number;
          due_date: string;
        };
      }
    >({
      query: ({ classroomId, subjectId, assignmentData }) => ({
        url: `/users/teacher/assignments/${classroomId}/${subjectId}/`,
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: (_result, _error, { classroomId, subjectId }) => [
        { type: 'Assignments', id: `teacher-${classroomId}-${subjectId}` },
        'Assignments',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Assignment created successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update assignment (Teacher)
    updateTeacherAssignment: builder.mutation<
      any,
      {
        assignmentId: number;
        assignmentData: {
          title?: string;
          description?: string;
          assignment_type?: string;
          total_marks?: number;
          due_date?: string;
        };
      }
    >({
      query: ({ assignmentId, assignmentData }) => ({
        url: `/users/teacher/assignment/${assignmentId}/`,
        method: 'PUT',
        body: assignmentData,
      }),
      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: 'Assignment', id: assignmentId },
        'Assignment',
        'Assignments', // Also invalidate all assignments to refetch list
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Assignment updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete assignment (Teacher)
    deleteTeacherAssignment: builder.mutation<
      any,
      { assignmentId: number; classroomId: number; subjectId: number }
    >({
      query: ({ assignmentId }) => ({
        url: `/users/teacher/assignment/${assignmentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { classroomId, subjectId }) => [
        { type: 'Assignments', id: `teacher-${classroomId}-${subjectId}` },
        'Assignments',
        'Assignment',
      ],
      async onQueryStarted({ assignmentId, classroomId, subjectId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // Immediately remove from cache after successful deletion to prevent flash
          dispatch(
            assignmentApi.util.updateQueryData(
              'getTeacherAssignments',
              { classroomId, subjectId },
              (draft) => {
                // Remove the assignment from the array immediately after successful deletion
                return draft.filter((assignment: any) => assignment.id !== assignmentId);
              }
            )
          );

          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Assignment deleted successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Submit assignment (Student)
    submitStudentAssignment: builder.mutation<
      any,
      { assignmentId: number; subjectId: number; answers: Array<{ question_id: number; answer: string | number }> }
    >({
      query: ({ assignmentId, answers }) => ({
        url: `/users/assignments/${assignmentId}/submit/mixed/`,
        method: 'POST',
        body: answers,
      }),
      invalidatesTags: (_result, _error, { subjectId }) => [
        { type: 'StudentAssignments', id: subjectId },
        'StudentAssignments',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Assignment submitted successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Get assignment by ID (for backward compatibility)
    getAssignmentById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/assignment/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Assignment', id }],
      keepUnusedDataFor: 600,
    }),
    // Get submission by ID
    getSubmissionById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/submission/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Assignment', id }],
      keepUnusedDataFor: 600,
    }),
    // Grade submission (teacher)
    gradeSubmission: builder.mutation<any, { submissionId: number; gradeData: any }>({
      query: ({ submissionId, gradeData }) => ({
        url: `/users/teacher/submission/${submissionId}/grade/`,
        method: 'POST',
        body: gradeData,
      }),
      invalidatesTags: ['Assignments', 'Assignment'],
    }),
  }),
});

export const {
  useGetTeacherAssignmentsQuery,
  useGetStudentAssignmentsQuery,
  useGetTeacherAssignmentByIdQuery,
  useCreateTeacherAssignmentMutation,
  useUpdateTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
  useSubmitStudentAssignmentMutation,
  useLazyGetTeacherAssignmentsQuery,
  useLazyGetStudentAssignmentsQuery,
  // Backward compatibility exports
  useGetAssignmentByIdQuery,
  useGetSubmissionByIdQuery,
  useGradeSubmissionMutation,
} = assignmentApi;
