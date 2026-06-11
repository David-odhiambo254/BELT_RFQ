import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { GoogleOAuthProvider } from '@react-oauth/google';
import { TranslationProvider } from './translations/TranslationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider>
      <GoogleOAuthProvider clientId="612221117306-tg1k55qjpggr3iboenv87h8gjb31g590.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </TranslationProvider>
  </StrictMode>,
)
