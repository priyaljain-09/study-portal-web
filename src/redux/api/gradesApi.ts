import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const gradesApi = createApi({
  reducerPath: 'gradesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Grades', 'Grade'],
  endpoints: (builder) => ({
    // Get grades by subject (student)
    getGradesBySubject: builder.query<any, { subjectId: number; classroomId?: number }>({
      query: ({ subjectId, classroomId }) => {
        const params = classroomId ? { classroom_id: classroomId } : {};
        return {
          url: `/users/subjects/${subjectId}/grades/`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['Grades'],
      keepUnusedDataFor: 300,
    }),
    // Get grades by subject and classroom (teacher)
    getGradesBySubjectAndClassroom: builder.query<any, { subjectId: number; classroomId: number }>({
      query: ({ subjectId, classroomId }) => ({
        url: `/users/teacher/classrooms/${classroomId}/subjects/${subjectId}/grades/`,
        method: 'GET',
      }),
      providesTags: ['Grades'],
      keepUnusedDataFor: 300,
    }),
    // Get grade by ID
    getGradeById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/grade/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Grade', id }],
      keepUnusedDataFor: 600,
    }),
    // Create grade (teacher only)
    createGrade: builder.mutation<any, { classroomId: number; subjectId: number; gradeData: any }>({
      query: ({ classroomId, subjectId, gradeData }) => ({
        url: `/users/teacher/classrooms/${classroomId}/subjects/${subjectId}/grades/`,
        method: 'POST',
        body: gradeData,
      }),
      invalidatesTags: ['Grades'],
    }),
    // Update grade
    updateGrade: builder.mutation<any, { gradeId: number; gradeData: any }>({
      query: ({ gradeId, gradeData }) => ({
        url: `/users/teacher/grade/${gradeId}/`,
        method: 'PUT',
        body: gradeData,
      }),
      invalidatesTags: ['Grades', 'Grade'],
    }),
    // Delete grade
    deleteGrade: builder.mutation<any, number>({
      query: (gradeId) => ({
        url: `/users/teacher/grade/${gradeId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Grades'],
    }),
  }),
});

export const {
  useGetGradesBySubjectQuery,
  useGetGradesBySubjectAndClassroomQuery,
  useGetGradeByIdQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useLazyGetGradesBySubjectQuery,
} = gradesApi;







