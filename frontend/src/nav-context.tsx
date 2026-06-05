"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppView = "programs" | "today" | "plan";

interface NavContextValue {
  view: AppView;
  setView: (view: AppView) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("programs");
  const value = useMemo<NavContextValue>(() => ({ view, setView }), [view]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error("useNav must be used within a NavProvider");
  }
  return context;
}
