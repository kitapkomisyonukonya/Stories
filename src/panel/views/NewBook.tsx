import { useEffect, useState } from 'react';
import { api, WRITER_EFFORTS, WRITER_MODELS, type WriterEffort, type WriterModel } from '../api';
import { readDocx, type StoryDraft } from '../docx';
import { IconSend, IconSparkDoc, IconUpload, IconWarn } from '../icons';
import { refreshBaskets, toast, useStore } from '../store';
import { timeAgo, wordCount } from '../util';

/**
 * A new book, or a new level of a book, from the hoca's Word file. The panel reads the file, shows
 * the chapters it found, and sends the text to GitHub on its own branch. Claude then writes the
 * book (word notes, exercises, Teacher's Book) there, modelled on the best existing books and
 * always about that chapter's own events and people; the book stays hidden. It comes back as a
 * basket in "Onay bekleyenler": look at it, ask for changes, publish, then check it in the app.
 */

const LEVELS = ['A2', 'B1', 'B2'];
const COLLECTIONS: Record<string, string> = { prophets: 'Peygamberler', history: 'Tarih', turkish: 'Türk-İslam büyükleri', today: 'Our World Today' };

const idFrom = (name: string) => {
  const words = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.map((word, index) => (index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase())).join('').replace(/^[^a-z]+/, '');
};

