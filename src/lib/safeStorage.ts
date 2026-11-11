/**
 * Some pages that embed the app (an LMS that plays the SCORM package in a sandboxed frame, a browser with
 * site data blocked) refuse any use of localStorage/sessionStorage: even reading the property throws, and
 * the app stopped at its error card. Then the app gets an in-memory stand-in, so the book still opens; its
 * progress lasts until the page is closed. Where storage works, nothing changes.
 */
const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: key => (data.has(String(key)) ? (data.get(String(key)) as string) : null),
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => {
      data.delete(String(key));
    },
    setItem: (key, value) => {
      data.set(String(key), String(value));
    },
  };
};

const ensure = (name: 'localStorage' | 'sessionStorage') => {
  try {
    const storage = window[name];
    const probe = '__storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
  } catch {
    try {
      Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
    } catch {
      /* nothing more can be done; the error card stays the fallback */
    }
  }
};

if (typeof window !== 'undefined') {
  ensure('localStorage');
  ensure('sessionStorage');
}

export {};
