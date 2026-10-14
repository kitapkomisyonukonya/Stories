import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { isPanelPreview } from '../content/panelPreview';
import { hasHarakat, stripHarakat, useHarakatShown } from '../lib/arabicHarakat';

/**
 * Two changes to the Arabic on screen, made in one place:
 * - Every number is shown in Arabic-Indic digits (٠-٩, user 2026-10-12). Lesson cards, guides and
 *   exercises carry plain digits in their text; a word with Latin letters (levels A2/B1/B2, curriculum
 *   codes such as D20.1.1) keeps its digits.
 * - When the reader turns harakat off, the Arabic is shown without them.
 * Only what is on screen changes: the content keeps its own text, so leaving Arabic or turning harakat
 * back on restores every text exactly. React never reads text back from the page, so it simply writes
 * its own text again on its next update, and the filter changes that too. Inputs and the content panel's
 * preview are left alone, and so are the English end-of-level test papers (.exam-latin); Qur'an verses keep their harakat.
 */
const SKIP = 'script, style, textarea, input, [contenteditable="true"], .exam-latin';
const SKIP_STRIP = '.quran-verse, [data-keep-harakat]';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Plain digits as Arabic-Indic ones, except in words that also have Latin letters (B1, D20.1.1). */
export const arabicDigits = (text: string): string =>
  /\d/.test(text) ? text.replace(/\S+/g, word => (/[A-Za-z]/.test(word) ? word : word.replace(/\d/g, d => ARABIC_DIGITS[+d]))) : text;

interface Entry {
  original: string;
  shown: string;
}

export const ArabicHarakatFilter: React.FC = () => {
  const { language } = useLanguage();
  const shown = useHarakatShown();
  const arabic = language === 'ar' && !isPanelPreview();
  const strip = arabic && !shown;

  React.useEffect(() => {
    if (!arabic) return;
    const entries = new Map<Text, Entry>();

    const filterNode = (node: Text) => {
      const value = node.nodeValue ?? '';
      const entry = entries.get(node);
      if (entry && entry.shown === value) return;
      const parent = node.parentElement;
      if (!(/\d/.test(value) || (strip && hasHarakat(value))) || parent?.closest(SKIP)) {
        entries.delete(node);
        return;
      }
      let changed = arabicDigits(value);
      if (strip && !parent?.closest(SKIP_STRIP)) changed = stripHarakat(changed);
      if (changed === value) {
        entries.delete(node);
        return;
      }
      entries.set(node, { original: value, shown: changed });
      node.nodeValue = changed;
    };

    const filterTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        filterNode(root as Text);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) filterNode(node as Text);
    };

    filterTree(document.body);
    let batches = 0;
    const observer = new MutationObserver(records => {
      // Now and then forget texts that left the page.
      if (++batches % 50 === 0) entries.forEach((_, node) => { if (!node.isConnected) entries.delete(node); });
      for (const record of records) {
        if (record.type === 'characterData') filterTree(record.target);
        else record.addedNodes.forEach(filterTree);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => {
      observer.disconnect();
      // Harakat back on or English again: every text still showing the changed version gets its own text back.
      entries.forEach((entry, node) => {
        if (node.isConnected && node.nodeValue === entry.shown) node.nodeValue = entry.original;
      });
      entries.clear();
    };
  }, [arabic, strip]);

  return null;
};
