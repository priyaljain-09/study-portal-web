export interface LoginCredentials {
  school_code: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  domain: string;
  role: string;
  tenant: string;
  school_name: string;
  class_teacher_of?: Array<{
    id: number;
    name: string;
    section: string | null;
  }>;
}

export interface UserProfile {
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  [key: string]: any;
}

export interface SchoolData {
  id?: string;
  name?: string;
  domain?: string;
  [key: string]: any;
}

export interface IApplicationState {
  isLoading: boolean;
  successLogin: boolean;
  type: string;
  toastMessage: string;
  showToast: boolean;
  showWarningModal: boolean;
  role: string;
  userRole: string;
  schoolData: SchoolData;
  userProfile: UserProfile | null;
  isFetchingProfile: boolean;
}


