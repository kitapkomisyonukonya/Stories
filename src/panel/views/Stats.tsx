import { useEffect, useMemo, useState } from 'react';
import { api, type StatsDay, type StatsSite } from '../api';
import { IconDown, IconRefresh } from '../icons';
import { storyName, toast } from '../store';

/**
 * Anonymous usage counts from the app (src/lib/stats.ts, deploy/stats.mjs). Only totals per day
 * exist: no person, device or address is stored, so nothing here can be traced back to anyone.
 */

const PERIODS: [string, number | null][] = [
  ['Bugün', 1],
  ['Son 7 gün', 7],
  ['Son 30 gün', 30],
  ['Son 90 gün', 90],
  ['Hepsi', null],
];

const MODES: Record<string, string> = { app: 'Ana ekrandan (uygulama gibi)', browser: 'Tarayıcıdan' };
const DEVICES: Record<string, string> = { phone: 'Telefon', tablet: 'Tablet', computer: 'Bilgisayar' };
const SYSTEMS: Record<string, string> = { android: 'Android', ios: 'iPhone / iPad', windows: 'Windows', mac: 'Mac', linux: 'Linux / Pardus', chromeos: 'Chromebook', other: 'Diğer' };
const LANGS: Record<string, string> = { en: 'İngilizce', ar: 'Arapça' };
const FEATURES: Record<string, string> = {
  pdf: 'PDF indirme',
  offline: 'Kitabı çevrimdışı kaydetme',
  journal: 'My Journal açılışı',
  'teacher-guide': "Teacher's Guide açılışı",
  'self-study': 'Self-Study Guide açılışı',
};

const turkeyToday = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const daysBefore = (day: string, count: number) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - count);
  return date.toISOString().slice(0, 10);
};
const dayText = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
const number = (value: number) => value.toLocaleString('tr-TR');

const sumMap = (days: StatsDay[], key: keyof StatsDay) => {
  const total: Record<string, number> = {};
  for (const day of days) for (const [name, count] of Object.entries((day[key] ?? {}) as Record<string, number>)) total[name] = (total[name] ?? 0) + count;
  return total;
};
const sum = (days: StatsDay[], key: keyof StatsDay) => days.reduce((total, day) => total + (Number(day[key]) || 0), 0);

const bookLabel = (key: string) => {
  const [storyId, level, lang] = key.split('|');
  return `${storyName(storyId)} · ${level}${lang ? ` · ${LANGS[lang] ?? lang}` : ''}`;
};

