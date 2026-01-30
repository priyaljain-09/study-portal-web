import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface VocabularyWord {
  id: number;
  date: string;
  word: string;
  definition: string;
  part_of_speech: string;
  example: string;
  created_at: string;
  created_by: {
    id: number;
    username: string;
    role: string;
  };
  classroom: {
    id: number;
    name: string;
    section: string | null;
    display: string;
  };
  type: 'user' | 'system';
}

export interface VocabularyHistoryResponse {
  results: VocabularyWord[];
  count: number;
}

export interface SubmitVocabularyPayload {
  word: string;
  definition: string;
  part_of_speech: string;
  example: string;
}

export const vocabularyApi = createApi({
  reducerPath: 'vocabularyApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['VocabularyToday', 'VocabularyHistory'],
  endpoints: (builder) => ({
    getVocabularyToday: builder.query<VocabularyWord, void>({
      query: () => ({
        url: '/v1/vocabulary/today/',
        method: 'GET',
      }),
      providesTags: ['VocabularyToday'],
      keepUnusedDataFor: 300,
    }),
    getVocabularyHistory: builder.query<VocabularyHistoryResponse, { limit?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) {
          queryParams.append('limit', params.limit.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/v1/vocabulary/history/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['VocabularyHistory'],
      keepUnusedDataFor: 300,
    }),
    submitVocabulary: builder.mutation<VocabularyWord, SubmitVocabularyPayload>({
      query: (payload) => ({
        url: '/v1/vocabulary/submit/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['VocabularyToday', 'VocabularyHistory'],
    }),
  }),
});

export const {
  useGetVocabularyTodayQuery,
  useGetVocabularyHistoryQuery,
  useSubmitVocabularyMutation,
} = vocabularyApi;

