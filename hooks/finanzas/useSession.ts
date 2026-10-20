"use client";

import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";

// Sustituye a useSession de NextAuth: misma forma ({ data, status }) con la sesión de Supabase.
type Usuario = { id: string; email: string | null; name: string | null; image: string | null };
type Estado = { data: { user: Usuario } | null; status: "loading" | "authenticated" | "unauthenticated" };

export function useSession(): Estado {
  const [estado, setEstado] = useState<Estado>({ data: null, status: "loading" });
  useEffect(() => {
    let vivo = true;
    supabaseNavegador()
      .auth.getUser()
      .then(({ data }) => {
        if (!vivo) return;
        const u = data.user;
        setEstado(
          u
            ? {
                status: "authenticated",
                data: {
                  user: {
                    id: u.id,
                    email: u.email ?? null,
                    name: (u.user_metadata?.full_name as string | undefined) ?? null,
                    image: (u.user_metadata?.avatar_url as string | undefined) ?? null,
                  },
                },
              }
            : { data: null, status: "unauthenticated" },
        );
      });
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}
