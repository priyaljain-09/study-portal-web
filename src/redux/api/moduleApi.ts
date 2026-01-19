import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const moduleApi = createApi({
  reducerPath: 'moduleApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Modules', 'Chapter', 'Material'],
  endpoints: (builder) => ({
    // Get modules by subject (student)
    getModulesBySubject: builder.query<any, { subjectId: number }>({
      query: ({ subjectId }) => ({
        url: `/users/subjects/${subjectId}/modules/`,
        method: 'GET',
      }),
      providesTags: ['Modules'],
      keepUnusedDataFor: 300,
    }),
    // Get modules by subject and classroom (teacher)
    getModulesBySubjectAndClassroom: builder.query<any, { subjectId: number; classroomId: number }>({
      query: ({ subjectId, classroomId }) => ({
        url: `/users/teacher/modules/${classroomId}/${subjectId}/`,
        method: 'GET',
      }),
      providesTags: ['Modules'],
      keepUnusedDataFor: 300,
    }),
    // Get chapter by ID
    getChapterById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/chapter/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Chapter', id }],
      keepUnusedDataFor: 600,
    }),
    // Create module (teacher only)
    createModule: builder.mutation<any, { moduleData: any; classId: number; subjectId: number }>({
      query: ({ moduleData, classId, subjectId }) => ({
        url: `/users/teacher/modules/${classId}/${subjectId}/`,
        method: 'POST',
        body: moduleData,
      }),
      invalidatesTags: ['Modules'],
    }),
    // Update module
    updateModule: builder.mutation<any, { moduleId: number; moduleData: any }>({
      query: ({ moduleId, moduleData }) => ({
        url: `/users/teacher/module/${moduleId}/`,
        method: 'PUT',
        body: moduleData,
      }),
      invalidatesTags: ['Modules'],
    }),
    // Delete module
    deleteModule: builder.mutation<any, number>({
      query: (moduleId) => ({
        url: `/users/teacher/module/${moduleId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Modules'],
    }),
    // Create chapter
    createChapter: builder.mutation<any, { chapterData: any; moduleId: number }>({
      query: ({ chapterData, moduleId }) => ({
        url: `/users/teacher/module/${moduleId}/chapters/`,
        method: 'POST',
        body: chapterData,
      }),
      invalidatesTags: ['Modules'],
    }),
    // Update chapter
    updateChapter: builder.mutation<any, { chapterId: number; chapterData: any }>({
      query: ({ chapterId, chapterData }) => ({
        url: `/users/teacher/chapter/${chapterId}/`,
        method: 'PUT',
        body: chapterData,
      }),
      invalidatesTags: ['Modules', 'Chapter'],
    }),
    // Delete chapter
    deleteChapter: builder.mutation<any, number>({
      query: (chapterId) => ({
        url: `/users/teacher/chapter/${chapterId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Modules'],
    }),
    // Upload material
    uploadMaterial: builder.mutation<any, { moduleId: number; file: File }>({
      query: ({ moduleId, file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: `/users/teacher/module/${moduleId}/materials/`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Modules', 'Material'],
    }),
    // Delete material
    deleteMaterial: builder.mutation<any, number>({
      query: (materialId) => ({
        url: `/users/teacher/material/${materialId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Modules', 'Material'],
    }),
  }),
});

export const {
  useGetModulesBySubjectQuery,
  useGetModulesBySubjectAndClassroomQuery,
  useGetChapterByIdQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
  useLazyGetModulesBySubjectQuery,
} = moduleApi;






