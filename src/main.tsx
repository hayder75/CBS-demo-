import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import App from './App';
import { cbsTheme } from './theme';
import './index.css';

// When a lazily-loaded route chunk fails to load (typically a stale hash after a
// redeploy), reload once to pick up the new build instead of crashing the page.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'cbs-chunk-reloaded';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  });
}

async function enableMocking(): Promise<void> {
  const useMock =
    import.meta.env.VITE_USE_MOCK === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false');
  if (!useMock) return;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[CBS] mock worker load attempt ${attempt} failed; retrying…`, err);
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  console.error('[CBS] mock worker failed to start after retries', lastError);
}

enableMocking().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider locale={enUS} theme={cbsTheme}>
        <I18nProvider>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </I18nProvider>
      </ConfigProvider>
    </StrictMode>,
  );
});
