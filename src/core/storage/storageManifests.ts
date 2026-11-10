import type { Level } from '../../types';
import type { StoryId } from '../content/contracts';
import type { BookAssetManifest } from './contracts';

const manifestKey = (storyId: StoryId, level: Level) => `${storyId}:${level}` as const;
const media = (
  sharedImages: readonly string[],
  englishAudio: readonly string[],
  arabicAudio: readonly string[],
): BookAssetManifest => ({
  sharedImages: { kind: 'image', paths: sharedImages },
  englishAudio: { kind: 'audio', paths: englishAudio },
  arabicAudio: { kind: 'audio', paths: arabicAudio },
});

/**
 * Existing Firebase Storage folders only. The loader merges candidates by
 * chapter number, so legacy capitalization/naming differences can coexist.
 * No asset is renamed, moved, regenerated, or edited here.
 */
export const storageManifests: Record<string, BookAssetManifest> = {
  [manifestKey('adam', 'A2')]: media(
    ['Adam_A2/images', 'adam_a2/images', 'Adam/A2/images'],
    ['Adam_A2/audio', 'Adam_A2', 'adam_a2/audio'],
    ['Adam_A2/Adam_a2_arabic_audio', 'Adam_A2/audio/arabic_audio', 'adam_a2/audio/arabic_audio'],
  ),
  [manifestKey('adam', 'B1')]: media(
    ['adam_b1/images', 'Adam_B1/images', 'Adam/adam_b1/images'],
    ['adam_b1/audio', 'Adam_B1/audio'],
    ['adam_b1/audio/arabic_audio', 'Adam_B1/audio/arabic_audio'],
  ),
  [manifestKey('adam', 'B2')]: media(
    ['adam_b2/images', 'Adam_B2/images', 'Adam/adam_b2/images'],
    ['adam_b2/audio', 'Adam_B2/audio'],
    ['adam_b2/audio/arabic_audio', 'Adam_B2/audio/arabic_audio'],
  ),

  [manifestKey('ibrahim', 'A2')]: media(
    ['Abraham/abraham_a2/images', 'abraham/abraham_a2/images', 'Abraham/a2/images'],
    ['Abraham/abraham_a2/audio', 'abraham/abraham_a2/audio', 'Abraham/a2/audio'],
    ['Abraham/abraham_a2/audio/arabic_audio', 'abraham/abraham_a2/audio/arabic_audio', 'Abraham/a2/audio/arabic_audio'],
  ),
  [manifestKey('ibrahim', 'B1')]: media(
    ['Abraham/abraham_b1/images', 'abraham/abraham_b1/images', 'Abraham/b1/images'],
    ['Abraham/abraham_b1/audio', 'abraham/abraham_b1/audio', 'Abraham/b1/audio'],
    ['Abraham/abraham_b1/audio/arabic_audio', 'abraham/abraham_b1/audio/arabic_audio', 'Abraham/b1/audio/arabic_audio'],
  ),
  [manifestKey('ibrahim', 'B2')]: media(
    ['Abraham/abraham_b2/images', 'abraham/abraham_b2/images', 'Abraham/b2/images'],
    ['Abraham/abraham_b2/audio', 'abraham/abraham_b2/audio', 'Abraham/b2/audio'],
    ['Abraham/abraham_b2/audio/arabic_audio', 'abraham/abraham_b2/audio/arabic_audio', 'Abraham/b2/audio/arabic_audio'],
  ),

  [manifestKey('musa', 'A2')]: media(
    ['Moses/a2/images', 'Moses/moses_a2/images', 'moses/a2/images', 'moses/moses_a2/images'],
    ['Moses/a2/audio', 'Moses/moses_a2/audio', 'moses/a2/audio', 'moses/moses_a2/audio'],
    ['Moses/a2/audio/arabic_audio', 'Moses/moses_a2/audio/arabic_audio', 'moses/a2/audio/arabic_audio', 'moses/moses_a2/audio/arabic_audio'],
  ),
  [manifestKey('musa', 'B1')]: media(
    ['Moses/b1/images', 'Moses/moses_b1/images', 'moses/b1/images', 'moses/moses_b1/images'],
    ['Moses/b1/audio', 'Moses/moses_b1/audio', 'moses/b1/audio', 'moses/moses_b1/audio'],
    ['Moses/b1/audio/arabic_audio', 'Moses/moses_b1/audio/arabic_audio', 'moses/b1/audio/arabic_audio', 'moses/moses_b1/audio/arabic_audio'],
  ),
  [manifestKey('musa', 'B2')]: media(
    ['Moses/b2/images', 'Moses/moses_b2/images', 'moses/b2/images', 'moses/moses_b2/images'],
    ['Moses/b2/audio', 'Moses/moses_b2/audio', 'moses/b2/audio', 'moses/moses_b2/audio'],
    ['Moses/b2/audio/arabic_audio', 'Moses/moses_b2/audio/arabic_audio', 'moses/b2/audio/arabic_audio', 'moses/moses_b2/audio/arabic_audio'],
  ),

  [manifestKey('mecca', 'A2')]: media(
    ['mecca/a2/images', 'Mecca/a2/images', 'mecca/mecca_a2/images', 'Mecca/mecca_a2/images'],
    ['mecca/a2/audio', 'Mecca/a2/audio', 'mecca/mecca_a2/audio', 'Mecca/mecca_a2/audio'],
    ['mecca/a2/audio/arabic_audio', 'Mecca/a2/audio/arabic_audio', 'mecca/mecca_a2/audio/arabic_audio', 'Mecca/mecca_a2/audio/arabic_audio'],
  ),
  [manifestKey('mecca', 'B1')]: media(
    ['mecca/b1/images', 'Mecca/b1/images', 'mecca/mecca_b1/images', 'Mecca/mecca_b1/images'],
    ['mecca/b1/audio', 'Mecca/b1/audio', 'mecca/mecca_b1/audio', 'Mecca/mecca_b1/audio'],
    ['mecca/b1/audio/arabic_audio', 'Mecca/b1/audio/arabic_audio', 'mecca/mecca_b1/audio/arabic_audio', 'Mecca/mecca_b1/audio/arabic_audio'],
  ),
  [manifestKey('mecca', 'B2')]: media(
    ['mecca/b2/images', 'Mecca/b2/images', 'mecca/mecca_b2/images', 'Mecca/mecca_b2/images'],
    ['mecca/b2/audio', 'Mecca/b2/audio', 'mecca/mecca_b2/audio', 'Mecca/mecca_b2/audio'],
    ['mecca/b2/audio/arabic_audio', 'Mecca/b2/audio/arabic_audio', 'mecca/mecca_b2/audio/arabic_audio', 'Mecca/mecca_b2/audio/arabic_audio'],
  ),

  [manifestKey('ibnJubayr', 'A2')]: media(
    ['andulus/a2/images', 'Andulus/a2/images'],
    ['andulus/a2/audio', 'Andulus/a2/audio'],
    [],
  ),
  [manifestKey('ibnJubayr', 'B1')]: media(
    ['andulus/b1/images', 'Andulus/b1/images'],
    ['andulus/b1/audio', 'Andulus/b1/audio'],
    [],
  ),
  [manifestKey('ibnJubayr', 'B2')]: media(
    ['andulus/b2/images', 'Andulus/b2/images'],
    ['andulus/b2/audio', 'Andulus/b2/audio'],
    [],
  ),

  [manifestKey('gevherNesibe', 'A2')]: media(
    ['gevher_nesibe/gevher_nesibe_a2/images', 'gevherNesibe/a2/images', 'GevherNesibe/a2/images'],
    ['gevher_nesibe/gevher_nesibe_a2/audio', 'gevherNesibe/a2/audio', 'GevherNesibe/a2/audio'],
    [],
  ),

  [manifestKey('yunusEmre', 'A2')]: media(
    [
      'Yunus/a2/images', 'yunus/a2/images', 'Yunus/yunus_a2/images', 'yunus/yunus_a2/images',
      'YunusEmre/a2/images', 'YunusEmre/yunusemre_a2/images', 'Yunus_Emre/a2/images',
      'Yunus_Emre/yunusemre_a2/images', 'yunusEmre/a2/images', 'yunusEmre/yunusemre_a2/images',
    ],
    ['yunus/a2/audio', 'Yunus/a2/audio', 'Yunus/yunus_a2/audio', 'YunusEmre/a2/audio', 'yunusEmre/a2/audio'],
    ['yunus/a2/audio/arabic_audio', 'Yunus/a2/audio/arabic_audio', 'Yunus/yunus_a2/audio/arabic_audio', 'YunusEmre/a2/audio/arabic_audio'],
  ),
  [manifestKey('yunusEmre', 'B1')]: media(
    ['Yunus/b1/images', 'yunus/b1/images', 'Yunus/yunus_b1/images', 'yunus/yunus_b1/images', 'YunusEmre/b1/images', 'YunusEmre/yunusemre_b1/images'],
    ['yunus/b1/audio', 'Yunus/b1/audio', 'Yunus/yunus_b1/audio', 'YunusEmre/b1/audio', 'yunusEmre/b1/audio'],
    ['yunus/b1/audio/arabic_audio', 'Yunus/b1/audio/arabic_audio', 'Yunus/yunus_b1/audio/arabic_audio', 'YunusEmre/b1/audio/arabic_audio'],
  ),
  [manifestKey('yunusEmre', 'B2')]: media(
    ['yunus/b2/images', 'Yunus/b2/images', 'Yunus/yunus_b2/images', 'yunus/yunus_b2/images', 'YunusEmre/b2/images', 'YunusEmre/yunusemre_b2/images'],
    ['yunus/b2/audio', 'Yunus/b2/audio', 'Yunus/yunus_b2/audio', 'YunusEmre/b2/audio', 'yunusEmre/b2/audio'],
    ['yunus/b2/audio/arabic_audio', 'Yunus/b2/audio/arabic_audio', 'Yunus/yunus_b2/audio/arabic_audio', 'YunusEmre/b2/audio/arabic_audio'],
  ),
};

export const getStorageManifest = (storyId: StoryId, level: Level): BookAssetManifest =>
  storageManifests[manifestKey(storyId, level)] ?? {};
