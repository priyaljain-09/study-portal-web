import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
  related_id?: number;
}

export interface NotificationsResponse {
  results: Notification[];
  count: number;
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { is_read?: boolean; limit?: number } | void>({
      query: (params) => ({
        url: '/users/notifications/',
        method: 'GET',
        params: params || {},
      }),
      providesTags: ['Notifications'],
      transformResponse: (response: any) => {
        // Handle both array and object with results property
        if (Array.isArray(response)) {
          return { results: response, count: response.length };
        }
        return response;
      },
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => ({
        url: '/users/notifications/unread-count/',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
      transformResponse: (response: { count: number }) => response.count,
    }),
    markNotificationAsRead: builder.mutation<void, number>({
      query: (notificationId) => ({
        url: `/users/notifications/${notificationId}/read/`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkNotificationAsReadMutation } = notificationsApi;

