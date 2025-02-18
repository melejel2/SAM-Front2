import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";

import { Theme, useTheme } from "@/components/daisyui";

import Router from "@/services/routes/Router";
import { AuthContextProvider } from "@/states/auth";
import { LayoutContextProvider } from "@/states/layout";

function App() {
  const { theme } = useTheme();

  return (
    <>
      <HelmetProvider>
        <Theme dataTheme={theme}>
          <LayoutContextProvider>
            <AuthContextProvider>
              <Router />
              <Toaster richColors />
            </AuthContextProvider>
          </LayoutContextProvider>
        </Theme>
      </HelmetProvider>
    </>
  );
}

export default App;
