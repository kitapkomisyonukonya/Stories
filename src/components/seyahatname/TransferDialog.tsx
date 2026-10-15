import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMyWords } from '../../lib/myWords';
import { applyTransfer, makeTransferCode, readTransferCode, transferLink } from '../../lib/seyahatname/transfer';
import { Modal } from './Modal';
import { QrCode } from './QrCode';

const COPY = {
  en: {
    show: 'Your journal code',
    showText: 'On the other device, open Lisandan Kültüre and scan this code, or open Seyahatname, choose “I have a code” and paste it.',
    long: 'Your journal is too long for a picture code. Copy the text and send it to yourself.',
    copy: 'Copy the code',
    copied: 'Copied',
    enter: 'Bring a journal to this device',
    enterText: 'Paste the code from your other device. Nothing on this device is removed; the two journals are joined.',
    add: 'Add to this device',
    bad: 'This code could not be read. Copy it again, all of it.',
    done: (stamps: string, words: string) => `Done: ${stamps} stamps and ${words} new words were added.`,
    placeholder: 'SY1.…',
  },
  ar: {
    show: 'رَمْزُ دَفْتَرِكَ',
    showText: 'عَلَى الْجِهَازِ الْآخَرِ افْتَحْ «Lisandan Kültüre» وَامْسَحْ هٰذَا الرَّمْزَ، أَوِ افْتَحِ «الرِّحْلَةَ» وَاخْتَرْ «عِنْدِي رَمْزٌ» وَأَلْصِقْهُ.',
    long: 'دَفْتَرُكَ أَطْوَلُ مِنْ أَنْ يُوضَعَ فِي صُورَةٍ. انْسَخِ النَّصَّ وَأَرْسِلْهُ إِلَى نَفْسِكَ.',
    copy: 'انْسَخِ الرَّمْزَ',
    copied: 'نُسِخَ',
    enter: 'أَحْضِرْ دَفْتَرًا إِلَى هٰذَا الْجِهَازِ',
    enterText: 'أَلْصِقِ الرَّمْزَ مِنْ جِهَازِكَ الْآخَرِ. لَا يُحْذَفُ شَيْءٌ مِنْ هٰذَا الْجِهَازِ، بَلْ يُضَمُّ الدَّفْتَرَانِ.',
    add: 'أَضِفْ إِلَى هٰذَا الْجِهَازِ',
    bad: 'تَعَذَّرَتْ قِرَاءَةُ هٰذَا الرَّمْزِ. انْسَخْهُ مَرَّةً أُخْرَى كَامِلًا.',
    done: (stamps: string, words: string) => `تَمَّ: أُضِيفَتِ الْأَخْتَامُ (${stamps}) وَالْكَلِمَاتُ الْجَدِيدَةُ (${words}).`,
    placeholder: 'SY1.…',
  },
};

/** QR codes stay easy to scan from a screen up to about this length. */
const QR_LIMIT = 900;

export const TransferDialog: React.FC<{ mode: 'show' | 'enter' | null; onClose: () => void; initialCode?: string }> = ({ mode, onClose, initialCode }) => {
  const { language, formatNumber } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const words = useMyWords();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCopied(false);
    setMessage(null);
    setInput(initialCode ?? '');
    if (mode !== 'show') return;
    let live = true;
    makeTransferCode(words).then(value => { if (live) setCode(value); }).catch(() => undefined);
    return () => { live = false; };
    // The code is made once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const link = code ? transferLink(code) : '';
  const copyCode = () => {
    navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => undefined);
  };

  const add = async () => {
    const data = await readTransferCode(input);
    if (!data) {
      setMessage(copy.bad);
      return;
    }
    const result = applyTransfer(data);
    setMessage(copy.done(formatNumber(result.stamps), formatNumber(result.words)));
  };

  return (
    <Modal open={mode !== null} onClose={onClose} title={mode === 'show' ? copy.show : copy.enter}>
      {mode === 'show' ? (
        <div data-transfer-show>
          <p className="text-[14px] leading-relaxed text-[#14221a]/75">{code && link.length > QR_LIMIT ? copy.long : copy.showText}</p>
          {code && link.length <= QR_LIMIT && (
            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-sm">
              <QrCode value={link} size={220} label={copy.show} />
            </div>
          )}
          <textarea readOnly value={link} dir="ltr" rows={3} className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white p-3 font-mono text-[11px] text-[#14221a]/70" aria-label={copy.show} onFocus={event => event.currentTarget.select()} />
          <button type="button" onClick={copyCode} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#14221a] px-5 text-sm font-semibold text-[#F6F0E2]">
            {copied ? copy.copied : copy.copy}
          </button>
        </div>
      ) : (
        <div data-transfer-enter>
          <p className="text-[14px] leading-relaxed text-[#14221a]/75">{copy.enterText}</p>
          <textarea value={input} onChange={event => setInput(event.target.value)} dir="ltr" rows={4} placeholder={copy.placeholder} className="mt-4 w-full resize-none rounded-xl border border-black/15 bg-white p-3 font-mono text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]" aria-label={copy.enter} />
          {message && <p className="mt-2 text-[13.5px] font-semibold text-[#1d6b66]" role="status">{message}</p>}
          <button type="button" onClick={add} disabled={!input.trim()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#14221a] px-5 text-sm font-semibold text-[#F6F0E2] disabled:opacity-40">
            {copy.add}
          </button>
        </div>
      )}
    </Modal>
  );
};
