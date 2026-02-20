
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import LoadingFallback from "./components/ui/LoadingFallback";
import ForcePasswordChangeModal from "./components/auth/ForcePasswordChangeModal";

// Lazy-loaded pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const IntroVideo = lazy(() => import("./pages/IntroVideo"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const Vehiculos = lazy(() => import("./pages/Vehiculos"));
const Produccion = lazy(() => import("./pages/Produccion"));
const PlanificacionProduccion = lazy(() => import("./pages/PlanificacionProduccion"));
const CRM = lazy(() => import("./pages/CRM"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Calidad = lazy(() => import("./pages/Calidad"));
const Incidencias = lazy(() => import("./pages/Incidencias"));
const Admin = lazy(() => import("./pages/Admin"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ForcePasswordChangeModal />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />

                {/* Todas las rutas protegidas */}
                <Route path="/intro" element={
                  <ProtectedRoute>
                    <IntroVideo />
                  </ProtectedRoute>
                } />

                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/crm" element={
                  <ProtectedRoute>
                    <CRM />
                  </ProtectedRoute>
                } />

                <Route path="/presupuestos" element={
                  <ProtectedRoute>
                    <Presupuestos />
                  </ProtectedRoute>
                } />

                <Route path="/contratos" element={
                  <ProtectedRoute>
                    <Contratos />
                  </ProtectedRoute>
                } />

                <Route path="/proyectos" element={
                  <ProtectedRoute>
                    <Proyectos />
                  </ProtectedRoute>
                } />

                <Route path="/proyectos/:id" element={
                  <ProtectedRoute>
                    <ProyectoDetalle />
                  </ProtectedRoute>
                } />

                <Route path="/vehiculos" element={
                  <ProtectedRoute>
                    <Vehiculos />
                  </ProtectedRoute>
                } />

                <Route path="/planificacion-produccion" element={
                  <ProtectedRoute>
                    <PlanificacionProduccion />
                  </ProtectedRoute>
                } />

                <Route path="/produccion" element={
                  <ProtectedRoute>
                    <Produccion />
                  </ProtectedRoute>
                } />

                <Route path="/calidad" element={
                  <ProtectedRoute>
                    <Calidad />
                  </ProtectedRoute>
                } />

                <Route path="/incidencias" element={
                  <ProtectedRoute>
                    <Incidencias />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />

                <Route path="/usuarios" element={
                  <ProtectedRoute requiredDepartment="Dirección">
                    <Usuarios />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
