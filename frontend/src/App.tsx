import { BetaDashboard } from "@/components/beta-dashboard";
import { Providers } from "@/providers";

export function App() {
  return (
    <Providers>
      <BetaDashboard />
    </Providers>
  );
}
