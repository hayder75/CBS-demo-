import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import { cbsTheme } from './theme';
import './index.css';

async function enableMocking() {
  const useMock =
    import.meta.env.VITE_USE_MOCK === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false');
  if (useMock) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider locale={enUS} theme={cbsTheme}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </StrictMode>,
  );
});