/**
 * Reloads the page so it starts from the newest build. A one-off query value makes the browser
 * (and any cache or in-app browser in between) fetch index.html again instead of reusing the old
 * page, whose script files a new deploy has replaced. Other query values (?gizli=…) and the
 * route in the hash are kept, so the reader comes back to the same book and page.
 */
export const reloadFresh = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('fresh', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
};
