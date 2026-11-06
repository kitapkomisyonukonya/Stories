import { useEffect, useState } from 'react';
import { storyCover } from '../../core/content/storyCatalog';
import { TextField } from '../FieldEditor';
import { IconEye, IconEyeOff, IconSound, IconWarn } from '../icons';
import { PAGE_TYPES } from '../labels';
import { chapterFiles, thumb, type ChapterFile } from '../media';
import { navigate } from '../router';
import { isDirty, loadFile, mayEditPath, revertDraft, saveAll, updateDraft, useStore, type StoryEntry } from '../store';
import { confirm } from '../ui';
import { STORIES_PATH } from '../util';

const COLLECTIONS: Record<string, string> = { prophets: 'Peygamberler', history: 'Tarih', turkish: 'Türk-İslam büyükleri', today: 'Our World Today' };

export const Books = () => {
  const stories = useStore(state => state.stories);
  const summary = useStore(state => state.summary);
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Kitaplar</h1>
          <p>Bir kitabı açın: seviyeleri, bölümleri, adı ve görünürlüğü orada. Bir bölüme tıklayınca uygulama açılır ve tıkladığınız her şeyi değiştirebilirsiniz.</p>
        </div>
      </div>
      {Object.entries(COLLECTIONS).map(([collection, title]) => {
        const list = (stories ?? []).filter(story => story.collection === collection);
        if (!list.length) return null;
        return (
          <section key={collection} style={{ marginBottom: 22 }}>
            <h2 className="section-title">{title}</h2>
            <div className="covers">
              {list.map(story => {
                const editions = (summary ?? []).filter(item => item.storyId === story.id);
                const chapters = editions.filter(item => item.language === 'en').reduce((sum, item) => sum + item.pages.filter(page => page.type === 'story').length, 0);
                return (
                  <button key={story.id} type="button" className="cover-card" onClick={() => navigate(`/kitap/${story.id}`)}>
                    <span className={`art${storyCover(story.id).placeholder ? ' placeholder' : ''}`} aria-hidden="true">
                      <img src={storyCover(story.id).imageSmall ?? storyCover(story.id).image} alt="" loading="lazy" />
                    </span>
                    <span className="body">
                      <b>{story.text.en?.name}</b>
                      <span dir="rtl" className="ar">
                        {story.text.ar?.name}
                      </span>
                      <span className="levels">
                        {story.availableLevels.map(level => (
                          <span key={level} className="level-pill">
                            {level}
                          </span>
                        ))}
                        {story.hidden && <span className="chip warn">gizli</span>}
                        {story.englishOnly && <span className="chip">sadece İngilizce</span>}
                      </span>
                      <span className="small muted">{chapters} bölüm</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export const BookDetail = ({ storyId }: { storyId: string }) => {
  const summary = useStore(state => state.summary);
  const draft = useStore(state => state.drafts[STORIES_PATH]);
  const [level, setLevel] = useState<string | null>(null);
  useEffect(() => {
    void loadFile(STORIES_PATH);
  }, []);
  const list = (draft?.value as { stories: StoryEntry[] } | undefined)?.stories;
  const index = list?.findIndex(item => item.id === storyId) ?? -1;
  const story = index >= 0 ? list![index] : undefined;
  if (!story) return <div className="content muted">{list ? 'Bu kitap bulunamadı.' : 'Yükleniyor…'}</div>;
  const editions = (summary ?? []).filter(item => item.storyId === storyId);
  // Levels written (often by the new-book writer) but not yet on the shelf of a visible book.
  const waiting = [...new Set(editions.map(item => item.level))].filter(item => !story.availableLevels.includes(item)).sort();
  const levels = [...story.availableLevels, ...waiting];
  const chosen = level && levels.includes(level) ? level : levels[0];
  const en = editions.find(item => item.level === chosen && item.language === 'en');
  const ar = editions.find(item => item.level === chosen && item.language === 'ar');
  const readOnly = !mayEditPath(STORIES_PATH);
  const missingArabic = levels.filter(item => !editions.some(edition => edition.level === item && edition.language === 'ar'));
  const changeStory = (change: (story: StoryEntry) => StoryEntry) =>
    updateDraft(STORIES_PATH, value => {
      const current = value as { stories: StoryEntry[] };
      return { ...current, stories: current.stories.map(item => (item.id === storyId ? change(item) : item)) };
    });
  const setText = (language: 'en' | 'ar', key: 'name' | 'description', text: string) =>
    changeStory(item => ({ ...item, text: { ...item.text, [language]: { ...item.text[language], [key]: text } } }));

  return (
    <div className="content">
      <div className="page-head">
        <img className={`book-cover${storyCover(storyId).placeholder ? ' placeholder' : ''}`} src={storyCover(storyId).imageSmall ?? storyCover(storyId).image} alt="" />
        <div className="grow">
          <p className="small">
            <a href="#/kitaplar">Kitaplar</a> ›
          </p>
          <h1>{story.text.en?.name}</h1>
          <p dir="rtl" className="ar">
            {story.text.ar?.name}
          </p>
        </div>
        <div className="actions">
          {levels.map(item => (
            <button key={item} type="button" className={`btn${item === chosen ? ' primary' : ''}`} onClick={() => setLevel(item)}>
              {item}
              {waiting.includes(item) && ' · rafta değil'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <h2>Bölümler · {chosen}</h2>
          {en ? <ChapterGrid storyId={storyId} level={chosen} pages={en.pages} arPages={ar?.pages} /> : <p className="muted">Bu seviyenin dosyası yok.</p>}
        </section>

        <section className="card">
          <h2>Kitabın adı ve görünürlüğü</h2>
          <p className="small muted">Bu yazılar kitap rafında ve kitabın kapağında görünür. Bütün seviyeler için ortaktır.</p>
          <TextField label="Adı (İngilizce)" value={story.text.en?.name ?? ''} onChange={text => setText('en', 'name', text)} path="en.name" ctx={{ language: 'en', level: 'B1', readOnly }} checks={false} />
          <TextField label="Kısa açıklama (İngilizce)" value={story.text.en?.description ?? ''} onChange={text => setText('en', 'description', text)} path="en.description" ctx={{ language: 'en', level: 'B1', readOnly }} long />
          <TextField label="Adı (Arapça)" value={story.text.ar?.name ?? ''} onChange={text => setText('ar', 'name', text)} path="ar.name" ctx={{ language: 'ar', level: 'B1', readOnly }} checks={false} />
          <TextField label="Kısa açıklama (Arapça)" value={story.text.ar?.description ?? ''} onChange={text => setText('ar', 'description', text)} path="ar.description" ctx={{ language: 'ar', level: 'B1', readOnly }} long />
          <div className="box">
            <div className="box-head">
              {story.hidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              <b>{story.hidden ? 'Gizli: sadece önizleme bağlantısıyla açılır' : 'Görünür: rafta herkes görür'}</b>
            </div>
            {story.hidden && missingArabic.length > 0 && !story.englishOnly && (
              <p className="small">
                <IconWarn size={14} /> Arapçası olmayan seviye var ({missingArabic.join(', ')}). Arapçası olmayan kitap gösterilmez.
              </p>
            )}
            {waiting.map(item => {
              const noArabic = missingArabic.includes(item) && !story.englishOnly;
              return (
                <p key={item} className="small">
                  {item} seviyesi yazıldı ama rafta değil.{' '}
                  {noArabic ? (
                    'Arapçası olmadan rafa çıkamaz.'
                  ) : (
                    !readOnly && (
                      <button
                        type="button"
                        className="btn small"
                        onClick={async () => {
                          if (await confirm({ title: `${item} rafa çıksın mı?`, text: 'Yayınlanınca bu seviyeyi herkes görür. İngilizcesinin ve Arapçasının bakıldığından emin olun.', yes: 'Rafa çıkar' }))
                            changeStory(entry => ({ ...entry, availableLevels: ['A1', 'A2', 'B1', 'B2'].filter(known => entry.availableLevels.includes(known) || known === item) }));
                        }}
                      >
                        {item} seviyesini rafa çıkar
                      </button>
                    )
                  )}
                </p>
              );
            })}
            {!readOnly && (
              <button
                type="button"
                className="btn small"
                disabled={story.hidden && missingArabic.length > 0 && !story.englishOnly}
                onClick={async () => {
                  if (story.hidden) {
                    if (await confirm({ title: 'Kitap rafa çıksın mı?', text: 'Yayınlanınca bu kitabı herkes görür. Bütün seviyelerinin ve Arapçasının hazır olduğundan emin olun.', yes: 'Göster' })) {
                      changeStory(item => {
                        const copy = { ...item };
                        delete copy.hidden;
                        return copy;
                      });
                    }
                  } else if (await confirm({ title: 'Kitap gizlensin mi?', text: 'Yayınlanınca kitap raftan kalkar; sadece önizleme bağlantısıyla açılır.', yes: 'Gizle', danger: true })) {
                    changeStory(item => ({ ...item, hidden: true }));
                  }
                }}
              >
                {story.hidden ? 'Rafa çıkar' : 'Gizle'}
              </button>
            )}
          </div>
          {draft && isDirty(draft) && (
            <div className="row" style={{ marginTop: 10 }}>
              <button type="button" className="btn primary small" onClick={() => void saveAll()}>
                Kaydet
              </button>
              <button type="button" className="btn ghost small" onClick={() => revertDraft(STORIES_PATH)}>
                Geri al
              </button>
            </div>
          )}
          <p className="small muted" style={{ marginTop: 12 }}>
            Yeni bir seviye ya da yeni bir kitap “Yeni kitap” sayfasından Word dosyasıyla eklenir. Kapak resmi uygulamanın kodunda durur; değiştirmek için Claude’a yazın. Kapağı olmayan kitapta koleksiyon resmi görünür.
          </p>
        </section>
      </div>
    </div>
  );
};

const ChapterGrid = ({ storyId, level, pages, arPages }: { storyId: string; level: string; pages: { id: number; type: string; title: string; quick: number; focus: number; wordNotes: number; audio: string }[]; arPages?: { audio: string }[] }) => {
  const [images, setImages] = useState<Record<number, ChapterFile>>({});
  useEffect(() => {
    let live = true;
    setImages({});
    chapterFiles(storyId, level, 'image')
      .then(found => live && setImages(found))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [storyId, level]);
  return (
    <div className="chapter-grid">
      {pages.map((page, index) => {
        const story = page.type === 'story';
        const arAudio = arPages?.[index]?.audio;
        const stale = page.audio === 'stale' || arAudio === 'stale';
        return (
          <a key={page.id} className="chapter-card" href={`#/duzenle/${storyId}/${level.toLowerCase()}/${index + 1}?dil=en`}>
            <span className="thumb" aria-hidden="true">
              {story && images[page.id] ? <img src={thumb(images[page.id].url, 240)} alt="" loading="lazy" /> : <span>{story ? page.id : '•'}</span>}
            </span>
            <span className="body">
              <b>{story ? `${page.id}. ${page.title}` : PAGE_TYPES[page.type] ?? page.title}</b>
              {story && (
                <span className="facts small muted">
                  {page.quick} Quick · {page.focus} Focus · {page.wordNotes} kelime
                  {stale && (
                    <span className="chip bad">
                      <IconSound size={12} /> ses eski
                    </span>
                  )}
                </span>
              )}
            </span>
          </a>
        );
      })}
    </div>
  );
};
