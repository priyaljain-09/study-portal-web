import { configureStore } from "@reduxjs/toolkit";
import applicationReducer from "./slices/applicationSlice";
import dashboardReducer from "./slices/dashboard";
import { moduleApi } from "./api/moduleApi";
import { discussionApi } from "./api/discussionApi";
import { announcementApi } from "./api/announcementApi";
import { syllabusApi } from "./api/syllabusApi";
import { gradesApi } from "./api/gradesApi";
import { peopleApi } from "./api/peopleApi";
import { assignmentApi } from "./api/assignmentApi";

export const store = configureStore({
  reducer: {
    applicationData: applicationReducer,
    dashboard: dashboardReducer,
    [moduleApi.reducerPath]: moduleApi.reducer,
    [discussionApi.reducerPath]: discussionApi.reducer,
    [announcementApi.reducerPath]: announcementApi.reducer,
    [syllabusApi.reducerPath]: syllabusApi.reducer,
    [gradesApi.reducerPath]: gradesApi.reducer,
    [peopleApi.reducerPath]: peopleApi.reducer,
    [assignmentApi.reducerPath]: assignmentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      moduleApi.middleware,
      discussionApi.middleware,
      announcementApi.middleware,
      syllabusApi.middleware,
      gradesApi.middleware,
      peopleApi.middleware,
      assignmentApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
