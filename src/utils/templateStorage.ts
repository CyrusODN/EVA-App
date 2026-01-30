import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredTemplate = {
  id: string;
  title: string;
  content: string;
  lastUsed?: string;
  createdAt?: string;
};

const STORAGE_KEY = 'remedius_custom_templates';

const serializeTemplates = (templates: StoredTemplate[]) =>
  templates.map((t) => ({
    ...t,
    lastUsed: t.lastUsed ? new Date(t.lastUsed).toISOString() : undefined,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
  }));

export const templateStorage = {
  async getTemplates(): Promise<StoredTemplate[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as StoredTemplate[]) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  },

  async saveTemplates(templates: StoredTemplate[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTemplates(templates)));
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  },

  async addTemplate(template: Omit<StoredTemplate, 'id'> & { id?: string }): Promise<void> {
    const existing = await templateStorage.getTemplates();
    const newTemplate: StoredTemplate = {
      id: template.id || Date.now().toString(),
      title: template.title,
      content: template.content,
      lastUsed: template.lastUsed,
      createdAt: template.createdAt || new Date().toISOString(),
    };
    await templateStorage.saveTemplates([newTemplate, ...existing]);
  },
};
