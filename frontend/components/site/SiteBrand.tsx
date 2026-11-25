// components/site/SiteBrand.tsx — passes the admin-configured logo (Settings
// → Theme) to client components such as the header.

'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface SiteBrand {
  logoUrl: string | null;
}

const SiteBrandContext = createContext<SiteBrand>({ logoUrl: null });

export function SiteBrandProvider({ logoUrl, children }: SiteBrand & { children: ReactNode }) {
  return <SiteBrandContext.Provider value={{ logoUrl }}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand(): SiteBrand {
  return useContext(SiteBrandContext);
}
