import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const gradesApi = createApi({
  reducerPath: 'gradesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TeacherGrades', 'SubjectGrades', 'GradeDetail', 'SubmissionDetail'],
  endpoints: (builder) => ({
    // Fetch teacher grades by subject
    fetchTeacherGrades: builder.query<
      any,
      { subjectId: number; classroomId?: number }
    >({
      query: ({ subjectId, classroomId }) => {
        const params: any = {};
        if (classroomId) {
          params.classroom_id = classroomId;
        }
        return {
          url: `/users/teacher/assignment/${subjectId}/grades/`,
          method: 'GET',
          params,
        };
      },
      providesTags: (_result, _error, { subjectId, classroomId }) => [
        { type: 'TeacherGrades', id: `${subjectId}-${classroomId || 'all'}` },
        'TeacherGrades',
      ],
      keepUnusedDataFor: 300,
    }),
    // Fetch grades by subject (Student)
    fetchGradesBySubject: builder.query<any, number>({
      query: (subjectId) => ({
        url: `/users/student/grades/${subjectId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, subjectId) => [
        { type: 'SubjectGrades', id: subjectId },
        'SubjectGrades',
      ],
      keepUnusedDataFor: 300,
    }),
    // Fetch grade detail by ID (Student)
    fetchGradesById: builder.query<any, number>({
      query: (gradeId) => ({
        url: `/users/student/grade-detail/${gradeId}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, gradeId) => [
        { type: 'GradeDetail', id: gradeId },
        'GradeDetail',
      ],
      keepUnusedDataFor: 600,
    }),
    // Fetch submission detail by submission ID (Teacher)
    fetchSubmissionDetail: builder.query<any, number>({
      query: (submissionId) => ({
        url: `/users/teacher/submission/${submissionId}/grade/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, submissionId) => [
        { type: 'SubmissionDetail', id: submissionId },
        'SubmissionDetail',
      ],
      keepUnusedDataFor: 600,
    }),
    // Update student grade
    updateStudentGrade: builder.mutation<
      any,
      {
        submissionId: number;
        gradeData: {
          marks_obtained: string;
          feedback?: string;
          status?: string;
        };
      }
    >({
      query: ({ submissionId, gradeData }) => ({
        url: `/users/teacher/submission/${submissionId}/grade/`,
        method: 'PUT',
        body: gradeData,
      }),
      invalidatesTags: (_result, _error, { submissionId }) => [
        { type: 'SubmissionDetail', id: submissionId },
        'SubmissionDetail',
        'TeacherGrades',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Grade updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update question marks for a submission
    updateQuestionMarks: builder.mutation<
      any,
      {
        submissionId: number;
        questions: Array<{ question_id: number; marks: string }>;
      }
    >({
      query: ({ submissionId, questions }) => ({
        url: `/users/teacher/submission/${submissionId}/questions/marks/`,
        method: 'PUT',
        body: { questions },
      }),
      invalidatesTags: (_result, _error, { submissionId }) => [
        { type: 'SubmissionDetail', id: submissionId },
        'SubmissionDetail',
        'TeacherGrades',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Question marks updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
  }),
});

export const {
  useFetchTeacherGradesQuery,
  useFetchGradesBySubjectQuery,
  useFetchGradesByIdQuery,
  useFetchSubmissionDetailQuery,
  useUpdateStudentGradeMutation,
  useUpdateQuestionMarksMutation,
  useLazyFetchTeacherGradesQuery,
  useLazyFetchGradesBySubjectQuery,
  useLazyFetchGradesByIdQuery,
  useLazyFetchSubmissionDetailQuery,
} = gradesApi;
