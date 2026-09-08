import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

async function enableMocking() {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
  if (import.meta.env.DEV && useMock) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider
        locale={enUS}
        theme={{
          token: { colorPrimary: '#0e7a5f', borderRadius: 8 },
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </StrictMode>,
  );
});