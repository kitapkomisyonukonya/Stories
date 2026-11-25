import React from 'react';
import type { Level } from '../../types';
import { MyJournalPanel } from './MyJournalPanel';
import { Scroll } from '../ui/icons';

export interface OpenBookTarget {
  storyId: string;
  level: Level;
  pageIndex?: number;
}

interface SeyahatnamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Phones: a tab of the dark library, not a page over it. */
  embedded?: boolean;
  /** Opens a book (at a chapter or its map). Absent where no book can be opened from here. */
  onOpenBook?: (target: OpenBookTarget) => void;
  onOpenMyWords?: () => void;
  /** Shown first: a book's journal opens expanded. */
  focusBook?: { storyId: string; level: Level };
}

/** My Journal: the light picture-book journal (approved by the user 2026-11-25). */
export const SeyahatnamePanel: React.FC<SeyahatnamePanelProps> = props => <MyJournalPanel {...props} />;

export const SeyahatnameIcon = Scroll;
