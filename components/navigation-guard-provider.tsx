"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface NavigationGuardContextValue {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  requestNavigation: (href: string) => boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  isConfirmingNavigation: boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const value = useMemo<NavigationGuardContextValue>(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges,
      requestNavigation: (href) => {
        if (!hasUnsavedChanges) {
          return true;
        }

        setPendingHref(href);
        return false;
      },
      confirmNavigation: () => {
        if (pendingHref) {
          setHasUnsavedChanges(false);
          router.push(pendingHref);
        }
        setPendingHref(null);
      },
      cancelNavigation: () => {
        setPendingHref(null);
      },
      isConfirmingNavigation: Boolean(pendingHref)
    }),
    [hasUnsavedChanges, pendingHref, router]
  );

  return (
    <NavigationGuardContext.Provider value={value}>{children}</NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);

  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider.");
  }

  return context;
}
