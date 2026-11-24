import type { Level } from '../../types';
import type {
  StudentGuideMetadata,
  StudentGuideSection,
  TeacherGuideMetadata,
  TeacherGuideSection,
} from '../../types';
import type { StoryId } from './contracts';
import { readContent } from '../../content/contentSource';
import { editionName } from './bookRegistry';
import { fileLanguage } from '../../content/arabicOnlyLevels';
import { isPanelPreview, onPanelPreviewChange } from '../../content/panelPreview';

export interface TeacherGuideData {
  content: TeacherGuideSection[];
  metadata?: TeacherGuideMetadata;
}

export interface SelfStudyGuideData {
  content: TeacherGuideSection[];
  metadata?: StudentGuideMetadata;
  sections?: StudentGuideSection[];
  text?: string;
}

export interface BilingualTeacherGuideData {
  en: TeacherGuideData;
  ar: TeacherGuideData;
}

export interface BilingualSelfStudyGuideData {
  en: SelfStudyGuideData;
  ar: SelfStudyGuideData;
}

interface GuideFile {
  schema: number;
  teacherGuide: TeacherGuideData;
  selfStudyGuide: SelfStudyGuideData;
}

const fileCache = new Map<string, Promise<GuideFile>>();
if (isPanelPreview()) onPanelPreviewChange(() => fileCache.clear());

const guideFile = (storyId: StoryId, level: Level, language: 'en' | 'ar'): Promise<GuideFile> => {
  const name = editionName(storyId, level, fileLanguage(level, language));
  const cached = fileCache.get(name);
  if (cached) return cached;
  const request = readContent<GuideFile>('guides', name);
  fileCache.set(name, request);
  return request;
};

const bothLanguages = async <T>(
  storyId: StoryId,
  level: Level,
  pick: (file: GuideFile) => T,
): Promise<{ en: T; ar: T }> => {
  const [en, ar] = await Promise.all([guideFile(storyId, level, 'en'), guideFile(storyId, level, 'ar')]);
  return { en: pick(en), ar: pick(ar) };
};

export const loadTeacherGuideData = (storyId: StoryId, level: Level): Promise<BilingualTeacherGuideData> =>
  bothLanguages(storyId, level, file => file.teacherGuide);

export const loadSelfStudyGuideData = (storyId: StoryId, level: Level): Promise<BilingualSelfStudyGuideData> =>
  bothLanguages(storyId, level, file => file.selfStudyGuide);
