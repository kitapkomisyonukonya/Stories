/**
 * The name under the home-screen icon follows the phone's language: Turkish phones get
 * "Lisandan Kültüre", Arabic phones the Arabic name, every other language the English name.
 * Android Chrome reads the manifest link (it notices the change); iPhone Safari reads
 * apple-mobile-web-app-title when "Add to Home Screen" is tapped.
 */
const NAMES = {
  tr: { manifest: '/manifest-tr.webmanifest', title: 'Lisandan Kültüre' },
  ar: { manifest: '/manifest-ar.webmanifest', title: 'من اللغة إلى الثقافة' },
  en: { manifest: '/manifest.webmanifest', title: 'From Language to Culture' },
} as const;

export const applyHomeScreenName = () => {
  const lang = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  const pick = lang.startsWith('tr') ? NAMES.tr : lang.startsWith('ar') ? NAMES.ar : NAMES.en;
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (link && link.getAttribute('href') !== pick.manifest) link.setAttribute('href', pick.manifest);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
  if (meta) meta.content = pick.title;
};
