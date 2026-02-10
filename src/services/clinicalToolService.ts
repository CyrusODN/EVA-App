import axios from 'axios';

/**
 * Clinical Tool Service
 * Handles API calls for the Consult and Pharmacopedia tools
 * using the tools.remedius.ai backend.
 */

const TOOLS_API_BASE_URL = 'https://tools.remedius.ai/api';

export interface ConsultSession {
  _id: string;
  userId: string;
  projectId: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PastSessionsResponse {
  success: boolean;
  message: string;
  data: ConsultSession[];
}

/**
 * Fetches past consult sessions for a specific user.
 */
export const getPastConsultSessions = async (
  userId: string,
  token: string,
  limit: number = 20
) => {
  return axios.get<PastSessionsResponse>(`${TOOLS_API_BASE_URL}/consult/sessions`, {
    params: {
      userId,
      projectId: 'remedius',
      limit,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const deleteConsultSession = async (
  sessionId: string,
  token: string
) => {
  return axios.delete(`${TOOLS_API_BASE_URL}/consult/session/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    chatbotType: string;
    metadata: {
      speciality: string;
      patientInfo: object;
      context: string;
      requestingService: string;
    };
  };
}

/**
 * Creates a new consult session with a specific specialty.
 */
export const createConsultSession = async (
  userId: string,
  specialty: string,
  token: string,
  patientInfo: object = {}
) => {
  return axios.post<CreateSessionResponse>(
    `${TOOLS_API_BASE_URL}/consult/session`,
    {
      userId,
      projectId: 'remedius',
      specialty,
      patientInfo,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
export interface ConsultMessageResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    message: string;
    chatbotType: string;
    timestamp: string;
    sources: any[];
  };
}

/**
 * Sends a message to a consult session and gets a response.
 */
export const sendConsultMessage = async (
  sessionId: string,
  message: string,
  token: string,
  options: {
    additionalContext?: string;
    history?: any[];
    patientInfo?: object;
    symptoms?: string;
  } = {}
) => {
  return axios.post<ConsultMessageResponse>(
    `${TOOLS_API_BASE_URL}/consult/message`,
    {
      sessionId,
      message,
      additionalContext: options.additionalContext || '',
      history: options.history || [],
      patientInfo: options.patientInfo || {},
      symptoms: options.symptoms || '',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ==========================================================================
// PHARMACOPEDIA API FUNCTIONS
// ==========================================================================

/**
 * Fetches past pharmacopedia sessions for a specific user.
 */
export const getPastPharmaSessions = async (
  userId: string,
  token: string,
  limit: number = 20
) => {
  return axios.get<PastSessionsResponse>(
    `${TOOLS_API_BASE_URL}/pharmacopedia/sessions?userId=${userId}&projectId=remedius&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export const deletePharmaSession = async (
  sessionId: string,
  token: string
) => {
  return axios.delete(`${TOOLS_API_BASE_URL}/pharmacopedia/session/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Creates a new pharmacopedia session.
 */
export const createPharmaSession = async (
  userId: string,
  token: string
) => {
  return axios.post<CreateSessionResponse>(
    `${TOOLS_API_BASE_URL}/pharmacopedia/session`,
    {
      userId,
      projectId: 'remedius',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

/**
 * Sends a message to a pharmacopedia session and gets a response.
 */
export const sendPharmaMessage = async (
  sessionId: string,
  message: string,
  token: string,
  options: {
    additionalContext?: string;
    history?: any[];
  } = {}
) => {
  return axios.post<ConsultMessageResponse>(
    `${TOOLS_API_BASE_URL}/pharmacopedia/message`,
    {
      sessionId,
      message,
      additionalContext: options.additionalContext || '',
      history: options.history || [],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
