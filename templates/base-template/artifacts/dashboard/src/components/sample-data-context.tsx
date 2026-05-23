import { createContext, useContext, useState, ReactNode } from "react";

interface SampleDataContextType {
  sampleDataEnabled: boolean;
  setSampleDataEnabled: (enabled: boolean) => void;
}

const SampleDataContext = createContext<SampleDataContextType>({
  sampleDataEnabled: true,
  setSampleDataEnabled: () => {},
});

export function SampleDataProvider({ children }: { children: ReactNode }) {
  const [sampleDataEnabled, setSampleDataEnabled] = useState(true);

  return (
    <SampleDataContext.Provider value={{ sampleDataEnabled, setSampleDataEnabled }}>
      {children}
    </SampleDataContext.Provider>
  );
}

export function useSampleData() {
  return useContext(SampleDataContext);
}
