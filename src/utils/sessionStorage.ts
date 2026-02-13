import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEvent,
  deleteEvent,
  updateEvent,
  resetEvent,
} from '../services/authService';

export type SessionType = 'patient' | 'meeting' | 'lecture';
export type SessionStatus = 'new' | 'recorded' | 'transcribed' | 'completed';

export interface Session {
  id: string;
  sessionId?: string; // Backend event ID from API
  title: string;
  type: SessionType;
  date: string;
  duration: string | null;
  hasRecording: boolean;
  hasTranscription: boolean;
  status: SessionStatus;
  transcriptText?: string | null;
  utterances?: any[] | null;
  audioPath?: string | null;
  generatedNotes?: string | null; // Generated notes from AI
  noteGenerationMeta?: {
    generationMode: string;
    specializationLabel?: string;
    visitTypeLabel?: string;
    customTemplateTitle?: string;
  };
}

const STORAGE_KEY = 'remedy_ai_sessions';

export const sessionStorage = {
  async getAllSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sessions from storage:', error);
      return [];
    }
  },

  async saveSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session to storage:', error);
      throw error;
    }
  },

  async getSessionById(id: string): Promise<Session | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find((s) => s.id === id) || null;
    } catch (error) {
      console.error('Error getting session by id:', error);
      return null;
    }
  },

  async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const sessionToDelete = sessions.find((s) => s.id === id);

      // Delete from backend API if sessionId exists
      if (sessionToDelete?.sessionId) {
        try {
          await deleteEvent(sessionToDelete.sessionId);
          console.log(
            '[SessionStorage] Session deleted from backend:',
            sessionToDelete.sessionId,
          );
        } catch (apiError: any) {
          // Swallow 403/404 to allow local cleanup
          if (
            apiError?.response?.status === 403 ||
            apiError?.response?.status === 404
          ) {
            console.warn(
              '[SessionStorage] Backend delete failed (ignoring):',
              apiError.response.status,
            );
          } else {
            console.error(
              '[SessionStorage] Failed to delete session from backend:',
              apiError,
            );
          }
        }
      }

      // Delete audio file if it exists
      if (sessionToDelete?.audioPath) {
        try {
          const RNFS = require('react-native-fs');
          const fileExists = await RNFS.exists(sessionToDelete.audioPath);
          if (fileExists) {
            await RNFS.unlink(sessionToDelete.audioPath);
            console.log(
              '[SessionStorage] Deleted audio file:',
              sessionToDelete.audioPath,
            );
          }
        } catch (fileError) {
          console.error(
            '[SessionStorage] Failed to delete audio file:',
            fileError,
          );
          // Continue with session deletion even if file deletion fails
        }
      }

      // Remove session from AsyncStorage
      const filteredSessions = sessions.filter((s) => s.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
      console.log('[SessionStorage] Session deleted from storage:', id);
    } catch (error) {
      console.error('Error deleting session from storage:', error);
      throw error;
    }
  },

  async deleteSessions(ids: string[]): Promise<void> {
    console.log(
      `[SessionStorage] Starting bulk delete for ${ids.length} sessions...`,
    );
    try {
      const sessions = await this.getAllSessions();
      const idsSet = new Set(ids);

      // Also attempt backend delete for each
      const sessionsToDelete = sessions.filter((s) => idsSet.has(s.id));
      for (const s of sessionsToDelete) {
        if (s.sessionId) {
          try {
            console.log(
              `[SessionStorage] Deleting session ${s.sessionId} from backend...`,
            );
            await deleteEvent(s.sessionId);
            console.log(
              `[SessionStorage] Successfully deleted session ${s.sessionId} from backend.`,
            );
          } catch (e: any) {
            if (e?.response?.status === 403 || e?.response?.status === 404) {
              console.warn(
                '[SessionStorage] Batch delete backend failed (ignoring):',
                e.response.status,
              );
            } else {
              console.warn(
                `[SessionStorage] Batch delete backend fail for session ${s.sessionId}:`,
                e,
              );
            }
          }
        } else {
          console.log(
            `[SessionStorage] Session ${s.id} has no backend sessionId, skipping remote delete.`,
          );
        }
      }

      const filteredSessions = sessions.filter((s) => !idsSet.has(s.id));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
      console.log(
        `[SessionStorage] Successfully updated local storage. ${ids.length} sessions removed.`,
      );
    } catch (error) {
      console.error('[SessionStorage] Error during bulk delete:', error);
      throw error;
    }
  },

  async getSessionsByType(type: SessionType): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter((s) => s.type === type);
    } catch (error) {
      console.error('Error getting sessions by type:', error);
      return [];
    }
  },

  async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing sessions from storage:', error);
      throw error;
    }
  },

  async createSession(
    title: string,
    type: SessionType,
    initialStatus: SessionStatus = 'new',
  ): Promise<Session> {
    const newSession: Session = {
      id: Date.now().toString(),
      title,
      type,
      date: new Date().toISOString(),
      duration: null,
      hasRecording: false,
      hasTranscription: false,
      status: initialStatus,
      audioPath: null,
    };

    // Call the API to create the event on the server
    try {
      const response = await createEvent({
        type: type,
        title: title,
        date: newSession.date,
      });

      console.log('[SessionStorage] Event created on server successfully');
      console.log('[SessionStorage] Server response:', response.data);

      // Store the server-generated ID and other data
      if (response.data?.data?._id) {
        newSession.sessionId = response.data.data._id;
        console.log('[SessionStorage] session ID:', newSession.sessionId);
      }
    } catch (error) {
      console.error(
        '[SessionStorage] Failed to create event on server:',
        error,
      );
      // Don't throw the error - we still want to create the session locally
      // even if the API call fails
    }

    // Save the session with the sessionId if available
    await this.saveSession(newSession);

    return newSession;
  },

  async updateSessionStatus(id: string, status: SessionStatus): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.status = status;

      if (
        status === 'recorded' ||
        status === 'transcribed' ||
        status === 'completed'
      ) {
        session.hasRecording = true;
      }

      if (status === 'transcribed' || status === 'completed') {
        session.hasTranscription = true;
      }

      await this.saveSession(session);
    }
  },

  async updateSessionDuration(id: string, duration: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.duration = duration;
      session.hasRecording = true;
      await this.saveSession(session);
    }
  },

  async markSessionAsRecorded(
    id: string,
    duration: string,
    audioPath?: string,
  ): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.status = 'recorded';
      session.duration = duration;
      session.hasRecording = true;
      if (audioPath !== undefined) {
        session.audioPath = audioPath;
      }
      await this.saveSession(session);
    }
  },

  async updateSessionTitle(id: string, title: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.title = title;

      // Sync with backend
      if (session.sessionId) {
        try {
          await updateEvent(session.sessionId, { title });
          console.log('[SessionStorage] Title updated on backend');
        } catch (e: any) {
          console.warn(
            '[SessionStorage] Failed to update title on backend:',
            e,
          );
        }
      }

      await this.saveSession(session);
    }
  },

  async resetSession(id: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      // Sync with backend
      if (session.sessionId) {
        try {
          await resetEvent(session.sessionId);
          console.log('[SessionStorage] Reset on backend');
        } catch (e: any) {
          if (e?.response?.status === 403 || e?.response?.status === 404) {
            console.warn(
              '[SessionStorage] Backend reset failed (ignoring):',
              e.response.status,
            );
          } else {
            console.warn('[SessionStorage] Failed to reset on backend:', e);
          }
        }
      }

      // Preserve the sessionId (backend event ID) when resetting
      const preservedSessionId = session.sessionId;

      // Delete audio file if it exists
      if (session.audioPath) {
        try {
          const RNFS = require('react-native-fs');
          const fileExists = await RNFS.exists(session.audioPath);
          if (fileExists) {
            await RNFS.unlink(session.audioPath);
            console.log(
              '[SessionStorage] Deleted audio file during reset:',
              session.audioPath,
            );
          }
        } catch (fileError) {
          console.error(
            '[SessionStorage] Failed to delete audio file during reset:',
            fileError,
          );
          // Continue with reset even if file deletion fails
        }
      }

      session.status = 'new';
      session.duration = null;
      session.hasRecording = false;
      session.hasTranscription = false;
      session.transcriptText = null;
      session.audioPath = null;
      session.utterances = null;
      session.generatedNotes = null; // Clear generated notes

      // Restore the sessionId
      session.sessionId = preservedSessionId;

      await this.saveSession(session);
      console.log('[SessionStorage] Session reset:', id);
    }
  },

  async updateSessionTranscript(
    id: string,
    transcriptText: string,
    utterances?: any[],
  ): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      // Delete audio file after transcription since we no longer need it
      if (session.audioPath) {
        try {
          const RNFS = require('react-native-fs');
          const fileExists = await RNFS.exists(session.audioPath);
          if (fileExists) {
            await RNFS.unlink(session.audioPath);
            console.log(
              '[SessionStorage] ✅ Deleted audio file after transcription:',
              session.audioPath,
            );
          }
        } catch (fileError) {
          console.error(
            '[SessionStorage] ❌ Failed to delete audio file after transcription:',
            fileError,
          );
          // Continue with transcript save even if file deletion fails
        }
      }

      session.transcriptText = transcriptText;
      session.utterances = utterances || null;
      session.status = 'transcribed';
      session.hasTranscription = true;
      session.audioPath = null; // Clear audio path since file is deleted
      await this.saveSession(session);
      console.log(
        '[SessionStorage] 💾 Transcript saved and audio file removed for session:',
        id,
      );
    }
  },

  async updateSessionNotes(id: string, generatedNotes: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.generatedNotes = generatedNotes;
      await this.saveSession(session);
    }
  },

  async updateSessionNoteMeta(id: string, meta: any): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.noteGenerationMeta = meta;
      await this.saveSession(session);
    }
  },

  async updateSessionAfterGeneration(
    id: string,
    generatedNotes: string,
    status: SessionStatus,
  ): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.generatedNotes = generatedNotes;
      session.status = status;

      if (status === 'transcribed' || status === 'completed') {
        session.hasTranscription = true;
      }

      await this.saveSession(session);
    }
  },
};
