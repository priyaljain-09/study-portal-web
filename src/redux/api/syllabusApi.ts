import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const syllabusApi = createApi({
  reducerPath: 'syllabusApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Syllabus', 'SyllabusItem'],
  endpoints: (builder) => ({
    // Get syllabus by subject
    getSyllabusBySubject: builder.query<any, { subjectId: number; classroomId?: number }>({
      query: ({ subjectId, classroomId }) => {
        const params = classroomId ? { classroom_id: classroomId } : {};
        return {
          url: `/users/subject/${subjectId}/syllabus/`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['Syllabus'],
      keepUnusedDataFor: 300,
    }),
    // Get syllabus item by ID
    getSyllabusItemById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/syllabus/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SyllabusItem', id }],
      keepUnusedDataFor: 600,
    }),
    // Create syllabus item (teacher only)
    createSyllabusItem: builder.mutation<any, { classroomId: number; subjectId: number; syllabusData: any }>({
      query: ({ classroomId, subjectId, syllabusData }) => ({
        url: `/users/teacher/classrooms/${classroomId}/subjects/${subjectId}/syllabus/`,
        method: 'POST',
        body: syllabusData,
      }),
      invalidatesTags: ['Syllabus'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Syllabus item created successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update syllabus item
    updateSyllabusItem: builder.mutation<any, { syllabusItemId: number; syllabusData: any }>({
      query: ({ syllabusItemId, syllabusData }) => ({
        url: `/users/teacher/syllabus/${syllabusItemId}/`,
        method: 'PUT',
        body: syllabusData,
      }),
      invalidatesTags: ['Syllabus', 'SyllabusItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Syllabus item updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete syllabus item
    deleteSyllabusItem: builder.mutation<any, number>({
      query: (syllabusItemId) => ({
        url: `/users/teacher/syllabus/${syllabusItemId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Syllabus'],
    }),
  }),
});

export const {
  useGetSyllabusBySubjectQuery,
  useGetSyllabusItemByIdQuery,
  useCreateSyllabusItemMutation,
  useUpdateSyllabusItemMutation,
  useDeleteSyllabusItemMutation,
  useLazyGetSyllabusBySubjectQuery,
} = syllabusApi;







