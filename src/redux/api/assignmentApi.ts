import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const assignmentApi = createApi({
  reducerPath: 'assignmentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Assignments', 'Assignment', 'StudentAssignments', 'StudentAssignmentQuestions', 'AssignmentQuestions'],
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
    // Get student assignment with questions (for viewing/answering)
    getStudentAssignmentQuestions: builder.query<any, number>({
      query: (assignmentId) => ({
        url: `/users/assignments/${assignmentId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, assignmentId) => [
        { type: 'StudentAssignmentQuestions', id: assignmentId },
        'StudentAssignmentQuestions',
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
      query: ({ assignmentId, answers }) => {
        // Ensure answers are properly formatted
        // MCQ answers should be numbers, text answers should be strings
        const formattedAnswers = answers.map((item) => ({
          question_id: Number(item.question_id),
          answer: item.answer, // Keep as-is (number for MCQ, string for text)
        }));
        
        return {
          url: `/users/assignments/${assignmentId}/submit/mixed/`,
          method: 'POST',
          body: formattedAnswers,
        };
      },
      invalidatesTags: (_result, _error, { subjectId, assignmentId }) => [
        { type: 'StudentAssignments', id: subjectId },
        'StudentAssignments',
        { type: 'StudentAssignmentQuestions', id: assignmentId },
        'StudentAssignmentQuestions',
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
    // Note: Use getTeacherAssignmentByIdQuery for teachers or getStudentAssignmentQuestionsQuery for students
    // This endpoint (/users/assignment/${id}/) doesn't exist in the API
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
    // Get assignment questions
    getAssignmentQuestions: builder.query<any[], number>({
      query: (assignmentId) => ({
        url: `/users/teacher/assignment/${assignmentId}/questions/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, assignmentId) => [
        { type: 'AssignmentQuestions', id: assignmentId },
        'AssignmentQuestions',
      ],
      keepUnusedDataFor: 300,
    }),
    // Create assignment question
    createAssignmentQuestion: builder.mutation<
      any,
      { assignmentId: number; questionData: any }
    >({
      query: ({ assignmentId, questionData }) => ({
        url: `/users/teacher/assignment/${assignmentId}/questions/`,
        method: 'POST',
        body: questionData,
      }),
      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: 'AssignmentQuestions', id: assignmentId },
        'AssignmentQuestions',
        { type: 'Assignment', id: assignmentId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Question created successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update assignment question
    updateAssignmentQuestion: builder.mutation<
      any,
      { questionId: number; questionData: any }
    >({
      query: ({ questionId, questionData }) => ({
        url: `/users/teacher/question/${questionId}/`,
        method: 'PUT',
        body: questionData,
      }),
      invalidatesTags: ['AssignmentQuestions'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Question updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete assignment question
    deleteAssignmentQuestion: builder.mutation<any, number>({
      query: (questionId) => ({
        url: `/users/teacher/question/${questionId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AssignmentQuestions'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Question deleted successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete assignment question option
    deleteAssignmentOption: builder.mutation<any, number>({
      query: (optionId) => ({
        url: `/users/teacher/question/option/${optionId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AssignmentQuestions'],
    }),
  }),
});

export const {
  useGetTeacherAssignmentsQuery,
  useGetStudentAssignmentsQuery,
  useGetStudentAssignmentQuestionsQuery,
  useGetTeacherAssignmentByIdQuery,
  useCreateTeacherAssignmentMutation,
  useUpdateTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
  useSubmitStudentAssignmentMutation,
  useLazyGetTeacherAssignmentsQuery,
  useLazyGetStudentAssignmentsQuery,
  useLazyGetStudentAssignmentQuestionsQuery,
  // Question management
  useGetAssignmentQuestionsQuery,
  useCreateAssignmentQuestionMutation,
  useUpdateAssignmentQuestionMutation,
  useDeleteAssignmentQuestionMutation,
  useDeleteAssignmentOptionMutation,
  // Backward compatibility exports
  useGetSubmissionByIdQuery,
  useGradeSubmissionMutation,
} = assignmentApi;
