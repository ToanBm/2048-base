"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import { env } from "@/lib/env";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import "@coinbase/onchainkit/styles.css";
import dynamic from "next/dynamic";
import { base } from "wagmi/chains";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <OnchainKitProvider
        apiKey={env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || undefined}
        projectId={env.NEXT_PUBLIC_MINIKIT_PROJECT_ID}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
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
    </ErudaProvider>
  );
}
