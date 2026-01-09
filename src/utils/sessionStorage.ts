import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionType = 'patient' | 'meeting' | 'lecture';
export type SessionStatus = 'new' | 'recorded' | 'transcribed' | 'completed';

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  date: string;
  duration: string | null;
  hasRecording: boolean;
  hasTranscription: boolean;
  status: SessionStatus;
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
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
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
      return sessions.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Error getting session by id:', error);
      return null;
    }
  },

  async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Error deleting session from storage:', error);
      throw error;
    }
  },

  async getSessionsByType(type: SessionType): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter(s => s.type === type);
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
    initialStatus: SessionStatus = 'new'
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
    };

    await this.saveSession(newSession);
    return newSession;
  },

  async updateSessionStatus(
    id: string,
    status: SessionStatus
  ): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.status = status;
      
      if (status === 'recorded' || status === 'transcribed' || status === 'completed') {
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

  async markSessionAsRecorded(id: string, duration: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.status = 'recorded';
      session.duration = duration;
      session.hasRecording = true;
      await this.saveSession(session);
    }
  },

  async updateSessionTitle(id: string, title: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.title = title;
      await this.saveSession(session);
    }
  },

  async resetSession(id: string): Promise<void> {
    const session = await this.getSessionById(id);
    if (session) {
      session.status = 'new';
      session.duration = null;
      session.hasRecording = false;
      session.hasTranscription = false;
      await this.saveSession(session);
    }
  },
};
