export const APP_EVENTS = {
  followChanged: 'ic:follow-changed',
} as const;

export function emitFollowChanged() {
  window.dispatchEvent(new CustomEvent(APP_EVENTS.followChanged));
}

