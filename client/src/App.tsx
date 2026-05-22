import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/use-auth';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { AnalysisDetailPage } from './pages/AnalysisDetailPage';
import { PricingPage } from './pages/PricingPage';
import { SharePage } from './pages/SharePage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Header />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/share/:token" element={<SharePage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyze"
                element={
                  <ProtectedRoute>
                    <AnalyzePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis/:id"
                element={
                  <ProtectedRoute>
                    <AnalysisDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
