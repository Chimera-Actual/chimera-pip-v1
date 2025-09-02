import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AudioProvider } from "@/contexts/AudioContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { UserProfileProvider } from "@/hooks/useUserProfile";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { AppErrorBoundary } from "@/components/ui/ComprehensiveErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && 'status' in error && typeof error.status === 'number') {
          return error.status >= 500 && failureCount < 2;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProfileProvider>
          <ThemeProvider>
            <AudioProvider>
              <LocationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      } />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </LocationProvider>
            </AudioProvider>
          </ThemeProvider>
        </UserProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
