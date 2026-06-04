import { AppRouter } from "@/components/app-router";
import { NavProvider } from "@/nav-context";
import { ProgramProvider } from "@/program-context";
import { Providers } from "@/providers";

export function App() {
  return (
    <Providers>
      <ProgramProvider>
        <NavProvider>
          <AppRouter />
        </NavProvider>
      </ProgramProvider>
    </Providers>
  );
}
