import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setShowToast } from '../slices/applicationSlice';

export const discussionApi = createApi({
  reducerPath: 'discussionApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Discussions', 'Discussion', 'Replies'],
  endpoints: (builder) => ({
    // Get discussions by subject
    getDiscussionsBySubject: builder.query<any, { subjectId: number; classroomId?: number }>({
      query: ({ subjectId, classroomId }) => {
        const params = classroomId ? { classroom_id: classroomId } : {};
        return {
          url: `/users/discussions/subject/${subjectId}/`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['Discussions'],
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),
    // Get discussion by ID
    getDiscussionById: builder.query<any, number>({
      query: (id) => ({
        url: `/users/discussions/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Discussion', id }],
      keepUnusedDataFor: 600, // Cache for 10 minutes
    }),
    // Create discussion post
    createDiscussion: builder.mutation<any, { subjectId: number; discussionData: any }>({
      query: ({ subjectId, discussionData }) => ({
        url: `/users/discussions/subject/${subjectId}/`,
        method: 'POST',
        body: discussionData,
      }),
      invalidatesTags: ['Discussions'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Discussion created successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Update discussion
    updateDiscussion: builder.mutation<any, { discussionId: number; discussionData: any }>({
      query: ({ discussionId, discussionData }) => ({
        url: `/users/discussions/${discussionId}/`,
        method: 'PUT',
        body: discussionData,
      }),
      invalidatesTags: (_result, _error, { discussionId }) => [
        'Discussions',
        { type: 'Discussion', id: discussionId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Discussion updated successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Delete discussion
    deleteDiscussion: builder.mutation<any, number>({
      query: (discussionId) => ({
        url: `/users/discussions/${discussionId}/`,
        method: 'DELETE',
      }),
      async onQueryStarted(discussionId, { dispatch, queryFulfilled, getState }) {
        // Get current query args from state to match the cache key
        const state = getState() as any;
        const discussionApiState = state.discussionApi;
        
        // Find all cached queries for getDiscussionsBySubject and update them optimistically
        const queries = discussionApiState?.queries || {};
        const patchResults: any[] = [];
        
        Object.keys(queries).forEach((queryKey) => {
          if (queryKey.includes('getDiscussionsBySubject')) {
            const queryData = queries[queryKey];
            if (queryData?.data && queryData?.originalArgs) {
              const patchResult = dispatch(
                discussionApi.util.updateQueryData(
                  'getDiscussionsBySubject',
                  queryData.originalArgs,
                  (draft: any) => {
                    const discussions = Array.isArray(draft) ? draft : [];
                    const discussionIndex = discussions.findIndex((d: any) => d.id === discussionId);
                    if (discussionIndex !== -1) {
                      discussions.splice(discussionIndex, 1);
                    }
                  }
                )
              );
              patchResults.push(patchResult);
            }
          }
        });

        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Discussion deleted successfully!',
            }),
          );
        } catch (error) {
          // Revert optimistic updates on error
          patchResults.forEach((patch) => patch.undo());
          // Error toast is handled by baseQueryWithReauth
        }
      },
      // Don't invalidate tags to avoid refetch - optimistic update handles UI
      // invalidatesTags: [],
    }),
    // Submit discussion reply
    submitDiscussionReply: builder.mutation<any, { discussionId: number; replyData: any }>({
      query: ({ discussionId, replyData }) => ({
        url: `/users/discussions/${discussionId}/reply/`,
        method: 'POST',
        body: replyData,
      }),
      async onQueryStarted({ discussionId, replyData }, { dispatch, queryFulfilled }) {
        const tempId = -Date.now(); // Negative ID to identify optimistic reply
        
        // Optimistic update - add reply to discussion
        const patchResult = dispatch(
          discussionApi.util.updateQueryData(
            'getDiscussionById',
            discussionId,
            (draft: any) => {
              if (draft && draft.replies) {
                const optimisticReply = {
                  id: tempId,
                  message: replyData.message,
                  author_name: 'You',
                  created_at: new Date().toISOString(),
                  like_count: 0,
                  liked_by_me: false,
                  is_mine: true,
                };
                draft.replies = [optimisticReply, ...draft.replies];
              }
            }
          )
        );

        try {
          const result = await queryFulfilled;
          // Replace optimistic reply with actual reply from server
          if (result.data) {
            dispatch(
              discussionApi.util.updateQueryData(
                'getDiscussionById',
                discussionId,
                (draft: any) => {
                  if (draft && draft.replies) {
                    const optimisticIndex = draft.replies.findIndex((r: any) => r.id === tempId);
                    if (optimisticIndex !== -1) {
                      draft.replies[optimisticIndex] = result.data;
                    }
                  }
                }
              )
            );
          }
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { discussionId }) => [
        { type: 'Discussion', id: discussionId },
        'Replies',
      ],
    }),
    // Update reply
    updateReply: builder.mutation<any, { replyId: number; replyData: any; discussionId?: number }>({
      query: ({ replyId, replyData }) => ({
        url: `/users/replies/${replyId}/`,
        method: 'PUT',
        body: replyData,
      }),
      async onQueryStarted({ replyId, replyData, discussionId }, { dispatch, queryFulfilled, getState }) {
        let foundDiscussionId = discussionId;
        
        // If discussionId not provided, find it from cached queries
        if (!foundDiscussionId) {
          const state = getState() as any;
          const discussionApiState = state.discussionApi;
          const queries = discussionApiState?.queries || {};
          
          Object.keys(queries).forEach((queryKey) => {
            if (queryKey.includes('getDiscussionById')) {
              const queryData = queries[queryKey];
              if (queryData?.data?.replies) {
                const replyExists = queryData.data.replies.some((r: any) => r.id === replyId);
                if (replyExists && queryData.originalArgs) {
                  foundDiscussionId = queryData.originalArgs;
                }
              }
            }
          });
        }

        if (foundDiscussionId) {
          // Optimistic update
          const patchResult = dispatch(
            discussionApi.util.updateQueryData(
              'getDiscussionById',
              foundDiscussionId,
              (draft: any) => {
                if (draft && draft.replies) {
                  const replyIndex = draft.replies.findIndex((r: any) => r.id === replyId);
                  if (replyIndex !== -1) {
                    draft.replies[replyIndex] = {
                      ...draft.replies[replyIndex],
                      message: replyData.message,
                    };
                  }
                }
              }
            )
          );

          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        }
      },
      invalidatesTags: ['Replies', 'Discussion'],
    }),
    // Delete reply
    deleteReply: builder.mutation<any, number>({
      query: (replyId) => ({
        url: `/users/replies/${replyId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Replies', 'Discussion'],
      async onQueryStarted(_replyId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: 'Reply deleted successfully!',
            }),
          );
        } catch (error) {
          // Error toast is handled by baseQueryWithReauth
        }
      },
    }),
    // Like/Unlike reply
    likeReply: builder.mutation<any, number>({
      query: (replyId) => ({
        url: `/users/replies/${replyId}/like/`,
        method: 'POST',
      }),
      async onQueryStarted(replyId, { dispatch, queryFulfilled, getState }) {
        // Get the discussion ID from the current discussion query
        const state = getState() as any;
        const discussionApiState = state.discussionApi;
        const queries = discussionApiState?.queries || {};
        
        // Find the current discussion query
        let discussionId: number | null = null;
        Object.keys(queries).forEach((queryKey) => {
          if (queryKey.includes('getDiscussionById')) {
            const queryData = queries[queryKey];
            if (queryData?.data?.id) {
              discussionId = queryData.data.id;
            }
          }
        });

        // Optimistic update for the discussion
        if (discussionId) {
          const patchResult = dispatch(
            discussionApi.util.updateQueryData(
              'getDiscussionById',
              discussionId,
              (draft: any) => {
                if (draft && draft.replies) {
                  const replyIndex = draft.replies.findIndex((r: any) => r.id === replyId);
                  if (replyIndex !== -1) {
                    const reply = draft.replies[replyIndex];
                    const isCurrentlyLiked = reply.liked_by_me === true || reply.is_liked_by_me === true;
                    
                    // Toggle like state
                    reply.liked_by_me = !isCurrentlyLiked;
                    reply.is_liked_by_me = !isCurrentlyLiked;
                    
                    // Update like count
                    if (isCurrentlyLiked) {
                      reply.like_count = Math.max(0, (reply.like_count || 0) - 1);
                    } else {
                      reply.like_count = (reply.like_count || 0) + 1;
                    }
                  }
                }
              }
            )
          );

          try {
            await queryFulfilled;
          } catch (error) {
            // Revert optimistic update on error
            patchResult.undo();
            // Error toast is handled by baseQueryWithReauth
          }
        } else {
          // If no discussion found, just wait for the query to complete
          try {
            await queryFulfilled;
          } catch (error) {
            // Error toast is handled by baseQueryWithReauth
          }
        }
      },
      // Don't invalidate tags - optimistic update handles UI
      // invalidatesTags: ['Replies', 'Discussion'],
    }),
    // Lock/Unlock discussion (teacher only)
    lockDiscussion: builder.mutation<any, { discussionId: number; isLocked: boolean }>({
      query: ({ discussionId, isLocked }) => ({
        url: `/users/discussions/${discussionId}/lock/`,
        method: 'PATCH',
        body: { is_locked: isLocked },
      }),
      async onQueryStarted({ discussionId, isLocked }, { dispatch, queryFulfilled, getState }) {
        // Get current query args from state to match the cache key
        const state = getState() as any;
        const discussionApiState = state.discussionApi;
        
        // Find all cached queries for getDiscussionsBySubject and update them optimistically
        const queries = discussionApiState?.queries || {};
        const patchResults: any[] = [];
        
        Object.keys(queries).forEach((queryKey) => {
          if (queryKey.includes('getDiscussionsBySubject')) {
            const queryData = queries[queryKey];
            if (queryData?.data && queryData?.originalArgs) {
              const patchResult = dispatch(
                discussionApi.util.updateQueryData(
                  'getDiscussionsBySubject',
                  queryData.originalArgs,
                  (draft: any) => {
                    const discussions = Array.isArray(draft) ? draft : [];
                    const discussionIndex = discussions.findIndex((d: any) => d.id === discussionId);
                    if (discussionIndex !== -1) {
                      discussions[discussionIndex] = {
                        ...discussions[discussionIndex],
                        is_locked: isLocked,
                      };
                    }
                  }
                )
              );
              patchResults.push(patchResult);
            }
          }
        });

        // Optimistic update for single discussion
        const patchResult2 = dispatch(
          discussionApi.util.updateQueryData(
            'getDiscussionById',
            discussionId,
            (draft: any) => {
              if (draft) {
                draft.is_locked = isLocked;
              }
            }
          )
        );

        try {
          await queryFulfilled;
          dispatch(
            setShowToast({
              show: true,
              type: 'success',
              toastMessage: isLocked ? 'Discussion locked successfully!' : 'Discussion unlocked successfully!',
            }),
          );
        } catch (error) {
          // Revert optimistic updates on error
          patchResults.forEach((patch) => patch.undo());
          patchResult2.undo();
          // Error toast is handled by baseQueryWithReauth
        }
      },
      // Don't invalidate tags to avoid refetch - optimistic update handles UI
      // invalidatesTags: [],
    }),
  }),
});

export const {
  useGetDiscussionsBySubjectQuery,
  useLazyGetDiscussionsBySubjectQuery,
  useGetDiscussionByIdQuery,
  useLazyGetDiscussionByIdQuery,
  useCreateDiscussionMutation,
  useUpdateDiscussionMutation,
  useDeleteDiscussionMutation,
  useSubmitDiscussionReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
  useLikeReplyMutation,
  useLockDiscussionMutation,
} = discussionApi;



