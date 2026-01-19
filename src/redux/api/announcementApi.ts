import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const announcementApi = createApi({
  reducerPath: 'announcementApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Announcements', 'Announcement'],
  endpoints: (builder) => ({
    // Get announcements by subject (Student & Teacher)
    getAnnouncementsBySubject: builder.query<any, number>({
      query: (subjectId) => ({
        url: `/users/subjects/${subjectId}/announcements/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, subjectId) => [
        { type: 'Announcements', id: subjectId },
        'Announcements',
      ],
      // Cache for 5 minutes, only refetch if data is stale or invalidated
      keepUnusedDataFor: 300,
    }),
    // Get announcement by ID (Student & Teacher)
    getAnnouncementById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/announcements/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [
        { type: 'Announcement', id },
        'Announcement',
      ],
      keepUnusedDataFor: 600, // Cache for 10 minutes
    }),
    // Create announcement (Teacher)
    createAnnouncement: builder.mutation<
      any,
      { classroomId: number; subjectId: number; announcementData: { title: string; content: string } }
    >({
      query: ({ classroomId, subjectId, announcementData }) => ({
        url: `/users/teacher/classrooms/${classroomId}/subjects/${subjectId}/announcements/`,
        method: 'POST',
        body: announcementData,
      }),
      invalidatesTags: (_result, _error, { subjectId }) => [
        { type: 'Announcements', id: subjectId },
        'Announcements',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Announcement created successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update announcement (Teacher)
    updateAnnouncement: builder.mutation<
      any,
      { announcementId: number; announcementData: { title: string; content: string } }
    >({
      query: ({ announcementId, announcementData }) => ({
        url: `/users/teacher/announcements/${announcementId}/`,
        method: 'PUT',
        body: announcementData,
      }),
      invalidatesTags: (_result, _error, { announcementId }) => [
        { type: 'Announcement', id: announcementId },
        'Announcement',
        'Announcements', // Also invalidate all announcements to refetch list
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Announcement updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete announcement (Teacher)
    deleteAnnouncement: builder.mutation<any, { announcementId: number; subjectId: number }>({
      query: ({ announcementId }) => ({
        url: `/users/teacher/announcements/${announcementId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { subjectId }) => [
        { type: 'Announcements', id: subjectId },
        'Announcements',
        'Announcement',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Announcement deleted successfully!',
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
  useGetAnnouncementsBySubjectQuery,
  useGetAnnouncementByIdQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useLazyGetAnnouncementsBySubjectQuery,
} = announcementApi;
