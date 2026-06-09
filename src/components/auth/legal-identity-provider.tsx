'use client';

import { createContext, useContext } from 'react';

type LegalIdentity = {
  companyLegalName: string;
  cnpj: string;
};

const LegalIdentityContext = createContext<LegalIdentity>({
  companyLegalName: '',
  cnpj: '',
});

export function LegalIdentityProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LegalIdentity;
}) {
  return (
    <LegalIdentityContext.Provider value={value}>
      {children}
    </LegalIdentityContext.Provider>
  );
}

export function useLegalIdentity() {
  return useContext(LegalIdentityContext);
}
