import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const peopleApi = createApi({
  reducerPath: 'peopleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['People'],
  endpoints: (builder) => ({
    // Get people by subject
    getPeopleBySubject: builder.query<any, { subjectId: number; classroomId?: number; filter?: 'all' | 'students' | 'teachers' }>({
      query: ({ subjectId, classroomId, filter = 'all' }) => {
        const params: any = { filter };
        if (classroomId) {
          params.classroom_id = classroomId;
        }
        return {
          url: `/users/subjects/${subjectId}/people/`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['People'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetPeopleBySubjectQuery,
  useLazyGetPeopleBySubjectQuery,
} = peopleApi;







