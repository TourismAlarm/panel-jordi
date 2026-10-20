import type { ReactNode } from "react";
import { SubNavElsa } from "@/components/app/SubNavElsa";

export default function LayoutElsa({ children }: { children: ReactNode }) {
  return (
    <>
      <SubNavElsa />
      {children}
    </>
  );
}
