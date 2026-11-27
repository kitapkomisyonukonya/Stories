import { useEffect, useState, type ReactNode } from 'react';
import { api, signIn, signOutOfPanel, setDemoMode, watchUser, PanelError, type Role } from './api';
import { Editor } from './Editor';
import {
  IconBooks,
  IconCard,
  IconChart,
  IconClock,
  IconSend,
  IconBell,
  IconHelp,
  IconHome,
  IconImage,
  IconInbox,
  IconLogout,
  IconMenu,
  IconRocket,
  IconSearch,
  IconSparkDoc,
  IconUsers,
} from './icons';
import { Palette } from './Palette';
import { navigate, useRoute } from './router';
import { dirtyDrafts, getState, loadLibrary, refreshBasket, refreshBaskets, saveAll, setState, useStore } from './store';
import { ConfirmHost, Toast } from './ui';
import { Baskets } from './views/Baskets';
import { BookDetail, Books } from './views/Books';
import { Cards } from './views/Cards';
import { Feedback } from './views/Feedback';
import { Stats } from './views/Stats';
import { Notices } from './views/Notices';
import { Help } from './views/Help';
import { History } from './views/History';
import { Home } from './views/Home';
import { MediaPage } from './views/MediaPage';
import { NewBook } from './views/NewBook';
import { Settings } from './views/Settings';
import { Team } from './views/Team';

/**
 * Lisandan Kültüre's management panel. Everything a person sees in the app can be opened here and
 * changed, in Turkish, without code: texts, exercises, word notes, pictures, recordings, the
 * Teacher's Book, the book list and the team. Changes collect in each person's basket; an admin
 * publishes a basket in one go, which makes one new preview build.
 */

export const PanelApp = () => {
  const config = useStore(state => state.config);
  const user = useStore(state => state.user);
  const member = useStore(state => state.member);
  const memberError = useStore(state => state.memberError);

  useEffect(() => {
    void api.config().then(result => {
      setDemoMode(Boolean(result?.demo));
      setState({ config: result });
    });
  }, []);

  useEffect(() => {
    if (config === undefined) return;
    if (config === null) {
      // No server behind the panel (a plain local build): read-only, from the bundled copies.
      setState({ user: null });
      void loadLibrary();
      return;
    }
    return watchUser(next => {
      setState({ user: next, member: null, memberError: null });
      if (!next) return;
      api
        .me()
        .then(async me => {
          setState({ member: me });
          await api.previewAccess();
          void loadLibrary();
          void refreshBasket();
          void refreshBaskets();
        })
        .catch((error: PanelError) => setState({ memberError: error.message }));
    });
  }, [config]);

  // Nothing unsaved is lost by closing the tab by mistake.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyDrafts().length === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (config === undefined || (config && user === undefined)) return <div className="signin">Yükleniyor…</div>;
  if (config && !user) return <SignIn />;
  if (config && user && !member)
    return memberError ? (
      <SignIn error={memberError} />
    ) : (
      <div className="signin">
        <span>Ekip listesine bakılıyor…</span>
      </div>
    );
  return <Shell />;
};

const SignIn = ({ error }: { error?: string }) => {
  const config = useStore(state => state.config);
  const [busy, setBusy] = useState(false);
  const roles: Partial<Record<Role, string>> = config?.roles ?? {};
  return (
    <div className="signin">
      <div className="dialog" role="main">
        <div className="brand-mark" aria-hidden="true" />
        <h1>Lisandan Kültüre · Yönetim</h1>
        <p className="muted">Kitapların her yazısı, alıştırması, resmi ve sesi buradan değişir. Kod bilmek gerekmez.</p>
        {error && <div className="notice bad">{error}</div>}
        {config?.demo ? (
          <>
            <p className="small">Deneme sürümü: bir ekip üyesi seçin. Burada yapılanlar sadece bu bilgisayarda, hafızada durur.</p>
            <div className="list">
              {(config.demoPeople ?? []).map(person => (
                <button key={person.email} type="button" className="btn" onClick={() => void signIn(person.email)}>
                  {person.email} · {roles[person.role] ?? person.role}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="google-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              signIn()
                .catch(() => setState({ memberError: 'Giriş tamamlanamadı. Açılan pencereye izin verip tekrar deneyin.' }))
                .finally(() => setBusy(false));
            }}
          >
            {busy ? 'Açılıyor…' : 'Google hesabıyla giriş yap'}
          </button>
        )}
        {error && (
          <button type="button" className="btn ghost small" onClick={() => void signOutOfPanel()}>
            Başka bir hesapla gir
          </button>
        )}
        <p className="small muted">Sadece ekip listesindeki hesaplar girebilir. Listeye bir yönetici ekler.</p>
      </div>
    </div>
  );
};

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  count?: number;
  show?: boolean;
}

