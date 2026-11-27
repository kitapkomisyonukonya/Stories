import type { Level } from '../../types';
import type { StoryId } from '../content/contracts';
import type { BookAssetManifest } from './contracts';

// Green Deal and Zero Waste are outside StoryId; their pictures load from Storage the same way.
const manifestKey = (storyId: StoryId | 'greenDeal' | 'zeroWaste', level: Level) => `${storyId}:${level}` as const;
const media = (sharedImages: readonly string[], englishAudio: readonly string[], arabicAudio: readonly string[]): BookAssetManifest => ({
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
    [
      'Moses/a2/audio/arabic_audio',
      'Moses/moses_a2/audio/arabic_audio',
      'moses/a2/audio/arabic_audio',
      'moses/moses_a2/audio/arabic_audio',
    ],
  ),
  [manifestKey('musa', 'B1')]: media(
    ['Moses/b1/images', 'Moses/moses_b1/images', 'moses/b1/images', 'moses/moses_b1/images'],
    ['Moses/b1/audio', 'Moses/moses_b1/audio', 'moses/b1/audio', 'moses/moses_b1/audio'],
    [
      'Moses/b1/audio/arabic_audio',
      'Moses/moses_b1/audio/arabic_audio',
      'moses/b1/audio/arabic_audio',
      'moses/moses_b1/audio/arabic_audio',
    ],
  ),
  [manifestKey('musa', 'B2')]: media(
    ['Moses/b2/images', 'Moses/moses_b2/images', 'moses/b2/images', 'moses/moses_b2/images'],
    ['Moses/b2/audio', 'Moses/moses_b2/audio', 'moses/b2/audio', 'moses/moses_b2/audio'],
    [
      'Moses/b2/audio/arabic_audio',
      'Moses/moses_b2/audio/arabic_audio',
      'moses/b2/audio/arabic_audio',
      'moses/moses_b2/audio/arabic_audio',
    ],
  ),

  [manifestKey('mecca', 'A2')]: media(
    ['mecca/a2/images', 'Mecca/a2/images', 'mecca/mecca_a2/images', 'Mecca/mecca_a2/images'],
    ['mecca/a2/audio', 'Mecca/a2/audio', 'mecca/mecca_a2/audio', 'Mecca/mecca_a2/audio'],
    [
      'mecca/a2/audio/arabic_audio',
      'Mecca/a2/audio/arabic_audio',
      'mecca/mecca_a2/audio/arabic_audio',
      'Mecca/mecca_a2/audio/arabic_audio',
    ],
  ),
  [manifestKey('mecca', 'B1')]: media(
    ['mecca/b1/images', 'Mecca/b1/images', 'mecca/mecca_b1/images', 'Mecca/mecca_b1/images'],
    ['mecca/b1/audio', 'Mecca/b1/audio', 'mecca/mecca_b1/audio', 'Mecca/mecca_b1/audio'],
    [
      'mecca/b1/audio/arabic_audio',
      'Mecca/b1/audio/arabic_audio',
      'mecca/mecca_b1/audio/arabic_audio',
      'Mecca/mecca_b1/audio/arabic_audio',
    ],
  ),
  [manifestKey('mecca', 'B2')]: media(
    ['mecca/b2/images', 'Mecca/b2/images', 'mecca/mecca_b2/images', 'Mecca/mecca_b2/images'],
    ['mecca/b2/audio', 'Mecca/b2/audio', 'mecca/mecca_b2/audio', 'Mecca/mecca_b2/audio'],
    [
      'mecca/b2/audio/arabic_audio',
      'Mecca/b2/audio/arabic_audio',
      'mecca/mecca_b2/audio/arabic_audio',
      'Mecca/mecca_b2/audio/arabic_audio',
    ],
  ),

  [manifestKey('ibnJubayr', 'A2')]: media(['andulus/a2/images', 'Andulus/a2/images'], ['andulus/a2/audio', 'Andulus/a2/audio'], []),
  [manifestKey('ibnJubayr', 'B1')]: media(
    ['andulus/b1/images', 'Andulus/b1/images'],
    ['andulus/b1/audio', 'Andulus/b1/audio'],
    ['andulus/b1/audio/arabic_audio'],
  ),
  [manifestKey('ibnJubayr', 'B2')]: media(
    ['andulus/b2/images', 'Andulus/b2/images'],
    ['andulus/b2/audio', 'Andulus/b2/audio'],
    ['andulus/b2/audio/arabic_audio'],
  ),

  [manifestKey('gevherNesibe', 'A2')]: media(
    ['gevher_nesibe/gevher_nesibe_a2/images', 'gevherNesibe/a2/images', 'GevherNesibe/a2/images'],
    ['gevher_nesibe/gevher_nesibe_a2/audio', 'gevherNesibe/a2/audio', 'GevherNesibe/a2/audio'],
    ['gevher_nesibe/gevher_nesibe_a2/audio/arabic_audio'],
  ),
  [manifestKey('gevherNesibe', 'B1')]: media(
    ['gevher_nesibe/gevher_nesibe_b1/images', 'gevherNesibe/b1/images'],
    ['gevher_nesibe/gevher_nesibe_b1/audio', 'gevherNesibe/b1/audio'],
    ['gevher_nesibe/gevher_nesibe_b1/audio/arabic_audio'],
  ),
  [manifestKey('gevherNesibe', 'B2')]: media(
    ['gevher_nesibe/gevher_nesibe_b2/images', 'gevherNesibe/b2/images'],
    ['gevher_nesibe/gevher_nesibe_b2/audio', 'gevherNesibe/b2/audio'],
    ['gevher_nesibe/gevher_nesibe_b2/audio/arabic_audio'],
  ),

  [manifestKey('ahilik', 'A2')]: media(['ahilik/a2/images'], ['ahilik/a2/audio'], []),
  [manifestKey('ahilik', 'B1')]: media(['ahilik/b1/images'], ['ahilik/b1/audio'], []),
  [manifestKey('ahilik', 'B2')]: media(['ahilik/b2/images'], ['ahilik/b2/audio'], []),
  [manifestKey('kasgarli', 'A2')]: media(['kasgarli/a2/images'], ['kasgarli/a2/audio'], []),
  [manifestKey('kasgarli', 'B1')]: media(['kasgarli/b1/images'], ['kasgarli/b1/audio'], []),
  [manifestKey('kasgarli', 'B2')]: media(['kasgarli/b2/images'], ['kasgarli/b2/audio'], []),
  [manifestKey('yesevi', 'A2')]: media(['yesevi/a2/images'], ['yesevi/a2/audio'], []),
  [manifestKey('yesevi', 'B1')]: media(['yesevi/b1/images'], ['yesevi/b1/audio'], []),
  [manifestKey('yesevi', 'B2')]: media(['yesevi/b2/images'], ['yesevi/b2/audio'], []),
  [manifestKey('nuh', 'A2')]: media(['nuh/a2/images'], ['nuh/a2/audio'], []),
  [manifestKey('nuh', 'B1')]: media(['nuh/b1/images'], ['nuh/b1/audio'], []),
  [manifestKey('nuh', 'B2')]: media(['nuh/b2/images'], ['nuh/b2/audio'], []),
  [manifestKey('greenDeal', 'A2')]: media(['greenDeal/a2/images'], ['greenDeal/a2/audio'], []),
  [manifestKey('greenDeal', 'B1')]: media(['greenDeal/b1/images'], ['greenDeal/b1/audio'], []),
  [manifestKey('greenDeal', 'B2')]: media(['greenDeal/b2/images'], ['greenDeal/b2/audio'], []),
  [manifestKey('zeroWaste', 'A2')]: media(['zeroWaste/a2/images'], ['zeroWaste/a2/audio'], ['zeroWaste/a2/audio/arabic_audio']),
  [manifestKey('zeroWaste', 'B1')]: media(['zeroWaste/b1/images'], ['zeroWaste/b1/audio'], ['zeroWaste/b1/audio/arabic_audio']),
  [manifestKey('zeroWaste', 'B2')]: media(['zeroWaste/b2/images'], ['zeroWaste/b2/audio'], ['zeroWaste/b2/audio/arabic_audio']),

  [manifestKey('yunusEmre', 'A2')]: media(
    [
      'Yunus/a2/images',
      'yunus/a2/images',
      'Yunus/yunus_a2/images',
      'yunus/yunus_a2/images',
      'YunusEmre/a2/images',
      'YunusEmre/yunusemre_a2/images',
      'Yunus_Emre/a2/images',
      'Yunus_Emre/yunusemre_a2/images',
      'yunusEmre/a2/images',
      'yunusEmre/yunusemre_a2/images',
    ],
    ['yunus/a2/audio', 'Yunus/a2/audio', 'Yunus/yunus_a2/audio', 'YunusEmre/a2/audio', 'yunusEmre/a2/audio'],
    ['yunus/a2/audio/arabic_audio', 'Yunus/a2/audio/arabic_audio', 'Yunus/yunus_a2/audio/arabic_audio', 'YunusEmre/a2/audio/arabic_audio'],
  ),
  [manifestKey('yunusEmre', 'B1')]: media(
    [
      'Yunus/b1/images',
      'yunus/b1/images',
      'Yunus/yunus_b1/images',
      'yunus/yunus_b1/images',
      'YunusEmre/b1/images',
      'YunusEmre/yunusemre_b1/images',
    ],
    ['yunus/b1/audio', 'Yunus/b1/audio', 'Yunus/yunus_b1/audio', 'YunusEmre/b1/audio', 'yunusEmre/b1/audio'],
    ['yunus/b1/audio/arabic_audio', 'Yunus/b1/audio/arabic_audio', 'Yunus/yunus_b1/audio/arabic_audio', 'YunusEmre/b1/audio/arabic_audio'],
  ),
  [manifestKey('yunusEmre', 'B2')]: media(
    [
      'yunus/b2/images',
      'Yunus/b2/images',
      'Yunus/yunus_b2/images',
      'yunus/yunus_b2/images',
      'YunusEmre/b2/images',
      'YunusEmre/yunusemre_b2/images',
    ],
    ['yunus/b2/audio', 'Yunus/b2/audio', 'Yunus/yunus_b2/audio', 'YunusEmre/b2/audio', 'yunusEmre/b2/audio'],
    ['yunus/b2/audio/arabic_audio', 'Yunus/b2/audio/arabic_audio', 'Yunus/yunus_b2/audio/arabic_audio', 'YunusEmre/b2/audio/arabic_audio'],
  ),

  // A1 editions show the A2 pictures named in their own JSON, so only their narration folders are listed.
  [manifestKey('adam', 'A1')]: media([], ['adam/a1/audio'], ['adam/a1/audio/arabic_audio']),
  [manifestKey('ibrahim', 'A1')]: media([], ['ibrahim/a1/audio'], ['ibrahim/a1/audio/arabic_audio']),
  [manifestKey('musa', 'A1')]: media([], ['musa/a1/audio'], ['musa/a1/audio/arabic_audio']),
  [manifestKey('mecca', 'A1')]: media([], ['mecca/a1/audio'], ['mecca/a1/audio/arabic_audio']),
  [manifestKey('ibnJubayr', 'A1')]: media([], ['ibnJubayr/a1/audio'], ['ibnJubayr/a1/audio/arabic_audio']),
  [manifestKey('yunusEmre', 'A1')]: media([], ['yunusEmre/a1/audio'], ['yunusEmre/a1/audio/arabic_audio']),
  [manifestKey('gevherNesibe', 'A1')]: media([], ['gevherNesibe/a1/audio'], ['gevherNesibe/a1/audio/arabic_audio']),
  [manifestKey('zeroWaste', 'A1')]: media([], ['zeroWaste/a1/audio'], ['zeroWaste/a1/audio/arabic_audio']),

  // Pre-A1 is Arabic only: both sides read the Arabic narration.
  [manifestKey('adam', 'Pre-A1')]: media([], ['adam/pre-a1/audio/arabic_audio'], ['adam/pre-a1/audio/arabic_audio']),
  [manifestKey('ibrahim', 'Pre-A1')]: media([], ['ibrahim/pre-a1/audio/arabic_audio'], ['ibrahim/pre-a1/audio/arabic_audio']),
  [manifestKey('musa', 'Pre-A1')]: media([], ['musa/pre-a1/audio/arabic_audio'], ['musa/pre-a1/audio/arabic_audio']),
  [manifestKey('mecca', 'Pre-A1')]: media([], ['mecca/pre-a1/audio/arabic_audio'], ['mecca/pre-a1/audio/arabic_audio']),
  [manifestKey('ibnJubayr', 'Pre-A1')]: media([], ['ibnJubayr/pre-a1/audio/arabic_audio'], ['ibnJubayr/pre-a1/audio/arabic_audio']),
  [manifestKey('yunusEmre', 'Pre-A1')]: media([], ['yunusEmre/pre-a1/audio/arabic_audio'], ['yunusEmre/pre-a1/audio/arabic_audio']),
  [manifestKey('zeroWaste', 'Pre-A1')]: media([], ['zeroWaste/pre-a1/audio/arabic_audio'], ['zeroWaste/pre-a1/audio/arabic_audio']),
};

export const getStorageManifest = (storyId: StoryId, level: Level): BookAssetManifest =>
  storageManifests[manifestKey(storyId, level)] ?? {};
