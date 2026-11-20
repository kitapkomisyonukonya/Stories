import { useEffect, useMemo, useState } from 'react';
import { api, type FeedbackItem } from '../api';
import { IconDown, IconRefresh, IconTrash } from '../icons';
import { storyName, toast, useStore } from '../store';
import { confirm } from '../ui';
import { timeAgo } from '../util';

/**
 * What people wrote in the app's feedback form ("Share your feedback"). Nothing here names a
 * person: the form asks only for a role, the book, five scores and three free-text answers.
 * The list can be filtered and downloaded as a spreadsheet (CSV); an admin can delete entries.
 */

const QUESTIONS: [keyof FeedbackItem['ratings'], string][] = [
  ['overall', 'Genel'],
  ['ease', 'Kullanım kolaylığı'],
  ['level', 'Seviyeye uygunluk'],
  ['exercises', 'Alıştırmalar'],
  ['media', 'Resim ve ses'],
];
const ROLES: Record<string, string> = { student: 'Öğrenci', teacher: 'Öğretmen', parent: 'Veli', other: 'Diğer' };
const LANGS: Record<string, string> = { tr: 'Türkçe', en: 'İngilizce', ar: 'Arapça' };
const DEVICES: Record<string, string> = { phone: 'Telefon', tablet: 'Tablet', computer: 'Bilgisayar' };

const dateText = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const bookText = (item: FeedbackItem) => (item.storyId ? `${storyName(item.storyId)}${item.level ? ` ${item.level}` : ''}` : `Genel${item.level ? ` (${item.level})` : ''}`);

const average = (items: FeedbackItem[], key: keyof FeedbackItem['ratings']) => {
  const scores = items.map(item => item.ratings[key]).filter((score): score is number => typeof score === 'number');
  return scores.length ? { value: scores.reduce((sum, score) => sum + score, 0) / scores.length, count: scores.length } : null;
};

const csvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (items: FeedbackItem[]) => {
  const head = ['Tarih', 'Rol', 'Kitap', 'Seviye', 'Form dili', 'Uygulama dili', 'Cihaz', ...QUESTIONS.map(([, label]) => label), 'Beğenilen', 'Sorunlar', 'Öneriler'];
  const rows = items.map(item => [
    dateText(item.at),
    item.role ? ROLES[item.role] : '',
    item.storyId ? storyName(item.storyId) : 'Genel',
    item.level ?? '',
    LANGS[item.formLang] ?? item.formLang,
    item.appLang === 'ar' ? 'Arapça' : 'İngilizce',
    item.device ? DEVICES[item.device] : '',
    ...QUESTIONS.map(([key]) => item.ratings[key] ?? ''),
    item.liked,
    item.problems,
    item.ideas,
  ]);
  // Semicolons and a byte-order mark: Excel in Turkish opens it with the columns and letters right.
  const text = `${String.fromCharCode(0xfeff)}${[head, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `geri-bildirimler-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const Feedback = () => {
  const member = useStore(state => state.member);
  const admin = Boolean(member?.approve);
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [book, setBook] = useState('');
  const [role, setRole] = useState('');
  const [onlyText, setOnlyText] = useState(false);

  const load = () => {
    setItems(null);
    api
      .feedback()
      .then(result => setItems(result.entries))
      .catch(error => {
        setItems([]);
        toast((error as Error).message, 'bad');
      });
  };
  useEffect(load, []);

  const books = useMemo(() => [...new Set((items ?? []).map(item => item.storyId ?? ''))].sort(), [items]);
  const shown = useMemo(
    () =>
      (items ?? []).filter(
        item =>
          (!book || (book === 'genel' ? !item.storyId : item.storyId === book)) &&
          (!role || item.role === role) &&
          (!onlyText || Boolean(item.liked || item.problems || item.ideas)),
      ),
    [items, book, role, onlyText],
  );

  const remove = async (item: FeedbackItem) => {
    if (!(await confirm({ title: 'Bu geri bildirim silinsin mi?', text: 'Silinen kayıt geri getirilemez.', yes: 'Sil', danger: true }))) return;
    try {
      setItems((await api.removeFeedback(item.path)).entries);
    } catch (error) {
      toast((error as Error).message, 'bad');
    }
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Geri bildirimler</h1>
          <p>Uygulamadaki “Share your feedback” formundan gelenler. Formda ad, okul, e-posta gibi kişisel bilgi sorulmaz.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={load}>
            <IconRefresh size={16} /> Yenile
          </button>
          <button type="button" className="btn primary" disabled={!shown.length} onClick={() => downloadCsv(shown)}>
            <IconDown size={16} /> CSV indir
          </button>
        </div>
      </div>

      {!items ? (
        <p className="muted">Yükleniyor…</p>
      ) : (
        <>
          <div className="grid three feedback-stats">
            <div className="stat">
              <b>{shown.length}</b>
              <span>geri bildirim{shown.length !== items.length ? ` (toplam ${items.length})` : ''}</span>
            </div>
            {QUESTIONS.map(([key, label]) => {
              const result = average(shown, key);
              return (
                <div key={key} className="stat">
                  <b>{result ? result.value.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : '–'}</b>
                  <span>
                    {label}
                    {result ? ` · ${result.count} puan` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card feedback-filters">
            <label>
              <span className="small muted">Kitap</span>
              <select value={book} onChange={event => setBook(event.target.value)}>
                <option value="">Hepsi</option>
                {books.map(id => (
                  <option key={id || 'genel'} value={id || 'genel'}>
                    {id ? storyName(id) : 'Genel'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="small muted">Rol</span>
              <select value={role} onChange={event => setRole(event.target.value)}>
                <option value="">Hepsi</option>
                {Object.entries(ROLES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="feedback-check">
              <input type="checkbox" checked={onlyText} onChange={event => setOnlyText(event.target.checked)} />
              <span>Yalnızca yazılı cevabı olanlar</span>
            </label>
          </div>

          {shown.length === 0 ? (
            <div className="card">
              <p className="muted">{items.length ? 'Bu seçime uyan geri bildirim yok.' : 'Henüz geri bildirim gelmedi.'}</p>
            </div>
          ) : (
            shown.map(item => (
              <div key={item.id} className="card feedback-item" data-feedback-entry>
                <div className="feedback-head">
                  <b>{bookText(item)}</b>
                  {item.role && <span className="chip">{ROLES[item.role]}</span>}
                  <span className="chip">Form: {LANGS[item.formLang] ?? item.formLang}</span>
                  {item.device && <span className="chip">{DEVICES[item.device]}</span>}
                  <span className="grow" />
                  <span className="small muted" title={dateText(item.at)}>
                    {timeAgo(item.at)}
                  </span>
                  {admin && (
                    <button type="button" className="btn ghost small" aria-label="Sil" onClick={() => remove(item)}>
                      <IconTrash size={15} />
                    </button>
                  )}
                </div>
                {Object.keys(item.ratings).length > 0 && (
                  <div className="feedback-scores">
                    {QUESTIONS.filter(([key]) => item.ratings[key]).map(([key, label]) => (
                      <span key={key} className="chip">
                        {label}: <b>{item.ratings[key]}/5</b>
                      </span>
                    ))}
                  </div>
                )}
                {(
                  [
                    ['Beğenilen', item.liked],
                    ['Sorunlar', item.problems],
                    ['Öneriler', item.ideas],
                  ] as const
                )
                  .filter(([, text]) => text)
                  .map(([label, text]) => (
                    <div key={label} className="feedback-text">
                      <span className="small muted">{label}</span>
                      <p dir="auto">{text}</p>
                    </div>
                  ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};
