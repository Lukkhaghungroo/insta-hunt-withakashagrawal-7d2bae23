import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

import IndexWithVanta from "./pages/IndexWithVanta";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateRoute from "@/components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Protected route, wrapped in ThemeProvider for the main app UI */}
          <Route
            path="/"
            element={
              <ThemeProvider>
                <PrivateRoute>
                  <IndexWithVanta />
                </PrivateRoute>
              </ThemeProvider>
            }
          />

          {/* Auth pages, now with ThemeProvider for consistent theming */}
          <Route
            path="/login"
            element={
              <ThemeProvider>
                <Login />
              </ThemeProvider>
            }
          />
          <Route
            path="/signup"
            element={
              <ThemeProvider>
                <Signup />
              </ThemeProvider>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