const Bars = ({ title, data, labels, limit }: { title: string; data: Record<string, number>; labels?: Record<string, string>; limit?: number }) => {
  const rows = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit ?? 50);
  const total = rows.reduce((all, [, count]) => all + count, 0);
  const top = rows[0]?.[1] ?? 0;
  return (
    <div className="card stats-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted small">Bu dönemde kayıt yok.</p>
      ) : (
        <ul className="stats-bars">
          {rows.map(([name, count]) => (
            <li key={name}>
              <span className="stats-bar-label">{labels?.[name] ?? name}</span>
              <span className="stats-bar-track" aria-hidden="true">
                <span style={{ width: `${Math.max(2, (count / top) * 100)}%` }} />
              </span>
              <span className="stats-bar-value">
                {number(count)}
                {total ? <span className="muted"> · %{Math.round((count / total) * 100)}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (days: StatsDay[], site: StatsSite) => {
  const head = ['Tarih', 'Ziyaret eden cihaz', 'Yeni cihaz', 'Ana ekrana ekleme', 'Ana ekrandan açılış', 'Kitap açılışı', 'Okunan sayfa', 'Ses dinleme'];
  const rows = days.map(day => [day.day, day.visits, day.newDevices, day.installs, day.launches, day.bookOpens, day.pages, day.audio]);
  const text = `${String.fromCharCode(0xfeff)}${[head, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `kullanim-istatistikleri-${site === 'live' ? 'canli' : 'pilot'}-${turkeyToday()}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const Stats = () => {
  const [site, setSite] = useState<StatsSite | ''>('');
  const [here, setHere] = useState<StatsSite>('preview');
  const [all, setAll] = useState<StatsDay[] | null>(null);
  const [period, setPeriod] = useState<number | null>(30);

  const load = (wanted: StatsSite | '' = site) => {
    setAll(null);
    api
      .stats(wanted || undefined)
      .then(result => {
        setAll(result.days);
        setHere(result.here);
        if (!wanted) setSite(result.site);
      })
      .catch(error => {
        setAll([]);
        toast((error as Error).message, 'bad');
      });
  };
  useEffect(() => load(''), []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = turkeyToday();
  const days = useMemo(() => {
    if (!all) return [];
    if (period === null) return all;
    const from = daysBefore(today, period - 1);
    return all.filter(day => day.day >= from && day.day <= today);
  }, [all, period, today]);

  const allInstalls = all ? sum(all, 'installs') : 0;
  const visits = sum(days, 'visits');
  const activeDays = days.filter(day => day.visits > 0).length;
  const hours = useMemo(() => {
    const total = Array(24).fill(0) as number[];
    for (const day of days) day.hours?.forEach((count, hour) => (total[hour] += count));
    return total;
  }, [days]);
  const topHour = Math.max(...hours, 0);
  const chartDays = days.slice(-60);
  const topVisits = Math.max(...chartDays.map(day => day.visits), 0);

  const books = sumMap(days, 'books');
  const bookPages = sumMap(days, 'bookPages');
  const bookAudio = sumMap(days, 'bookAudio');
  const bookRows = Object.keys({ ...books, ...bookPages })
    .map(key => ({ key, opens: books[key] ?? 0, pages: bookPages[key] ?? 0, audio: bookAudio[key] ?? 0 }))
    .sort((a, b) => b.opens - a.opens || b.pages - a.pages)
    .slice(0, 40);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>İstatistikler</h1>
          <p>
            Uygulamanın kaç cihazda açıldığı, ana ekrana kaç kez eklendiği ve en çok okunan kitaplar. Yalnızca günlük toplam sayılar tutulur: kişi, cihaz kimliği, IP adresi ya da çerez
            kaydedilmez.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => load()}>
            <IconRefresh size={16} /> Yenile
          </button>
          <button type="button" className="btn primary" disabled={!days.length} onClick={() => downloadCsv(days, site || here)}>
            <IconDown size={16} /> CSV indir
          </button>
        </div>
      </div>

      <div className="card feedback-filters">
        <label>
          <span className="small muted">Site</span>
          <select
            value={site}
            onChange={event => {
              const next = event.target.value as StatsSite;
              setSite(next);
              load(next);
            }}
          >
            <option value="preview">Pilot (önizleme bağlantısı)</option>
            <option value="live">Canlı site</option>
          </select>
        </label>
        <label>
          <span className="small muted">Dönem</span>
          <select value={period === null ? 'all' : String(period)} onChange={event => setPeriod(event.target.value === 'all' ? null : Number(event.target.value))}>
            {PERIODS.map(([label, value]) => (
              <option key={label} value={value === null ? 'all' : String(value)}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!all ? (
        <p className="muted">Yükleniyor…</p>
      ) : all.length === 0 ? (
        <div className="card">
          <p className="muted">
            {site === 'live' && here !== 'live'
              ? 'Canlı siteden henüz sayı gelmedi. Sayaç, uygulamanın bu sürümü canlıya alındığında çalışmaya başlar.'
              : 'Henüz sayı gelmedi. Sayaç bu sürümle başladı; ilk ziyaretlerle birlikte burada görünür.'}
          </p>
        </div>
      ) : (
        <>
          <p className="small muted stats-since">
            Sayım başlangıcı: {dayText(all[0].day)}. Ana ekrana toplam ekleme (başlangıçtan beri): <b>{number(allInstalls)}</b>
          </p>
          <div className="grid four stats-tiles">
            <div className="stat">
              <b>{number(sum(days, 'installs'))}</b>
              <span>ana ekrana ekleme (yükleme)</span>
            </div>
            <div className="stat">
              <b>{number(sum(days, 'launches'))}</b>
              <span>ana ekrandan açılış</span>
            </div>
            <div className="stat">
              <b>{number(visits)}</b>
              <span>ziyaret (cihaz × gün)</span>
            </div>
            <div className="stat">
              <b>{number(sum(days, 'newDevices'))}</b>
              <span>ilk kez gelen cihaz</span>
            </div>
            <div className="stat">
              <b>{activeDays ? number(Math.round(visits / activeDays)) : '–'}</b>
              <span>günlük ortalama ziyaret</span>
            </div>
            <div className="stat">
              <b>{number(sum(days, 'bookOpens'))}</b>
              <span>kitap açılışı</span>
            </div>
            <div className="stat">
              <b>{number(sum(days, 'pages'))}</b>
              <span>okunan sayfa</span>
            </div>
            <div className="stat">
              <b>{number(sum(days, 'audio'))}</b>
              <span>ses kaydı dinleme</span>
            </div>
          </div>

          {chartDays.length > 1 && (
            <div className="card stats-card">
              <h2>Günlük ziyaret</h2>
              <div className="stats-days" role="img" aria-label="Günlere göre ziyaret eden cihaz sayısı">
                {chartDays.map(day => (
                  <div key={day.day} className="stats-day" title={`${dayText(day.day)}: ${number(day.visits)} ziyaret, ${number(day.installs)} ekleme`}>
                    <span className="stats-day-value">{day.visits ? number(day.visits) : ''}</span>
                    <span className="stats-day-bar" style={{ height: `${topVisits ? Math.max(2, (day.visits / topVisits) * 100) : 0}%` }} />
                    <span className="stats-day-label">{shortDay(day.day)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid two stats-grid">
            <Bars title="Nasıl açılıyor?" data={sumMap(days, 'mode')} labels={MODES} />
            <Bars title="Cihaz türü" data={sumMap(days, 'device')} labels={DEVICES} />
            <Bars title="İşletim sistemi" data={sumMap(days, 'os')} labels={SYSTEMS} />
            <Bars title="Ana ekrana eklenen cihazlar" data={sumMap(days, 'installOs')} labels={SYSTEMS} />
            <Bars title="Uygulama dili" data={sumMap(days, 'lang')} labels={LANGS} />
            <Bars title="Seviyeye göre kitap açılışı" data={sumMap(days, 'levels')} />
            <Bars title="Özellik kullanımı" data={sumMap(days, 'features')} labels={FEATURES} />
            <div className="card stats-card">
              <h2>Günün saatine göre ziyaret</h2>
              <div className="stats-hours" role="img" aria-label="Saatlere göre ziyaret">
                {hours.map((count, hour) => (
                  <div key={hour} className="stats-hour" title={`${String(hour).padStart(2, '0')}:00: ${number(count)}`}>
                    <span className="stats-day-bar" style={{ height: `${topHour ? Math.max(count ? 3 : 0, (count / topHour) * 100) : 0}%` }} />
                    <span className="stats-day-label">{hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card stats-card">
            <h2>En çok okunan kitaplar</h2>
            {bookRows.length === 0 ? (
              <p className="muted small">Bu dönemde kitap açılmadı.</p>
            ) : (
              <div className="stats-table-wrap">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Kitap · seviye · dil</th>
                      <th>Açılış</th>
                      <th>Okunan sayfa</th>
                      <th>Ses dinleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookRows.map(row => (
                      <tr key={row.key}>
                        <td>{bookLabel(row.key)}</td>
                        <td>{number(row.opens)}</td>
                        <td>{number(row.pages)}</td>
                        <td>{number(row.audio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card stats-card">
            <h2>Sayılar nasıl tutuluyor?</h2>
            <ul className="small stats-notes">
              <li>“Ziyaret”: o gün uygulamayı açan cihaz sayısı. Aynı cihaz gün içinde kaç kez açarsa açsın bir kez sayılır.</li>
              <li>“Ana ekrana ekleme”: Android ve bilgisayarda yükleme onaylandığında, iPhone/iPad’de ana ekrana eklenen uygulama ilk kez açıldığında sayılır. Aynı cihaz bir kez sayılır.</li>
              <li>“Kitap açılışı” ve “okunan sayfa”: aynı ziyarette aynı kitap ve aynı sayfa bir kez sayılır.</li>
              <li>Tarayıcısında “İzlenmek istemiyorum” (Do Not Track) ayarı açık olan cihazlar hiç sayılmaz; tarayıcı verisini silen cihaz yeniden “ilk kez gelen” görünebilir.</li>
              <li>Panelin içinde açılan uygulama (ekip çalışması) sayılmaz.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