export const NewBook = () => {
  const stories = useStore(state => state.stories);
  const member = useStore(state => state.member);
  const config = useStore(state => state.config);
  const baskets = useStore(state => state.baskets);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [storyId, setStoryId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [collection, setCollection] = useState('history');
  const [level, setLevel] = useState('A2');
  const [draft, setDraft] = useState<StoryDraft | null>(null);
  const [fileName, setFileName] = useState('');
  const [brief, setBrief] = useState('');
  const [writer, setWriter] = useState<'claude' | 'manual'>('claude');
  const [model, setModel] = useState<WriterModel>('claude-opus-5-5');
  const [effort, setEffort] = useState<WriterEffort>('medium');
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<{ id: number; branch: string; status: string; conclusion: string | null; createdAt: string; url: string }[]>([]);

  useEffect(() => {
    if (!config?.proposals) return;
    void api
      .newBookRuns()
      .then(result => setRuns(result.runs))
      .catch(() => undefined);
  }, [config?.proposals]);

  const story = stories?.find(item => item.id === storyId);
  const id = mode === 'new' ? idFrom(nameEn) : storyId;
  const taken = mode === 'new' && stories?.some(item => item.id.toLowerCase() === id.toLowerCase());
  const levelExists = mode === 'existing' && story?.availableLevels.includes(level);
  const ready = Boolean(id && draft && !taken && (mode === 'existing' || (nameEn.trim() && nameAr.trim())));
  const open = (baskets ?? []).filter(item => item.kind === 'new-book');

  if (member?.role === 'viewer') return <div className="content muted">Rolünüz yeni kitap eklemeye izin vermiyor.</div>;

  const send = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await api.newBook({
        storyId: id,
        title: mode === 'new' ? nameEn : story?.text.en?.name ?? id,
        level,
        text: draft.markdown,
        brief,
        mode: writer,
        model,
        effort,
        isNew: mode === 'new',
        nameEn,
        nameAr,
        collection,
      });
      toast(writer === 'claude' ? 'Gönderildi. Kitap hazırlanıyor; tamamlanınca “Onay bekleyenler” sayfasında görünür.' : 'Metin kaydedildi. Hazırlık, aşağıdaki “Hazırlanan kitaplar” bölümünden istenebilir.', 'good');
      setDraft(null);
      setFileName('');
      setBrief('');
      void refreshBaskets();
    } catch (error) {
      toast((error as Error).message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Yeni kitap veya seviye ekle</h1>
          <p>Hikâye metnini Word dosyası olarak yükleyin. Kelime notları, alıştırmalar ve öğretmen rehberi metnin kendi olaylarından hazırlanır. Kitap, incelenip onaylanana kadar okurlara kapalı kalır.</p>
        </div>
      </div>
      {!config?.proposals && (
        <div className="notice warn" style={{ marginBottom: 14 }}>
          <IconWarn size={16} /> Göndermek, panelin GitHub bağlantısı kurulunca açılır. Dosyayı şimdiden okutup bölümleri kontrol edebilirsiniz.
        </div>
      )}

      <div className="grid two">
        <section className="card">
          <ol className="steps-list">
            <li>
              <h3>Kitap</h3>
              <div className="choices" role="group" aria-label="Kitap türü">
                <button type="button" aria-pressed={mode === 'existing'} onClick={() => setMode('existing')}>
                  <b>Mevcut kitaba yeni seviye</b>
                  <span>Kütüphanedeki bir kitaba A2, B1 veya B2 seviyesi eklenir.</span>
                </button>
                <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>
                  <b>Yeni kitap</b>
                  <span>Kütüphaneye yeni bir kitap eklenir.</span>
                </button>
              </div>
              {mode === 'existing' ? (
                <label className="field">
                  <span className="field-label">Kitap</span>
                  <select value={storyId} onChange={event => setStoryId(event.target.value)}>
                    <option value="">Seçin</option>
                    {(stories ?? []).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.text.en?.name} ({item.availableLevels.join(', ')})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="field">
                    <span className="field-label">Adı (İngilizce)</span>
                    <input value={nameEn} onChange={event => setNameEn(event.target.value)} placeholder="Gevher Nesibe" />
                    {nameEn && <small>Kitap kimliği: {id || '…'}</small>}
                    {taken && <small className="bad">Bu adla bir kitap zaten var.</small>}
                  </label>
                  <label className="field">
                    <span className="field-label">Adı (Arapça)</span>
                    <input value={nameAr} onChange={event => setNameAr(event.target.value)} dir="rtl" />
                  </label>
                  <label className="field">
                    <span className="field-label">Koleksiyon</span>
                    <select value={collection} onChange={event => setCollection(event.target.value)}>
                      {Object.entries(COLLECTIONS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <span className="field-label" style={{ display: 'block', marginTop: 10 }}>Seviye</span>
              <div className="seg" role="group" aria-label="Seviye">
                {LEVELS.map(item => (
                  <button key={item} type="button" aria-pressed={level === item} onClick={() => setLevel(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <p className="small muted">A1 ve C1 seviyeleri uygulamaya eklendiğinde burada da seçilebilecek.</p>
              {levelExists && <p className="small">Bu kitabın {level} seviyesi zaten var. Gönderilirse mevcut seviye bu metinle yeniden hazırlanır.</p>}
            </li>
            <li>
              <h3>Hikâye metni (Word)</h3>
              <label className="dropzone">
                <IconUpload size={18} />
                <span>
                  <b>{fileName || 'Dosya seçin (.docx)'}</b>
                </span>
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hidden
                  onChange={async event => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      setDraft(await readDocx(file));
                      setFileName(file.name);
                    } catch (error) {
                      toast((error as Error).message, 'bad');
                    }
                  }}
                />
                <span className="small muted">Bölüm başlıkları Word’de “Başlık” stiliyle veya “Chapter 1: …” biçiminde yazılmalıdır. Kalın ya da renkli işaretlenen kelimeler kelime notu adayı sayılır.</span>
              </label>
            </li>
            <li>
              <h3>Hazırlık</h3>
              <div className="choices" role="group" aria-label="Hazırlık">
                <button type="button" aria-pressed={writer === 'claude'} onClick={() => setWriter('claude')}>
                  <b>Claude hazırlasın</b>
                  <span>Kelime notları, alıştırmalar ve rehber hazırlanır; sonuç “Onay bekleyenler” sayfasına gelir.</span>
                </button>
                <button type="button" aria-pressed={writer === 'manual'} onClick={() => setWriter('manual')}>
                  <b>Yalnızca metni kaydet</b>
                  <span>Metin saklanır; hazırlık daha sonra istenir.</span>
                </button>
              </div>
              {writer === 'claude' && <WriterChoice model={model} effort={effort} onModel={setModel} onEffort={setEffort} />}
              <label className="field" style={{ marginTop: 10 }}>
                <span className="field-label">Notlar (isteğe bağlı)</span>
                <textarea value={brief} onChange={event => setBrief(event.target.value)} rows={3} placeholder="Örnek: 3. bölümdeki tarih değiştirilmesin. Resimler daha sonra eklenecek." />
              </label>
            </li>
          </ol>
          <button type="button" className="btn primary" disabled={!ready || busy || !config?.proposals} onClick={() => void send()}>
            <IconSend size={16} /> {busy ? 'Gönderiliyor…' : writer === 'claude' ? 'Hazırlamaya gönder' : 'Metni kaydet'}
          </button>
        </section>

        <section className="card">
          <h2>
            <IconSparkDoc size={18} /> Dosya önizlemesi
          </h2>
          {!draft ? (
            <p className="muted">Dosya seçildiğinde bölümler burada listelenir.</p>
          ) : (
            <>
              <p>
                <b>{draft.title || 'Başlıksız'}</b> · {draft.chapters.length} bölüm · {wordCount(draft.markdown)} kelime
              </p>
              {draft.chapters.length === 0 && (
                <div className="notice warn">
                  <IconWarn size={16} /> Bölüm bulunamadı. Word’de bölüm başlıklarına “Başlık 1” stilini verin veya başlıkları “Chapter 1: …” biçiminde yazın.
                </div>
              )}
              <ol className="chapter-list">
                {draft.chapters.map((chapter, index) => (
                  <li key={index}>
                    <b>{chapter.title}</b>
                    <span className="small muted">
                      {' '}
                      · {wordCount(chapter.paragraphs.join(' '))} kelime · {chapter.paragraphs.length} paragraf
                    </span>
                    {chapter.marked.length > 0 && <div className="small">İşaretli: {[...new Set(chapter.marked)].slice(0, 12).join(', ')}</div>}
                  </li>
                ))}
              </ol>
              {draft.front.length > 0 && <p className="small muted">Bölümlerden önce {draft.front.length} paragraf var (önsöz veya not); bunlar hazırlıkta not olarak dikkate alınır.</p>}
            </>
          )}
        </section>
      </div>

      {(open.length > 0 || runs.length > 0) && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Hazırlanan kitaplar</h2>
          {open.map(item => (
            <AskBox key={item.branch} number={item.number!} title={item.title.replace(/^Panel: /, '')} url={item.url} />
          ))}
          {runs.slice(0, 5).map(run => (
            <p key={run.id} className="small">
              {run.status === 'completed' ? (run.conclusion === 'success' ? 'Tamamlandı' : 'Tamamlanamadı') : 'Hazırlanıyor'} · {timeAgo(run.createdAt)} ·{' '}
              <a href={run.url} target="_blank" rel="noreferrer">
                ayrıntı
              </a>
            </p>
          ))}
        </section>
      )}
    </div>
  );
};

/** Model and effort for the writer: Opus 5.5 Medium is the team's default. */
const WriterChoice = ({ model, effort, onModel, onEffort }: { model: WriterModel; effort: WriterEffort; onModel: (model: WriterModel) => void; onEffort: (effort: WriterEffort) => void }) => (
  <div className="row wrap" style={{ marginTop: 10, gap: 10 }}>
    <label className="field" style={{ flex: '1 1 200px', margin: 0 }}>
      <span className="field-label">Model</span>
      <select value={model} onChange={event => onModel(event.target.value as WriterModel)}>
        {WRITER_MODELS.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
    <label className="field" style={{ flex: '1 1 160px', margin: 0 }}>
      <span className="field-label">Düşünme düzeyi</span>
      <select value={effort} onChange={event => onEffort(event.target.value as WriterEffort)}>
        {WRITER_EFFORTS.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  </div>
);

const AskBox = ({ number, title, url }: { number: number; title: string; url: string | null }) => {
  const [text, setText] = useState('');
  const [model, setModel] = useState<WriterModel>('claude-opus-5-5');
  const [effort, setEffort] = useState<WriterEffort>('medium');
  const [busy, setBusy] = useState(false);
  return (
    <div className="box">
      <div className="box-head">
        <b>{title}</b>
        {url && (
          <a className="small" href={url} target="_blank" rel="noreferrer">
            GitHub’da gör
          </a>
        )}
      </div>
      <p className="small muted">Bu kitapta yapılacak değişikliği yazın; aynı taslak üzerinde düzeltilir. Sonuç “Onay bekleyenler” sayfasında incelenip yayınlanır.</p>
      <div className="row">
        <input value={text} onChange={event => setText(event.target.value)} placeholder="Örnek: 2. bölümün Quick sorularını kolaylaştır." style={{ flex: 1 }} />
        <button
          type="button"
          className="btn"
          disabled={!text.trim() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api.askNewBook(number, text, { model, effort });
              setText('');
              toast('İstek iletildi.', 'good');
            } catch (error) {
              toast((error as Error).message, 'bad');
            } finally {
              setBusy(false);
            }
          }}
        >
          Değişiklik iste
        </button>
      </div>
      <WriterChoice model={model} effort={effort} onModel={setModel} onEffort={setEffort} />
    </div>
  );
};
