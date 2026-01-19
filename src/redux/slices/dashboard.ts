import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../api/axiosInterceptor';
import type { AppDispatch } from '../store';
import type { IDashboardState } from '../../types/dashboard';
import { setIsLoading, setShowToast } from './applicationSlice';

const initialState: IDashboardState = {
    allSubjects: {},
    subjectSyllabus: [],
    subjectPeople: {},
    teacherDashboardData: {},
};

const slice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        getDashboardSubjects(state, action: PayloadAction<any>) {
            state.allSubjects = action.payload;
        },
        getSubjectSyllabus(state, action: PayloadAction<any>) {
            // Sort by order key in ascending order
            const syllabus = Array.isArray(action.payload) ? action.payload : [];
            state.subjectSyllabus = syllabus.sort((a: any, b: any) => {
                const orderA = a.order ?? 0;
                const orderB = b.order ?? 0;
                return orderA - orderB;
            });
        },
        getSubjectPeople(state, action: PayloadAction<any>) {
            state.subjectPeople = action.payload;
        },
        getTeacherDashboard(state, action: PayloadAction<any>) {
            state.teacherDashboardData = action.payload;
        },
        addSyllabusItem(state, action: PayloadAction<any>) {
            if (Array.isArray(state.subjectSyllabus)) {
                state.subjectSyllabus.push(action.payload);
            } else {
                state.subjectSyllabus = [action.payload];
            }
        },
        updateSyllabusItem(state, action: PayloadAction<{ id: number; updatedItem: any }>) {
            if (Array.isArray(state.subjectSyllabus)) {
                const index = state.subjectSyllabus.findIndex(
                    (item: any) => item.id === action.payload.id
                );
                if (index !== -1) {
                    state.subjectSyllabus[index] = {
                        ...state.subjectSyllabus[index],
                        ...action.payload.updatedItem,
                    };
                }
            }
        },
        removeSyllabusItem(state, action: PayloadAction<number>) {
            if (Array.isArray(state.subjectSyllabus)) {
                state.subjectSyllabus = state.subjectSyllabus.filter(
                    (item: any) => item.id !== action.payload
                );
            }
        },
    },
});

export const {
    getDashboardSubjects,
    getSubjectSyllabus,
    getSubjectPeople,
    getTeacherDashboard,
    addSyllabusItem,
    updateSyllabusItem,
    removeSyllabusItem,
} = slice.actions;

export default slice.reducer;

export function fetchDashboardSubject() {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const response = await api.get("/users/student/dashboard/");
            dispatch(getDashboardSubjects(response.data));
            return response.status;
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
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

export function fetchSyllabusBySubject(id: number, classroomId?: number) {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const params: any = {};
            if (classroomId) {
                params.classroom_id = classroomId;
            }
            const response = await api.get(`/users/subject/${id}/syllabus/`, { params });
            dispatch(getSubjectSyllabus(response.data));
            return response.status;
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
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

export function fetchPeopleBySubject(
    id: number,
    classroomId?: number,
    filter: 'all' | 'students' | 'teachers' = 'all',
) {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const response = await api.get(`/users/subjects/${id}/people/`, {
                params: {
                    ...(classroomId && { classroom_id: classroomId }),
                    filter,
                },
            });
            dispatch(getSubjectPeople(response.data));
            return response.data;
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
            return null;
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

export function fetchTeacherDashboardSubjects() {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const response = await api.get("/users/teacher/dashboard/");
            // Keep the response as is - classes array will be used directly in the component
            dispatch(getTeacherDashboard(response.data));
            return response.status;
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
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

// Create syllabus item (Teacher)
export function createSyllabusItem(
    classroomId: number,
    subjectId: number,
    syllabusData: {
        chapter_name: string;
        description: string;
        assessment_name: string;
        order: number;
    }
) {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const response = await api.post(
                `/users/teacher/classrooms/${classroomId}/subjects/${subjectId}/syllabus/`,
                syllabusData
            );
            dispatch(
                setShowToast({
                    show: true,
                    type: 'success',
                    toastMessage: 'Syllabus item created successfully!',
                })
            );
            dispatch(addSyllabusItem(response.data));
            return response.data;
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
            return null;
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

// Update syllabus item (Teacher)
export function updateSyllabusItemById(
    syllabusItemId: number,
    syllabusData: {
        chapter_name: string;
        description: string;
        assessment_name: string;
        order: number;
    }
) {
    return async (dispatch: AppDispatch) => {
        dispatch(setIsLoading(true));
        try {
            const response = await api.put(
                `/users/teacher/syllabus/${syllabusItemId}/`,
                syllabusData
            );
            dispatch(
                setShowToast({
                    show: true,
                    type: 'success',
                    toastMessage: 'Syllabus item updated successfully!',
                })
            );
            dispatch(updateSyllabusItem({ id: syllabusItemId, updatedItem: response.data }));
            return response.data;
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
            return null;
        } finally {
            dispatch(setIsLoading(false));
        }
    };
}

// Delete syllabus item (Teacher)
export function deleteSyllabusItem(syllabusItemId: number) {
    return async (dispatch: AppDispatch) => {
        // Don't use global loading - use local loading state in component
        try {
            const response = await api.delete(
                `/users/teacher/syllabus/${syllabusItemId}/`
            );
            dispatch(
                setShowToast({
                    show: true,
                    type: 'success',
                    toastMessage: 'Syllabus item deleted successfully!',
                })
            );
            dispatch(removeSyllabusItem(syllabusItemId));
            return response.status;
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
            return null;
        }
    };
}