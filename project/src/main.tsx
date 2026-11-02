import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SetupNeeded from './components/SetupNeeded';
import './index.css';

const root = createRoot(document.getElementById('root')!);

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (isConfigured) {
  import('./AppRoot').then(({ default: AppRoot }) => {
    root.render(
      <StrictMode>
        <AppRoot />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <StrictMode>
      <SetupNeeded />
    </StrictMode>,
  );
}
