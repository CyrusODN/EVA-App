// Document Assistant Components - Shared between Discharge and Certificate modules

export { default as ObservationTimeline } from './ObservationTimeline';
export { default as SmartInputBar } from './SmartInputBar';
export { default as WelcomeModal } from './WelcomeModal';
export { default as SummaryView } from './SummaryView';
export { default as SavedDocumentsList } from './SavedDocumentsList';

// Types
export type {
  ObservationType,
  ProcessingStatus,
  Observation,
  SavedSummary,
  CustomPrompt,
  EmptyState,
  ActionButton,
} from './types';