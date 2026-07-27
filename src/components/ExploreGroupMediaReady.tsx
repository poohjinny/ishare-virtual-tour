import { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether Explore group children may start thumbnail / preview loads.
 * False while a sector expand animation is in flight so decode/network
 * work does not compete with the 0fr→1fr layout transition.
 */
const ExploreGroupMediaReadyContext = createContext(true);

export function ExploreGroupMediaReadyProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <ExploreGroupMediaReadyContext.Provider value={ready}>
      {children}
    </ExploreGroupMediaReadyContext.Provider>
  );
}

export function useExploreGroupMediaReady(): boolean {
  return useContext(ExploreGroupMediaReadyContext);
}
