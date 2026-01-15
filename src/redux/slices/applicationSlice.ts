import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';
import type { IApplicationState, LoginCredentials, UserProfile, SchoolData } from '../../types/application';
import { api } from '../../api/axiosInterceptor';

const initialState: IApplicationState = {
  isLoading: false,
  successLogin: false,
  type: "",
  toastMessage: "",
  showToast: false,
  showWarningModal: false,
  role: "teacher",
  userRole: "",
  schoolData: {},
  userProfile: null,
  isFetchingProfile: false,
};

const slice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    loginsuccess(state, action: PayloadAction<boolean>) {
      state.successLogin = action.payload;
    },
    setUserRole: (state, action: PayloadAction<string>) => {
      state.userRole = action.payload;
    },
    createSchool(state, action: PayloadAction<SchoolData>) {
      state.schoolData = action.payload;
    },
    setShowToast(state, action: PayloadAction<{ show: boolean; toastMessage: string; type: string }>) {
      state.showToast = action.payload.show;
      state.toastMessage = action.payload.toastMessage;
      state.type = action.payload.type;
    },
    setWarningModal(state, action: PayloadAction<{ show: boolean; toastMessage: string; type: string }>) {
      state.showWarningModal = action.payload.show;
      state.toastMessage = action.payload.toastMessage;
      state.type = action.payload.type;
    },
    setUserProfile(state, action: PayloadAction<UserProfile>) {
      state.userProfile = action.payload;
      state.isFetchingProfile = false;
    },
    setIsFetchingProfile(state, action: PayloadAction<boolean>) {
      state.isFetchingProfile = action.payload;
    },
    resetAuthState(state) {
      state.successLogin = false;
      state.userRole = "";
      state.isLoading = false;
      state.showToast = false;
      state.toastMessage = "";
      state.type = "";
      state.userProfile = null;
      state.isFetchingProfile = false;
    },
  },
});

export const { 
  setIsLoading, 
  loginsuccess, 
  setUserRole, 
  setShowToast, 
  setWarningModal, 
  createSchool, 
  resetAuthState, 
  setUserProfile, 
  setIsFetchingProfile 
} = slice.actions;

export default slice.reducer;

export function login(data: LoginCredentials) {
  return async (dispatch: AppDispatch) => {
    dispatch(setIsLoading(true));
    try {
      const response = await api.post('/auth/login/', data);
      const { access, domain, role, tenant, school_name } = response.data;

      await localStorage.setItem('accessToken', access);
      await localStorage.setItem('schoolDomain', domain);
      await localStorage.setItem('tenant', tenant);
      await localStorage.setItem('schoolName', school_name);
      await localStorage.setItem('userRole', role);
      dispatch(loginsuccess(true));
      dispatch(setUserRole(role));
      
      // Fetch user profile after successful login
      dispatch(fetchUserProfile());
      
      return response.status;

    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || "Something went wrong!";
      dispatch(
        setShowToast({
          show: true,
          type: "error",
          toastMessage: errorMessage,
        })
      );
    } finally {
      dispatch(setIsLoading(false));
    }
  };
}

// Async thunk for fetching user profile
export function fetchUserProfile() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const currentProfile = state.applicationData.userProfile;
    const isFetchingProfile = state.applicationData.isFetchingProfile;
    
    // Only fetch if profile is null or user data is missing
    if (currentProfile && currentProfile.user?.id && currentProfile.user?.username) {
      return { status: 200, data: currentProfile };
    }
    
    // Prevent multiple simultaneous API calls
    if (isFetchingProfile) {
      return { status: 200, data: currentProfile };
    }
    
    dispatch(setIsFetchingProfile(true));
    dispatch(setIsLoading(true));
    try {
      const response = await api.get(`/users/profile/`);
      const profileData = response.data;
      // Store user profile in Redux state only (not in localStorage)
      dispatch(setUserProfile(profileData));
      
      return { status: response.status, data: profileData };
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Something went wrong!';
      dispatch(
        setShowToast({
          show: true,
          type: 'error',
          toastMessage: errorMessage,
        }),
      );
      dispatch(setIsFetchingProfile(false));
      return null;
    } finally {
      dispatch(setIsLoading(false));
    }
  };
}

// Async thunk for registering school
export function registerSchool(data: any) {
  return async (dispatch: AppDispatch) => {
    dispatch(setIsLoading(true));
    try {
      const response = await api.post('/schools/create/', data);
      dispatch(createSchool(response.data));
      return {status: response.status, data: response.data};
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || "Something went wrong!";
      dispatch(
        setShowToast({
          show: true,
          type: "error",
          toastMessage: errorMessage,
        })
      );
      throw error;
    } finally {
      dispatch(setIsLoading(false));
    }
  };
}

// Async thunk for logout
export const logout = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(setIsLoading(true));
    try {
      // Clear localStorage (web equivalent of AsyncStorage)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('schoolDomain');
      localStorage.removeItem('tenant');
      localStorage.removeItem('schoolName');
      localStorage.removeItem('userRole');
      
      dispatch(resetAuthState());
      
      // Reset dashboard data if needed (can be added later)
      // dispatch(getDashboardSubjects({}));
      // dispatch(getTeacherDashboard({}));
    } catch (error) {
      dispatch(
        setShowToast({
          show: true,
          type: "error",
          toastMessage: "Something went wrong!",
        })
      );
    } finally {
      dispatch(setIsLoading(false));
    }
  };
};
