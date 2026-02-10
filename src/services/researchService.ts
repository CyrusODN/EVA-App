import api from '../utils/api';

/**
 * Research Assistant Service
 * Handles document uploads and chat functionality for the Research tool.
 */

const API_PATH = '/tools/document';
const ASSISTANT_PATH = '/tools/assistant';

export interface InitiateUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploadId: string;
    key: string;
    
  };
}

export interface UploadPartResponse {
  success: boolean;
  message: string;
  data: {
    ETag: string;
    PartNumber: number;
  };
}

export interface CompleteUploadResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    title: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    toolType: string;
    summary: {
      keyFindings: string | null;
      methodology: string | null;
      conclusion: string | null;
    };
    isFavorite: boolean;
    isPublic: boolean;
    shareId: string | null;
    keywords: string[];
    processingStatus: string;
    processingError: string | null;
    openaiFileId: string | null;
    _id: string;
    highlights: any[];
    lastAccessedAt: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateConversationResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    threadId: string;
    title: string;
    toolType: string;
    documentIds: string[];
    messages: any[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    conversationId: string;
  };
}

/**
 * Initiates a document upload.
 */
export const initiateUpload = async (
  title: string,
  fileType: string,
  toolType: string = 'scholar',
  token: string
) => {
  return api.post<InitiateUploadResponse>(
    `${API_PATH}/initiate-upload`,
    {
      title,
      fileType,
      toolType,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Uploads a part of the document.
 */
export const uploadPart = async (
  fileUri: string,
  fileType: string,
  fileName: string,
  uploadId: string,
  key: string,
  partNumber: number = 1,
  token: string
) => {
  const formData = new FormData();
  formData.append('uploadId', uploadId);
  formData.append('key', key);
  formData.append('partNumber', partNumber.toString());
  formData.append('part', {
    uri: fileUri,
    type: fileType,
    name: fileName,
  } as any);
  
  return api.post<UploadPartResponse>(
    `${API_PATH}/upload-part`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

/**
 * Completes the document upload.
 */
export const completeUpload = async (
  payload: {
    fileSize: number;
    fileType: string;
    key: string;
    parts: Array<{ ETag: string; PartNumber: number }>;
    title: string;
    toolType: string;
    uploadId: string;
  },
  token: string
) => {
  return api.post<CompleteUploadResponse>(
    `${API_PATH}/complete-upload`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Creates a new conversation for the research tool.
 */
export const createConversation = async (
  documentIds: string[],
  title: string,
  toolType: string = 'scholar',
  token: string
) => {
  return api.post<CreateConversationResponse>(
    `${ASSISTANT_PATH}/conversations`,
    {
      documentIds,
      title,
      toolType,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Sends a message in a research conversation.
 */
export const sendMessage = async (
  conversationId: string,
  documentIds: string[],
  message: string,
  token: string
) => {
  return api.post<SendMessageResponse>(
    `${ASSISTANT_PATH}/conversations/${conversationId}/messages`,
    {
      documentIds,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Fetches prompts for the research tool.
 */
export const getPrompts = async (
  toolType: string = 'scholar',
  token: string
) => {
  return api.get(`/prompts?toolType=${toolType}&page=1&limit=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Creates a new prompt template.
 */
export const savePrompt = async (
  payload: {
    title: string;
    content: string;
    toolType: string;
  },
  token: string
) => {
  return api.post('/prompts', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Deletes a prompt template.
 */
export const deletePrompt = async (id: string, token: string) => {
  return api.delete(`/prompts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const researchService = {
  initiateUpload,
  uploadPart,
  completeUpload,
  createConversation,
  sendMessage,
  getPrompts,
  savePrompt,
  deletePrompt,
};

export default researchService;
