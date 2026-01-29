import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  subject_name?: string;
  due_date?: string;
  is_submitted: boolean;
  days_remaining?: number;
}

export const todoApi = createApi({
  reducerPath: 'todoApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TodoList'],
  endpoints: (builder) => ({
    getStudentTodoList: builder.query<TodoItem[], void>({
      query: () => ({
        url: '/users/student/todo/',
        method: 'GET',
      }),
      providesTags: ['TodoList'],
      keepUnusedDataFor: 300,
      transformResponse: (response: any) => {
        return Array.isArray(response) ? response : [];
      },
    }),
  }),
});

export const { useGetStudentTodoListQuery } = todoApi;



