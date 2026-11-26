import { useState } from 'react';
import { api, PanelError } from '../api';
import { IconBell } from '../icons';
import { toast } from '../store';
import { confirm } from '../ui';

/**
 * New-story notices. Readers who turned notices on in the app ("Install the app" page or the
 * toast in the installed app) get this message on their phone, tablet or computer. Each language
 * of the app gets its own text; a language left empty is not sent. Nothing about the readers is
 * kept: the server only knows the topic, not who is in it.
 */
export const Notices = ({ admin }: { admin: boolean }) => {
  const [titleEn, setTitleEn] = useState('');
  const [textEn, setTextEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [textAr, setTextAr] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const send = async () => {
    if (!titleEn.trim() && !titleAr.trim()) {
      toast('En az bir dilde başlık yazın.', 'bad');
      return;
    }
    const langs = [titleEn.trim() && 'İngilizce', titleAr.trim() && 'Arapça'].filter(Boolean).join(' ve ');
    const ok = await confirm({
      title: 'Bildirim gönderilsin mi?',
      text: `Bildirimleri açmış herkese ${langs} bildirim gidecek. Gönderilen bildirim geri alınamaz.`,
      yes: 'Gönder',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const result = await api.sendNotice({ title: { en: titleEn, ar: titleAr }, text: { en: textEn, ar: textAr }, link });
      setLast(new Date().toLocaleString('tr-TR'));
      toast(`Bildirim gönderildi (${result.sent.map(lang => (lang === 'ar' ? 'Arapça' : 'İngilizce')).join(', ')}).`, 'good');
    } catch (error) {
      toast(error instanceof PanelError ? error.message : 'Bildirim gönderilemedi.', 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content">
      <div className="page-head">
        <h1>Bildirimler</h1>
      </div>
      <section className="card">
        <p className="muted">
          Uygulamada bildirimleri açan okurların telefonuna, tabletine veya bilgisayarına kısa bir bildirim gider. Uygulama dili İngilizce olanlara İngilizce metin,
          Arapça olanlara Arapça metin gider; boş bırakılan dil gönderilmez. iPhone ve iPad'de bildirim yalnızca ana ekrana eklenmiş uygulamaya gelir.
        </p>
        {!admin ? (
          <p className="bad">Bildirimi yalnızca yöneticiler gönderebilir.</p>
        ) : (
          <>
            <div className="grid two">
              <div>
                <label className="field">
                  <span className="field-label">Başlık (İngilizce)</span>
                  <input value={titleEn} maxLength={80} onChange={event => setTitleEn(event.target.value)} placeholder="New story: Zero Waste A2" />
                </label>
                <label className="field">
                  <span className="field-label">Metin (İngilizce)</span>
                  <textarea value={textEn} maxLength={220} rows={3} onChange={event => setTextEn(event.target.value)} placeholder="Read and listen now." />
                </label>
              </div>
              <div>
                <label className="field">
                  <span className="field-label">Başlık (Arapça)</span>
                  <input value={titleAr} maxLength={80} dir="rtl" onChange={event => setTitleAr(event.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Metin (Arapça)</span>
                  <textarea value={textAr} maxLength={220} rows={3} dir="rtl" onChange={event => setTextAr(event.target.value)} />
                </label>
              </div>
            </div>
            <label className="field">
              <span className="field-label">Açılacak sayfa (isteğe bağlı)</span>
              <input value={link} onChange={event => setLink(event.target.value)} placeholder="#/zerowaste/a2" dir="ltr" />
              <small>Boş bırakılırsa kütüphane açılır. Uygulamadaki adresin # ile başlayan kısmı yazılır.</small>
            </label>
            <div className="actions">
              <button type="button" className="btn primary" disabled={busy} onClick={() => { void send(); }}>
                <IconBell size={16} /> {busy ? 'Gönderiliyor…' : 'Bildirimi gönder'}
              </button>
              {last && <span className="small muted">Son gönderim: {last}</span>}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
