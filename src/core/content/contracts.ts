import type { BookData, Level, TeacherGuideMetadata, TeacherGuideSection, StudentGuideMetadata, StudentGuideSection } from '../../types';

export type Language = 'en' | 'ar';
export type StoryId = 'adam' | 'ibrahim' | 'musa' | 'mecca' | 'ibnJubayr' | 'yunusEmre' | 'gevherNesibe' | 'ahilik' | 'kasgarli';
export type CollectionId = 'prophets' | 'history' | 'turkish' | 'today';
export type ReviewStatus = 'draft' | 'language-reviewed' | 'subject-reviewed' | 'approved' | 'published';

export interface BookPair {
  en: BookData;
  ar: BookData;
}

export interface ContentReviewMetadata {
  status: ReviewStatus;
  version: string;
  languageReviewed: boolean;
  pedagogicallyReviewed: boolean;
  historicallyReviewed: boolean;
  religiouslyReviewed: boolean;
  reviewedBy?: string[];
  reviewedAt?: string;
  notes?: string[];
}

export interface TeacherGuideContract {
  metadata: TeacherGuideMetadata & {
    storyId?: StoryId;
    level?: Level;
    language?: Language;
    version?: string;
    reviewStatus?: ReviewStatus;
  };
  chapters: TeacherGuideSection[];
}

export interface SelfStudyGuideContract {
  metadata?: StudentGuideMetadata & {
    storyId?: StoryId;
    level?: Level;
    language?: Language;
    version?: string;
    reviewStatus?: ReviewStatus;
  };
  sections: StudentGuideSection[];
  legacySections: TeacherGuideSection[];
  fullText?: string;
}
