import posthog from 'posthog-js';

// PostHog project API key is a public, client-side key and is safe to commit.
// Override via VITE_POSTHOG_KEY / VITE_POSTHOG_HOST if needed.
const POSTHOG_KEY =
  import.meta.env.VITE_POSTHOG_KEY || 'phc_ncXBpP4HUH6iynjXhK3tMLGDVjSXL7a8dpnJvrXKpsD9';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // We track route changes manually because the app uses HashRouter.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie'
  });
  initialized = true;
}

export function capturePageview(path) {
  if (!initialized) return;
  posthog.capture('$pageview', { $current_url: window.location.href, path });
}

export function captureEvent(event, properties) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export default posthog;
