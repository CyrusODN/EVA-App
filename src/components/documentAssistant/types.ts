// Shared types for Document Assistant components (Discharge & Certificate)

export type ObservationType = 'text' | 'image' | 'file';
export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

export interface Observation {
  id: string;
  type: ObservationType;
  content: string; // Text content or extracted text
  uri?: string; // For images/files
  fileName?: string;
  categories?: string[];
  tags?: string[];
  timestamp: string;
  status: ProcessingStatus;
}

export interface SavedSummary {
  id: string;
  title: string;
  createdAt: string;
  content: string;
}

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface EmptyState {
  logo: string;
  title: string;
  subtitle: string;
}

export interface WelcomeFeature {
  icon:
    | 'FileText'
    | 'Sparkles'
    | 'Bookmark'
    | 'ClipboardList'
    | 'History'
    | 'FileCheck'
    | 'ScrollText';
  title: string;
  description: string;
}

export interface ActionButton {
  icon: React.ComponentType<any>;
  label: string;
  onPress: () => void;
}
