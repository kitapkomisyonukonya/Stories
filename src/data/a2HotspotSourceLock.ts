import type { PageData } from '../types';

export type A2SourceStoryId = 'adam' | 'ibrahim' | 'musa' | 'mecca' | 'yunusEmre';
export type A2SourceLanguage = 'en' | 'ar';

type HotspotText = { title: string; description: string };
type HotspotOverrides = Partial<Record<A2SourceStoryId, Record<string, HotspotText>>>;

/**
 * Editorially approved English A2 hotspot copy.
 *
 * These descriptions are direct extracts from the same canonical chapter.
 * They deliberately avoid paraphrase, passive rewrites, relative clauses,
 * interpretation, moral commentary, and vocabulary that is not already in the
 * A2 chapter. Titles stay short and chapter-anchored.
 */
const approvedEnglishHotspots: HotspotOverrides = {
  adam: {
    h1: { title: 'Soil', description: 'Allah created him from soil and cared about him very much because he was the first human.' },
    h2: { title: 'Different Skin Colors', description: 'Because of this, humans have different skin colors.' },
    'h2-1': { title: 'Knowledge', description: 'Allah gave Adam knowledge and taught him to think.' },
    'h2-2': { title: 'Angels', description: 'They all admired him and respected him.' },
    'h3-1': { title: 'Fire', description: 'You created me from fire, and You created Adam from soil.' },
    'h3-2': { title: 'Arrogant', description: 'Iblis was arrogant.' },
    'h4-1': { title: 'Eve (Hawwa)', description: 'Her name was Eve (Hawwa).' },
    'h4-2': { title: 'One Tree', description: 'HE told Adam and Eve not to go near one tree.' },
    'h5-1': { title: 'Big Lie', description: 'It was a big lie.' },
    'h5-2': { title: 'Mistake', description: 'They made a mistake, but it wasn’t on purpose.' },
    'h6-1': { title: 'Earth', description: 'Allah excused Adam and Eve and put them on earth to live there.' },
    'h6-2': { title: 'Land', description: 'They were using land to grow crops and keep animals.' },
    'h7-1': { title: 'First Messenger', description: 'Allah made Adam His first Messenger.' },
    'h7-2': { title: 'Children', description: 'They also had lots of children.' },
    'h8-1': { title: 'Sheep', description: 'He kept cows, sheep and other animals.' },
    'h8-2': { title: 'Crops', description: 'Qabil was a farmer, he worked on the farm and grew crops.' },
    'h9-1': { title: 'Crow', description: 'The crow showed Qabil the way to put his brother’s dead body in the hole.' },
    'h9-2': { title: 'Panic', description: 'But also he started to panic.' },
    'h10-1': { title: 'Jealousy', description: 'The story tells us that good people should stay away from jealousy and not get angry quickly.' },
    'h10-2': { title: 'Message', description: 'His children and grandchildren took his message all over the world.' },
  },
  ibrahim: {
    h1: { title: 'Babylon', description: 'A very long time ago, a boy was born in the kingdom of Babylon in Mesopotamia.' },
    h2: { title: 'These Objects', description: 'People believed these objects were their gods.' },
    h3: { title: 'Idols', description: 'As a young boy, Abraham used to watch his father making idols from stone.' },
    h4: { title: 'Mardukh', description: 'It is Mardukh, the king of gods, son!' },
    h5: { title: 'Bright Star', description: 'He saw a bright star and thought, “Could this be my Lord?”' },
    h6: { title: 'Shining Moon', description: 'He then saw the shining moon and said, “Could this be my Lord?”' },
    h7: { title: 'The Sun', description: 'In the morning the sun came out.' },
    h8: { title: 'His Forehead', description: 'Abraham put his forehead to the ground and spoke to Allah.' },
    h9: { title: 'Our Fathers', description: 'We saw our fathers worship them; because of this, we do the same.' },
    h10: { title: 'Food and Drink', description: 'My Lord gives me food and drink when I need them.' },
    h11: { title: 'An Axe', description: 'He got an axe and waited.' },
    h12: { title: 'Plates of Food', description: 'There were plates of food in front of them.' },
    h13: { title: 'In Pieces', description: 'They were shocked because all their stone gods were in pieces.' },
    h14: { title: 'These Objects', description: 'Then, why do you worship these objects?' },
    h15: { title: 'Firewood', description: 'People of the kingdom collected firewood for the fire for days.' },
    h16: { title: 'Stayed Calm', description: 'But Abraham (pbuh) stayed calm because he trusted Allah.' },
    h17: { title: 'Cool and Safe', description: 'The fire became cool and safe for him.' },
    h18: { title: 'Angel Gabriel', description: 'At that moment, Angel Gabriel (Cebrâil) came to him and asked, “Is there anything you wish for?”' },
    h19: { title: 'Nimrod', description: 'Nimrod was the King of Babylon.' },
    h20: { title: 'The West', description: 'Can you make the sun rise from the west?' },
    h21: { title: 'His Journey', description: 'Abraham (pbuh) began his journey.' },
    h22: { title: 'Safa and Marwah', description: 'Finally, they arrived at a quiet valley near two small hills, Safa and Marwah.' },
    h23: { title: "Allah's Plan", description: "Hagar knew that this was part of Allah's plan." },
    h24: { title: 'Food and Water', description: 'She looked for food and water.' },
    h25: { title: 'Water', description: 'Suddenly water came out of the ground under Ishmael’s feet.' },
    h26: { title: 'Mecca', description: 'They built a city called Mecca.' },
    h27: { title: 'The Ka’ba', description: 'One day, Allah asked Abraham (pbuh) to build the House of Allah, the Ka’ba.' },
    h28: { title: 'No Partner', description: 'He has no partner and He does not need any help.' },
  },
  musa: {
    'h1-1': { title: 'Cruel Ruler', description: 'He was an unfair and cruel ruler.' },
    'h1-2': { title: 'Children of Israel', description: 'They believed in one Allah, like Prophet Abraham (pbuh).' },
    'h2-1': { title: 'A Fire', description: 'He saw a fire in his dream.' },
    'h2-2': { title: 'His Soldiers', description: 'Then, the king told his soldiers: “Kill all the baby boys of the Children of Israel.”' },
    'h2-3': { title: 'Baby Boys', description: 'When they found baby boys, they killed them.' },
    'h3-1': { title: 'The Basket', description: 'Moses’s mother put the baby Moses in a basket and took it to the river.' },
    'h3-2': { title: 'The Water', description: 'The water carried it away.' },
    'h4-1': { title: 'Queen Asiye', description: 'Queen Asiye saw the baby, and Allah placed a lot of love for him in her heart.' },
    'h4-2': { title: 'King’s Palace', description: 'It was near the king’s palace.' },
    'h5-1': { title: 'Mother’s Arms', description: 'Baby Moses was in his mother’s arms again.' },
    'h5-2': { title: 'Two Men', description: 'He saw two men. They were fighting.' },
    'h6-1': { title: 'The Egyptian', description: 'He hit the Egyptian and the man died there.' },
    'h6-2': { title: 'Run Away', description: 'Run away from the city.' },
    'h7-1': { title: 'Midian', description: 'After many days, he arrived at Midian (Medyen).' },
    'h7-2': { title: 'A Well', description: 'Soon, he found a well.' },
    'h8-1': { title: 'Two Sisters', description: 'Moses understood the two sisters needed help.' },
    'h8-2': { title: 'Their Sheep', description: 'He took their sheep to the water and gave them a drink.' },
    'h9-1': { title: 'Prophet Şuayb', description: 'The father of these girls was Prophet Şuayb (pbuh).' },
    'h9-2': { title: 'A Job', description: 'Şuayb (pbuh) offered Moses a job.' },
    'h10-1': { title: 'A Fire', description: 'Suddenly, Moses saw a fire on the hillside.' },
    'h10-2': { title: 'A Loud Voice', description: 'In the silence he heard a loud voice: “Moses, I am Allah.”' },
    'h11-1': { title: 'Now Shining', description: 'See, your hand is now shining.' },
    'h11-2': { title: 'Harun', description: 'Moses (pbuh) took his brother Harun with him and went to the palace to give the message of Allah.' },
    'h12-1': { title: 'Big Snake', description: 'The stick turned into a big snake!' },
    'h12-2': { title: 'Only Magic', description: 'The king said to Moses (pbuh): “This is only magic.”' },
    'h13-1': { title: 'The Magicians', description: 'The magicians bowed down to Allah.' },
    'h13-2': { title: 'The Snakes', description: 'His stick quickly ate all the snakes of the magicians.' },
    'h14-1': { title: 'At Night', description: 'They left Egypt at night.' },
    'h14-2': { title: 'Their Caravan', description: 'Their caravan moved slowly.' },
    'h15-1': { title: 'The Sea', description: 'He hit the sea and the sea parted!' },
    'h15-2': { title: 'Walls of Water', description: 'Moses (pbuh) and his people safely walked between the walls of water.' },
    'h16-1': { title: 'Midway', description: 'When they were midway, Allah closed the sea over them.' },
    'h16-2': { title: 'Only Allah', description: 'It shows that only Allah has power over us.' },
  },
  mecca: {
    'h1-1': { title: 'Bilal ibn Rabah', description: 'Bilal ibn Rabah was one of the first seven people that openly said he was a Muslim in Mecca.' },
    'h1-2': { title: 'Skin Color', description: 'His story teaches us that skin color or being a slave does not make a person less valuable.' },
    'h2-1': { title: 'Jahiliyyah', description: 'The period before Islam was called the Age of Ignorance, or Jahiliyyah.' },
    'h2-2': { title: 'Rich and Poor', description: 'There was a big gap between rich and poor people.' },
    'h3-1': { title: 'Slave Markets', description: 'Slave markets were very common in Arabia.' },
    'h3-2': { title: 'Umayya', description: 'His master was Umayya b. Khalaf.' },
    'h4-1': { title: 'Hot Sun', description: 'He looked after his master’s camels and worked under the hot sun in the desert of Mecca all day.' },
    'h4-2': { title: 'Respect', description: 'They did not respect him as a person.' },
    'h5-1': { title: 'His Freedom', description: 'He did not have any money to pay for his freedom.' },
    'h5-2': { title: 'Fair and Equal', description: 'He taught that people must be fair and equal.' },
    'h6-1': { title: 'Hidden Path', description: 'He left his room secretly and walked on a hidden path.' },
    'h6-2': { title: 'Abu Bakr', description: 'Abu Bakr was a very kind man, and everybody knew that he was very nice to slaves.' },
    'h7-1': { title: 'No God but Allah', description: 'Islam says there is no god but Allah.' },
    'h7-2': { title: 'Accepted Islam', description: 'In the end, he accepted Islam.' },
    'h8-1': { title: 'Burning Rock', description: 'He whipped Bilal and put a huge burning rock on his chest in the hot sun.' },
    'h8-2': { title: 'Allah Is One', description: 'But Bilal only said, “Allah is One, Allah is One.”' },
    'h9-1': { title: 'Abu Bakr', description: 'Abu Bakr heard that Umayya was hurting Bilal very badly.' },
    'h9-2': { title: 'A Crime', description: 'Is it a crime to believe in the one true Allah?' },
    'h10-1': { title: 'Free Man', description: 'Abu Bakr told Bilal that he was now a free man and no longer a slave.' },
    'h10-2': { title: 'Rescued Him', description: 'Abu Bakr bought Bilal and rescued him from his master’s hands.' },
    'h11-1': { title: 'Medina', description: 'The Prophet (pbuh) told the Muslims to move to Medina.' },
    'h11-2': { title: 'First Adhan', description: 'After the Hijrah, the Prophet (pbuh) wanted someone to call people to prayer. He chose Bilal.' },
    'h12-1': { title: 'Morning Call', description: 'Bilal used to start the morning call to prayer very early.' },
    'h12-2': { title: 'Farewell Sermon', description: 'This speech is called the Farewell Sermon.' },
    'h13-1': { title: 'Everyone Is Equal', description: 'Bilal’s story shows that in Islam, everyone is equal.' },
    'h13-2': { title: 'Good Actions', description: 'What matters is the heart and good actions.' },
  },
  yunusEmre: {
    'h1-1': { title: 'Simple Turkish', description: 'People could easily understand his poems because he wrote and said them in simple Turkish.' },
    'h1-2': { title: 'Taptuk Emre', description: 'Yunus Emre became a dervish pupil of Taptuk Emre.' },
    'h2-1': { title: 'Their Hearts', description: 'Dervishes tried to find Allah everywhere not only with their eyes but also with their hearts.' },
    'h2-2': { title: 'The Needy', description: 'They shared what they had with the needy.' },
    'h3-1': { title: 'Dervishhood', description: 'In fact, the path of dervishhood was a very difficult one.' },
    'h3-2': { title: 'Useful Activities', description: 'They ate less, spoke less, slept less, and spent their time on useful activities.' },
    'h4-1': { title: 'Cutting Wood', description: 'Taptuk then gave Yunus the job of cutting wood at the dervish house.' },
    'h4-2': { title: 'Crooked Wood', description: 'But he never cut or brought green or crooked wood.' },
    'h5-1': { title: 'Straightest Pieces', description: 'He chose the straightest pieces of wood with the greatest care.' },
    'h5-2': { title: 'Heart and Ego', description: 'But in fact, he is training his own heart and ego.' },
    'h6-1': { title: 'Honesty and Goodness', description: 'My teacher, this place is a door of honesty and goodness.' },
    'h6-2': { title: 'Nature', description: 'He looked at nature and found a lesson from everything in it, like reading the Qur’an.' },
    'h7-1': { title: 'Single Daisy', description: 'In the late afternoon, he returned with a single daisy.' },
    'h7-2': { title: 'Name of Allah', description: 'Wherever I saw a flower, I heard it say the name of Allah.' },
    'h8-1': { title: 'My Time', description: 'My time is up now; I’m dried up and dying.' },
    'h8-2': { title: 'Fruitful Life', description: 'This helps us live a meaningful and fruitful life.' },
  },
};

