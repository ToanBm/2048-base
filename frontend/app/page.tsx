import App from "@/components/App";
import { env } from "@/lib/env";
import { Metadata } from "next";

const appUrl = env.NEXT_PUBLIC_URL;
const imageVersion = "v3"; // Cache busting for images

const frame = {
  version: "next",
  imageUrl: `${appUrl}/images/feed.png?${imageVersion}`,
  button: {
    title: "Launch App",
    action: {
      type: "launch_frame",
      name: "Mini-app Starter",
      url: appUrl,
      splashImageUrl: `${appUrl}/images/splash.png?${imageVersion}`,
      splashBackgroundColor: "#ffffff",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "2048 Onchain",
    openGraph: {
      title: "2048 Onchain",
      description: "Classic 2048 puzzle game with onchain leaderboard",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
