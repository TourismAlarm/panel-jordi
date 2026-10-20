"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/finanzas/Toaster";

// Lo que envolvía a la app original (React Query y avisos), solo para el módulo Finanzas.
export function ProveedorFinanzas({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30 * 1000, refetchOnWindowFocus: true, retry: 2 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
