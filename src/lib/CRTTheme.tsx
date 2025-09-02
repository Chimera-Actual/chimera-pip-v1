import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "green" | "amber" | "blue";
type CRTContextType = { 
  theme: Theme; 
  setTheme: (t: Theme) => void;
  scanlinesEnabled: boolean;
  setScanlinesEnabled: (enabled: boolean) => void;
};

const CRTContext = createContext<CRTContextType>({ 
  theme: "green", 
  setTheme: () => {}, 
  scanlinesEnabled: true,
  setScanlinesEnabled: () => {}
});

export function CRTThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem("crt:theme") as Theme) || "green"
  );
  const [scanlinesEnabled, setScanlinesEnabled] = useState(() => 
    localStorage.getItem("crt:scanlines") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("crt:theme", theme);
    document.documentElement.setAttribute("data-crt", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("crt:scanlines", scanlinesEnabled.toString());
    document.documentElement.toggleAttribute("data-scanlines", scanlinesEnabled);
  }, [scanlinesEnabled]);

  return (
    <CRTContext.Provider value={{ theme, setTheme, scanlinesEnabled, setScanlinesEnabled }}>
      {children}
    </CRTContext.Provider>
  );
}

export const useCRT = () => useContext(CRTContext);

export function CRTChrome({ children }: { children: React.ReactNode }) {
  const { scanlinesEnabled } = useCRT();
  
  return (
    <div className="crt-bg crt-text min-h-screen relative">
      {scanlinesEnabled && <div className="crt-scanlines pointer-events-none" />}
      {children}
    </div>
  );
}