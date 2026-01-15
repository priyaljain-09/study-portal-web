import { configureStore } from "@reduxjs/toolkit";
import applicationReducer from "./slices/applicationSlice";

export const store = configureStore({
  reducer: {
    applicationData: applicationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
