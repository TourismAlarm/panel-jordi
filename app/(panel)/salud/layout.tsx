import type { ReactNode } from "react";
import { SubNavSalud } from "@/components/salud/SubNavSalud";

export default function LayoutSalud({ children }: { children: ReactNode }) {
  return (
    <>
      <SubNavSalud />
      {children}
    </>
  );
}
