import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { decodeCertificate } from '../../lib/seyahatname/certificate';
import { bookName } from '../../lib/seyahatname/view';
import { Modal } from './Modal';
import { TransferDialog } from './TransferDialog';
import { BookSeal } from './art';

const COPY = {
  en: {
    title: 'Certificate check',
    valid: 'This code belongs to this certificate.',
    invalid: 'This code does not match this name. Check the code and the name on the certificate.',
    level: 'Level',
    books: 'Books',
    date: 'Date',
    note: 'The check reads what the code carries. Lisandan Kültüre keeps no records of learners.',
  },
  ar: {
    title: 'التَّحَقُّقُ مِنَ الشَّهَادَةِ',
    valid: 'هٰذَا الرَّمْزُ يُطَابِقُ هٰذِهِ الشَّهَادَةَ.',
    invalid: 'هٰذَا الرَّمْزُ لَا يُطَابِقُ هٰذَا الِاسْمَ. رَاجِعِ الرَّمْزَ وَالِاسْمَ الْمَكْتُوبَيْنِ عَلَى الشَّهَادَةِ.',
    level: 'الْمُسْتَوَى',
    books: 'الْكُتُبُ',
    date: 'التَّارِيخُ',
    note: 'يَقْرَأُ التَّحَقُّقُ مَا يَحْمِلُهُ الرَّمْزُ، وَلَا تَحْتَفِظُ «Lisandan Kültüre» بِسِجِلَّاتٍ لِلْمُتَعَلِّمِينَ.',
  },
};

/**
 * Links that arrive from outside the app: a certificate's QR code (?belge=CODE&ad=NAME) opens the
 * check, a journal code (?tasima=SY1…) opens the move-to-this-device dialog. The address is then
 * cleaned, so a reload does not open them again.
 */
export const JournalLinks: React.FC = () => {
  const { language, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = COPY[lang];
  const [check, setCheck] = useState<{ code: string; name: string } | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('belge');
    const move = params.get('tasima');
    if (!code && !move) return;
    if (code) setCheck({ code, name: params.get('ad') ?? '' });
    if (move) setTransfer(move);
    params.delete('belge');
    params.delete('ad');
    params.delete('tasima');
    const query = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, []);

  const data = check ? decodeCertificate(check.code, check.name) : null;
  const dateText = data ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-arab' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(data.date) : '';

  return (
    <>
      <Modal open={Boolean(check)} onClose={() => setCheck(null)} title={copy.title}>
        <div data-certificate-check data-valid={Boolean(data) || undefined}>
          <p className="text-[18px] font-semibold" dir="auto">{check?.name}</p>
          <p className={data ? 'mt-1 text-[14px] font-semibold text-[#1d6b66]' : 'mt-1 text-[14px] font-semibold text-[#9b2d20]'}>{data ? copy.valid : copy.invalid}</p>
          {data && (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
              <dt className="text-[#14221a]/60">{copy.level}</dt>
              <dd className="font-semibold">{data.level}</dd>
              <dt className="text-[#14221a]/60">{copy.date}</dt>
              <dd className="font-semibold">{dateText}</dd>
              <dt className="text-[#14221a]/60">{copy.books}</dt>
              <dd>
                <ul className="flex flex-wrap gap-2">
                  {data.storyIds.map(storyId => (
                    <li key={storyId} className="flex flex-col items-center text-center text-[11px]">
                      <BookSeal storyId={storyId} level={data.level} size={54} ribbons={false} arabic={lang === 'ar'} />
                      {bookName(storyId, lang)}
                    </li>
                  ))}
                </ul>
                <span className="sr-only">{formatNumber(data.storyIds.length)}</span>
              </dd>
            </dl>
          )}
          <p className="mt-4 text-[12px] text-[#14221a]/60">{copy.note}</p>
        </div>
      </Modal>
      <TransferDialog mode={transfer ? 'enter' : null} initialCode={transfer ?? undefined} onClose={() => setTransfer(null)} />
    </>
  );
};
