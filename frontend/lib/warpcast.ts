import { env } from "@/lib/env";

/**
 * Get the farcaster manifest for the mini app
 * Generate account association from Base.dev preview tool or Farcaster Manifest tool
 * @returns The farcaster manifest for the mini app
 */
export async function getFarcasterManifest() {
  let appName = "2048 Onchain";
  let noindex = false;
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl.includes("localhost")) {
    appName += " Local";
    noindex = true;
  } else if (appUrl.includes("ngrok")) {
    appName += " NGROK";
    noindex = true;
  } else if (appUrl.includes("https://dev.")) {
    appName += " Dev";
    noindex = true;
  }

  // Only include accountAssociation if all fields are present
  const hasAccountAssociation = 
    env.NEXT_PUBLIC_FARCASTER_HEADER && 
    env.NEXT_PUBLIC_FARCASTER_PAYLOAD && 
    env.NEXT_PUBLIC_FARCASTER_SIGNATURE;

  const accountAssociation = hasAccountAssociation
    ? {
        header: env.NEXT_PUBLIC_FARCASTER_HEADER,
        payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
        signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
      }
    : undefined;

  // Helper function to filter out empty properties
  function withValidProperties(properties: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(properties).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === "boolean") {
          return true; // Include boolean values
        }
        return !!value;
      })
    );
  }

  // Add version parameter to force reload images (cache busting)
  const imageVersion = "v3";
  
  const miniappData = withValidProperties({
    version: "1",
    name: appName,
    subtitle: "Play 2048 game onchain",
    description: "Classic 2048 puzzle game with onchain leaderboard. Compete with friends and climb the rankings!",
    screenshotUrls: [`${appUrl}/images/feed.png?${imageVersion}`],
    iconUrl: `${appUrl}/images/icon.png?${imageVersion}`,
    splashImageUrl: `${appUrl}/images/splash.png?${imageVersion}`,
    splashBackgroundColor: "#FFFFFF",
    homeUrl: appUrl,
    webhookUrl: `${appUrl}/api/webhook`,
    primaryCategory: "games",
    tags: ["puzzle", "games", "leaderboard", "onchain"],
    heroImageUrl: `${appUrl}/images/feed.png?${imageVersion}`,
    tagline: "2048 puzzle game onchain",
    ogTitle: "2048 Onchain - Puzzle Game",
    ogDescription: "Classic 2048 puzzle game with onchain leaderboard. Compete with friends!",
    ogImageUrl: `${appUrl}/images/feed.png?${imageVersion}`,
    noindex: noindex,
  });

  // Build response object
  const response: Record<string, unknown> = {
    miniapp: miniappData,
  };

  // Add accountAssociation if it exists
  if (accountAssociation) {
    response.accountAssociation = accountAssociation;
  }

  // Add baseBuilder if ownerAddress is set in env
  const ownerAddress = process.env.NEXT_PUBLIC_BASE_BUILDER_ADDRESS;
  if (ownerAddress) {
    response.baseBuilder = {
      ownerAddress: ownerAddress,
    };
  }

  return response;
}
