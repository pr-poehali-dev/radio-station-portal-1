import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/store";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Stations from "@/pages/Stations";
import Auth from "@/pages/Auth";
import Favorites from "@/pages/Favorites";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import Donate from "@/pages/Donate";
import Terms from "@/pages/Terms";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppInit() {
  const { sessionId, setUser } = useAuth();

  useEffect(() => {
    // Синхронизируем хеш пароля admin при первом запуске
    if (!localStorage.getItem('admin_reset_done')) {
      fetch('https://functions.poehali.dev/170a245f-0cc7-4b10-8c9e-285f70156ada/reset-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(() => {
        localStorage.setItem('admin_reset_done', '1');
      }).catch(() => {});
    }

    if (sessionId) {
      authApi.me().then(r => {
        if (r.ok) setUser(r.data.user);
      });
    }
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInit />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/stations" element={<Layout><Stations /></Layout>} />
          <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/donate" element={<Layout><Donate /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/auth" element={<Layout><Auth /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;