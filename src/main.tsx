import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from './App.tsx'
import './index.css'

// Limpa cache do navegador ao iniciar
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
}

// Limpa localStorage e sessionStorage (exceto auth)
const preserveKeys = ['connect-vida-auth', 'connect-vida-churches', 'lumina_cookie_consent'];
Object.keys(localStorage).forEach(key => {
  if (!preserveKeys.some(preserveKey => key.includes(preserveKey))) {
    localStorage.removeItem(key);
  }
});
Object.keys(sessionStorage).forEach(key => {
  sessionStorage.removeItem(key);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos para dados serem considerados "velhos"
      gcTime: 1000 * 60 * 15, // 15 minutos para o cache ser limpo se não usado
      refetchOnWindowFocus: false,   // **CHAVE**: Previne loading infinito ao trocar de aba
      refetchOnReconnect: true,      // **CHAVE**: revalida ao reconectar a internet
      retry: 1, // Tenta novamente 1 vez em caso de erro
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <SpeedInsights />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)