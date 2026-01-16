import api from '../utils/api';
import type { AxiosResponse } from 'axios';

// TypeScript Interfaces
export interface NotesPrompt {
    _id: string;
    title: string;
    content: string;
    noteType: 'patient' | 'meeting' | 'lecture';
    isSystem: boolean;
    usageCount?: number;
    lastUsedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// ============ NOTES PROMPTS API ============

/**
 * Fetch notes prompts
 * @param noteType - Type of note (patient, meeting, lecture)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 100)
 */
export const getNotesPrompts = async (
    noteType?: 'patient' | 'meeting' | 'lecture',
    page: number = 1,
    limit: number = 100
): Promise<NotesPrompt[]> => {
    const params: any = { page, limit };
    if (noteType) {
        params.noteType = noteType;
    }

    const response = await api.get<ApiResponse<PaginatedResponse<NotesPrompt>>>(
        '/event/prompts',
        { params }
    );

    return response.data.data?.docs || [];
};

/**
 * Create a new notes prompt
 */
export const createNotesPrompt = async (params: {
    title: string;
    content: string;
    noteType: 'patient' | 'meeting' | 'lecture';
}): Promise<NotesPrompt> => {
    const response = await api.post<ApiResponse<NotesPrompt>>(
        '/event/prompts',
        params
    );

    if (!response.data.success || !response.data.data) {
        throw new Error('Failed to create notes prompt');
    }

    return response.data.data;
};

/**
 * Update an existing notes prompt
 */
export const updateNotesPrompt = async (
    promptId: string,
    params: { title?: string; content?: string }
): Promise<NotesPrompt> => {
    const response = await api.put<ApiResponse<NotesPrompt>>(
        `/event/prompts/${promptId}`,
        params
    );

    if (!response.data.success || !response.data.data) {
        throw new Error('Failed to update notes prompt');
    }

    return response.data.data;
};

/**
 * Delete a notes prompt
 */
export const deleteNotesPrompt = async (promptId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(
        `/event/prompts/${promptId}`
    );

    if (!response.data.success) {
        throw new Error('Failed to delete notes prompt');
    }
};
