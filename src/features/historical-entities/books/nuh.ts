import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for Prophet Noah (pbuh) (A1–B2). Prophets and their companions get no card or picture.
// A1 and A2 name one place, Mount Judi. Pictures: Storage places-people/nuh/ (shared ones from abraham/ and andalus/).
// English only for A2–B2: their Arabic copy repeats the English. Mount Judi (A1) has its Arabic words in src/content/entityCards.json.
// Copy never goes beyond the story. A card without a picture file shows a placeholder.

type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = "nuh") => ({ folder, name });

const entities = [
  card({
    id: "nuh-mount-judi", kind: "region", tr: "Cudi Dağı", aliases: ["Mount Judi", "Judi"],
    en: { title: "Mount Judi", kindLabel: "Mountain", periodLabel: "The time of Prophet Noah (pbuh)", summary: "Mount Judi is a mountain. After the flood, the water went down, and Noah’s ark stopped on Mount Judi." },
    focus: medPoint(37.37, 42.35, 1.8),
    picture: pic("mount-judi"), sources: ["TDV İslâm Ansiklopedisi: Cûdî"],
  }),
  card({
    id: "nuh-middle-east", kind: "region", tr: "Orta Doğu", aliases: ["Middle East", "Middle Eastern"],
    en: { title: "The Middle East", kindLabel: "Land", periodLabel: "Ancient times", summary: "The oldest flood stories come from ancient tablets of the Middle East." },
    focus: medFeature('middle-east', 31, 41, 1),
    picture: pic("middle-east", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Tûfan"],
  }),
  card({
    id: "nuh-sumer", kind: "region", tr: "Sümer", aliases: ["Sumer"],
    en: { title: "Sumer", kindLabel: "Ancient land", periodLabel: "Ancient Mesopotamia", summary: "Sumer was an ancient land. Some of the oldest flood stories were written on tablets there." },
    focus: medFeature('sumer', 31.3, 46, 1.6),
    picture: pic("sumer", "abraham"), sources: ["TDV İslâm Ansiklopedisi: Sümerler"],
  }),
  card({
    id: "nuh-akkad", kind: "region", tr: "Akad", aliases: ["Akkad"],
    en: { title: "Akkad", kindLabel: "Ancient land", periodLabel: "Ancient Mesopotamia", summary: "Akkad was an ancient land. Research suggests that great floods hit Sumer and Akkad." },
    focus: medFeature('mesopotamia', 33.3, 44, 1.6),
    picture: pic("akkad"), sources: ["TDV İslâm Ansiklopedisi: Akadlar"],
  }),
  card({
    id: "nuh-assyria", kind: "region", tr: "Asur", aliases: ["Assyria"],
    en: { title: "Assyria", kindLabel: "Ancient land", periodLabel: "Ancient Mesopotamia", summary: "Assyria was an ancient land in the Middle East. Some of the oldest flood accounts come from there." },
    focus: medPoint(36, 43.2, 1.5),
    picture: pic("assyria"), sources: ["TDV İslâm Ansiklopedisi: Asurlular"],
  }),
  card({
    id: "nuh-babylon", kind: "city", tr: "Babil", aliases: ["Babylon"],
    en: { title: "Babylon", kindLabel: "Ancient city", periodLabel: "Ancient Mesopotamia", summary: "Babylon was an ancient city. Old flood stories were also written there.", more: "The most complete Babylonian flood story is in the Epic of Gilgamesh." },
    focus: medPoint(32.54, 44.42, 1.8),
    picture: pic("babylon", "abraham"), sources: ["TDV İslâm Ansiklopedisi: Bâbil"],
  }),
  card({
    id: "nuh-uruk", kind: "city", tr: "Uruk", aliases: ["Uruk"],
    en: { title: "Uruk", kindLabel: "Ancient city", periodLabel: "Ancient Mesopotamia", summary: "Uruk was an ancient city. In the Epic of Gilgamesh, Gilgamesh is the King of Uruk." },
    focus: medPoint(31.32, 45.64, 1.8),
    picture: pic("uruk"), sources: ["TDV İslâm Ansiklopedisi: Uruk"],
  }),
  card({
    id: "nuh-euphrates", kind: "river", tr: "Fırat", aliases: ["Euphrates"],
    en: { title: "The Euphrates", kindLabel: "River", periodLabel: "Mesopotamia", summary: "The Euphrates is a great river. In the Epic of Gilgamesh, Uta-napishtim was the king of a city on its banks." },
    focus: medFeature('euphrates', 34.5, 41, 1.3),
    picture: pic("euphrates", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Fırat"],
  }),
  card({
    id: "nuh-egypt", kind: "country", tr: "Mısır", aliases: ["Egypt"],
    en: { title: "Egypt", kindLabel: "Land", periodLabel: "The time of Pharaoh", summary: "The Qur’an tells of a flood that came to Pharaoh and the people of Egypt." },
    focus: medFeature('egypt', 27, 30.5, 1.2),
    picture: pic("egypt", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Mısır"],
  }),
  card({
    id: "nuh-mecca", kind: "city", tr: "Mekke", aliases: ["Mecca"],
    en: { title: "Mecca", kindLabel: "City", periodLabel: "Arabian Peninsula", summary: "Even before Islam, people in Mecca fasted on Ashura. Prophet Muhammad (pbuh) also fasted on Ashura in Mecca." },
    focus: medPoint(21.42, 39.83, 1.8),
    picture: pic("mecca", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Mekke"],
  }),
  card({
    id: "nuh-medina", kind: "city", tr: "Medine", aliases: ["Medina"],
    en: { title: "Medina", kindLabel: "City", periodLabel: "Arabian Peninsula", summary: "Prophet Muhammad (pbuh) continued the Ashura fast after he moved to Medina." },
    focus: medPoint(24.47, 39.61, 1.8),
    picture: pic("medina", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Medine"],
  }),
];

export const NUH_SET: EntityBookSet = {
  entities,
  chapters: {
    "nuh-a1": {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: ["nuh-mount-judi"],
    },
    "nuh-a2": {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: ["nuh-mount-judi"],
      7: [],
    },
    "nuh-b1": {
      1: [],
      2: ["nuh-middle-east", "nuh-sumer", "nuh-babylon", "nuh-uruk"],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: ["nuh-mount-judi"],
      9: ["nuh-mecca"],
      10: ["nuh-mecca", "nuh-medina"],
      11: [],
    },
    "nuh-b2": {
      1: [],
      2: ["nuh-middle-east", "nuh-sumer", "nuh-akkad", "nuh-assyria", "nuh-babylon", "nuh-uruk", "nuh-euphrates"],
      3: ["nuh-egypt"],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
      10: [],
      11: ["nuh-mount-judi"],
      12: ["nuh-medina"],
      13: [],
    },
  },
};
