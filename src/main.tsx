import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from './App.tsx'
import './index.css'
import ReconnectManager from './components/system/ReconnectManager'

// Limpa cache do navegador ao iniciar
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
}

// Limpa localStorage e sessionStorage (exceto auth)
const preserveKeys = ['connect-vida-auth', 'connect-vida-churches'];
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
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: true,    // revalidar ao voltar para a aba
      refetchOnReconnect: true,      // revalidar ao reconectar a internet
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
        <ReconnectManager />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)