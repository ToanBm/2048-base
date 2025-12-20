"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import { env } from "@/lib/env";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import "@coinbase/onchainkit/styles.css";
import { base } from "wagmi/chains";
import { useTheme } from "@/hooks/use-theme";
import { useEffect } from "react";

// ErudaProvider disabled - uncomment for debugging
// import dynamic from "next/dynamic";
// const ErudaProvider = dynamic(
//   () => import("../components/Eruda").then((c) => c.ErudaProvider),
//   { ssr: false }
// );

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mounted } = useTheme();

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || undefined}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
          },
          wallet: {
            display: "modal",
          },
        }}
      >
        <MiniKitProvider
          projectId={env.NEXT_PUBLIC_MINIKIT_PROJECT_ID}
          notificationProxyUrl="/api/notification"
          chain={base}
        >
          <MiniAppProvider>{children}</MiniAppProvider>
        </MiniKitProvider>
      </OnchainKitProvider>
    </ThemeProvider>
  );
}