const stripArabicDiacritics = (text: string): string => text
  .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  .replace(/ـ/g, '');

const normalize = (text: string, language: A2SourceLanguage): string => {
  let value = text.normalize('NFKC').toLowerCase();
  if (language === 'ar') {
    value = stripArabicDiacritics(value)
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه');
  }
  return value.replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
};

const splitSourceSentences = (content: string): string[] => content
  .split(/(?<=[.!?؟])\s+|\n+/u)
  .map((sentence) => sentence.trim())
  .filter(Boolean);

const tokenSet = (text: string, language: A2SourceLanguage): Set<string> =>
  new Set(normalize(text, language).split(' ').filter(Boolean));

const bestSourceSentence = (
  content: string,
  hotspot: HotspotText,
  language: A2SourceLanguage,
): string => {
  const target = tokenSet(`${hotspot.title} ${hotspot.description}`, language);
  let best = '';
  let bestScore = -1;
  for (const sentence of splitSourceSentences(content)) {
    const words = tokenSet(sentence, language);
    const overlap = [...target].filter((word) => words.has(word)).length;
    const score = overlap * 100 - Math.abs(words.size - target.size);
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return best || content.trim();
};

const sourceLockHotspot = (
  content: string,
  hotspot: HotspotText,
  language: A2SourceLanguage,
): HotspotText => {
  const normalizedContent = normalize(content, language);
  const normalizedDescription = normalize(hotspot.description, language);
  if (normalizedDescription && normalizedContent.includes(normalizedDescription)) return hotspot;
  return { ...hotspot, description: bestSourceSentence(content, hotspot, language) };
};

/**
 * Final A2 hotspot gate used by BookData.
 * English uses the approved editorial extracts above. Arabic is checked against
 * its own Arabic chapter and any non-source paraphrase is replaced by the most
 * relevant sentence from that same Arabic chapter. Canonical prose is never
 * changed here.
 */
export const applyA2HotspotSourceLock = (
  pages: PageData[],
  storyId: A2SourceStoryId,
  language: A2SourceLanguage,
): PageData[] => pages.map((page) => {
  if (page.type !== 'story' || !page.hotspots?.length) return page;
  const overrides = language === 'en' ? approvedEnglishHotspots[storyId] : undefined;
  return {
    ...page,
    hotspots: page.hotspots.map((hotspot) => {
      const approved = overrides?.[hotspot.id];
      const candidate: HotspotText = approved || {
        title: hotspot.title || '',
        description: hotspot.description || '',
      };
      return { ...hotspot, ...sourceLockHotspot(page.content || '', candidate, language) };
    }),
  };
});
