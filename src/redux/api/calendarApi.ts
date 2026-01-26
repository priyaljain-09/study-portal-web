import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface CalendarEventAPI {
  id: number;
  title: string;
  description: string;
  event_type: 'holiday' | 'exam' | 'function' | 'meeting' | 'other';
  event_type_display: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  academic_year: number;
  academic_year_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface FetchEventsParams {
  academic_year_id?: number;
  event_type?: 'holiday' | 'exam' | 'function' | 'meeting' | 'other';
  month?: number;
  year?: number;
}

export const calendarApi = createApi({
  reducerPath: 'calendarApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CalendarEvents'],
  endpoints: (builder) => ({
    fetchCalendarEvents: builder.query<CalendarEventAPI[], FetchEventsParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.academic_year_id) {
          queryParams.append('academic_year_id', params.academic_year_id.toString());
        }
        if (params?.event_type) {
          queryParams.append('event_type', params.event_type);
        }
        if (params?.month) {
          queryParams.append('month', params.month.toString());
        }
        if (params?.year) {
          queryParams.append('year', params.year.toString());
        }

        const queryString = queryParams.toString();
        return {
          url: `/users/events/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['CalendarEvents'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useFetchCalendarEventsQuery } = calendarApi;