const Shell = () => {
  const route = useRoute();
  const member = useStore(state => state.member);
  const config = useStore(state => state.config);
  const basket = useStore(state => state.basket);
  const baskets = useStore(state => state.baskets);
  const drafts = useStore(state => state.drafts);
  const user = useStore(state => state.user);
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const unsaved = dirtyDrafts(drafts).length;
  const waiting = (baskets ?? []).filter(item => item.owner !== member?.id && (item.files.length > 0 || item.media.length > 0)).length;
  const mine = (basket?.files.length ?? 0) + (basket?.media.length ?? 0);
  const admin = Boolean(member?.approve);

  // Ctrl+K: search everything. Ctrl+S: save.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (dirtyDrafts().length) void saveAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Baskets change when others save; a quiet look every minute keeps the counts true.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshBasket();
        void refreshBaskets();
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => setMenu(false), [route]);

  const nav: NavItem[] = [
    { to: '/', label: 'Ana sayfa', icon: <IconHome size={18} /> },
    { to: '/kitaplar', label: 'Kitaplar', icon: <IconBooks size={18} /> },
    { to: '/kartlar', label: 'Places & People', icon: <IconCard size={18} /> },
    { to: '/medya', label: 'Resim ve ses', icon: <IconImage size={18} /> },
    { to: '/yeni-kitap', label: 'Yeni kitap', icon: <IconSparkDoc size={18} />, show: member?.role !== 'viewer' },
    { to: '/onay', label: admin ? 'Onay bekleyenler' : 'Sepetim', icon: <IconInbox size={18} />, count: admin ? waiting + (mine ? 1 : 0) : mine },
    { to: '/gecmis', label: 'Geçmiş', icon: <IconClock size={18} /> },
    { to: '/istatistik', label: 'İstatistikler', icon: <IconChart size={18} /> },
    { to: '/geri-bildirim', label: 'Geri bildirimler', icon: <IconSend size={18} /> },
    { to: '/bildirim', label: 'Bildirimler', icon: <IconBell size={18} />, show: admin },
    { to: '/ekip', label: 'Ekip', icon: <IconUsers size={18} /> },
    { to: '/ayarlar', label: 'Yayın ve ayarlar', icon: <IconRocket size={18} />, show: admin },
    { to: '/yardim', label: 'Yardım', icon: <IconHelp size={18} /> },
  ];
  const [first] = route.parts;
  const current = `/${first ?? ''}`;
  const active = (to: string) => (to === '/' ? current === '/' : current === to || (to === '/kitaplar' && (first === 'kitap' || first === 'duzenle')));

  let page: ReactNode;
  switch (first) {
    case undefined:
      page = <Home />;
      break;
    case 'kitaplar':
      page = <Books />;
      break;
    case 'kitap':
      page = <BookDetail storyId={route.parts[1]} />;
      break;
    case 'duzenle': {
      const [, storyId, level, number] = route.parts;
      page = (
        <Editor
          key={`${storyId}-${level}`}
          storyId={storyId}
          level={level?.toUpperCase() ?? 'A2'}
          pageNumber={Number(number) || 1}
          language={route.query.get('dil') === 'ar' ? 'ar' : 'en'}
          focus={route.query.get('yer') ?? undefined}
        />
      );
      break;
    }
    case 'onay':
      page = <Baskets />;
      break;
    case 'medya':
      page = <MediaPage />;
      break;
    case 'kartlar':
      page = <Cards focus={route.query.get('kart') ?? undefined} />;
      break;
    case 'yeni-kitap':
      page = <NewBook />;
      break;
    case 'ekip':
      page = <Team />;
      break;
    case 'istatistik':
      page = <Stats />;
      break;
    case 'geri-bildirim':
      page = <Feedback />;
      break;
    case 'bildirim':
      page = <Notices admin={admin} />;
      break;
    case 'gecmis':
      page = <History />;
      break;
    case 'yardim':
      page = <Help />;
      break;
    case 'ayarlar':
      page = <Settings />;
      break;
    default:
      page = (
        <div className="content">
          <p>Bu sayfa bulunamadı.</p>
          <button type="button" className="btn" onClick={() => navigate('/')}>
            Ana sayfaya dön
          </button>
        </div>
      );
  }

  return (
    <div className={`shell${menu ? ' menu-open' : ''}${first === 'duzenle' ? ' editing' : ''}`}>
      <aside className="rail" aria-label="Menü">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <b>Lisandan Kültüre</b>
            <span>Yönetim paneli</span>
          </span>
        </div>
        <nav>
          {nav
            .filter(item => item.show !== false)
            .map(item => (
              <a key={item.to} href={`#${item.to}`} aria-current={active(item.to) ? 'page' : undefined}>
                {item.icon}
                <span className="grow">{item.label}</span>
                {item.count ? <span className="count">{item.count}</span> : null}
              </a>
            ))}
        </nav>
        <div className="me">
          <span className="avatar" aria-hidden="true">
            {(member?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="grow">
            <b>{member?.name ?? 'Misafir'}</b>
            <span className="small">{member?.label ?? (config === null ? 'Sadece okuma' : '')}</span>
          </span>
          {member && (
            <button
              type="button"
              title="Panelden çıkış yap"
              onClick={async () => {
                if (getState().drafts && dirtyDrafts().length && !window.confirm('Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?')) return;
                await signOutOfPanel();
              }}
            >
              <IconLogout size={16} />
              Çıkış yap
            </button>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-button" aria-label="Menüyü aç" onClick={() => setMenu(value => !value)}>
            <IconMenu size={20} />
          </button>
          <button type="button" className="search-button" onClick={() => setPalette(true)}>
            <IconSearch size={16} />
            <span className="grow">Kitaplarda ara: bir kelime, cümle, soru…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <span className="spacer" />
          {unsaved > 0 && (
            <button type="button" className="btn primary small" onClick={() => void saveAll()}>
              {unsaved === 1 ? '1 dosyada değişiklik · Kaydet' : `${unsaved} dosyada değişiklik · Kaydet`}
            </button>
          )}
          {mine > 0 && (
            <a className="btn small" href="#/onay">
              Sepetim: {mine}
            </a>
          )}
        </header>
        {config === null && (
          <div className="notice warn" style={{ margin: 12 }}>
            Panel sunucusuz açıldı: sadece okunur. Değişiklik yapmak için panelin yayındaki adresinden girin.
          </div>
        )}
        {page}
      </div>
      {menu && <div className="rail-shade" onClick={() => setMenu(false)} />}
      {palette && <Palette onClose={() => setPalette(false)} />}
      <Toast />
      <ConfirmHost />
    </div>
  );
};
