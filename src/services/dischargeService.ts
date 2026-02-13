import api from '../utils/api';
import type { AxiosResponse } from 'axios';

// Interfaces for Discharge types
export interface DischargeSection {
  name: string;
  content: string;
}

export interface DischargeTemplate {
  _id: string;
  name: string;
  sections: DischargeSection[];
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DischargeSummary {
  _id: string;
  patientId?: string;
  title: string;
  content: string;
  observations: any[];
  templateId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPrompt {
  _id: string;
  title: string;
  content: string;
  toolType: string;
  isSystem: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Discharge Service Implementation
 * Handles communication with /api/tools/discharge endpoints
 */
const dischargeService = {
  // --- Templates ---

  /**
   * Get prompt templates
   * GET /api/prompts
   */
  getPrompts: (params: {
    toolType: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<{ docs: CustomPrompt[] }>>> => {
    return api.get('/prompts', { params });
  },

  /**
   * Save a prompt template
   * POST /api/prompts
   */
  savePrompt: (data: {
    title: string;
    content: string;
    toolType: string;
  }): Promise<AxiosResponse<ApiResponse<CustomPrompt>>> => {
    return api.post('/prompts', data);
  },

  /**
   * Update a custom discharge template
   * PUT /api/tools/discharge/templates/{id}
   */
  updateTemplate: (
    templateId: string,
    data: {
      name?: string;
      sections?: DischargeSection[];
    },
  ): Promise<AxiosResponse<ApiResponse<DischargeTemplate>>> => {
    return api.put(`/tools/discharge/templates/${templateId}`, data);
  },

  /**
   * Delete a prompt template
   * DELETE /api/prompts/{id}
   */
  deletePrompt: (
    promptId: string,
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return api.delete(`/prompts/${promptId}`);
  },

  // --- Summaries ---

  /**
   * List discharge summaries
   * GET /api/tools/discharge/summaries
   */
  getSummaries: (): Promise<AxiosResponse<ApiResponse<DischargeSummary[]>>> => {
    return api.get('/tools/discharge/summaries');
  },

  /**
   * Get a discharge summary by ID
   * GET /api/tools/discharge/summary/{id}
   */
  getSummaryById: (
    summaryId: string,
  ): Promise<AxiosResponse<ApiResponse<DischargeSummary>>> => {
    return api.get(`/tools/discharge/summary/${summaryId}`);
  },

  /**
   * Generate a discharge summary
   * POST /api/tools/discharge/summary/generate
   */
  generateSummary: (data: {
    observations: Array<{
      content: string;
      categories: string[];
      tags: string[];
      timestamp: string;
    }>;
    promptId: string;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        summaryId: string;
        summary: string;
      }>
    >
  > => {
    return api.post('/tools/discharge/summary/generate', data);
  },

  /**
   * Update a discharge summary
   * PUT /api/tools/discharge/summary/{id}
   */
  updateSummary: (
    summaryId: string,
    data: {
      title?: string;
      content?: string;
      observations?: any[];
    },
  ): Promise<AxiosResponse<ApiResponse<DischargeSummary>>> => {
    return api.put(`/tools/discharge/summary/${summaryId}`, data);
  },

  /**
   * Delete a discharge summary
   * DELETE /api/tools/discharge/summary/{id}
   */
  deleteSummary: (
    summaryId: string,
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return api.delete(`/tools/discharge/summary/${summaryId}`);
  },

  /**
   * Generate a medical certificate
   * POST /api/tools/report/generate-certificate
   */
  generateCertificate: (
    data: any,
    token?: string,
  ): Promise<
    AxiosResponse<
      ApiResponse<{
        certificateContent: string;
        certificateType: string;
        eventsIncluded: number;
        documentsIncluded: number;
      }>
    >
  > => {
    const config: any = {};
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    // Check if data is FormData
    if (data instanceof FormData) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      };
      return api.post('/tools/report/generate-certificate', data, config);
    }

    const payload: any = {
      observations: data.observations,
      certificateType: data.certificateType,
    };

    if (data.eventIds && data.eventIds.length > 0) {
      payload.eventIds = data.eventIds;
    }

    return api.post('/tools/report/generate-certificate', payload, config);
  },
};

export default dischargeService;
