import { AppRouter } from "@/components/app-router";
import { ProgramProvider } from "@/program-context";
import { Providers } from "@/providers";

export function App() {
  return (
    <Providers>
      <ProgramProvider>
        <AppRouter />
      </ProgramProvider>
    </Providers>
  );
}
