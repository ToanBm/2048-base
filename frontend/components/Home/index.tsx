"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load game component
const Game2048 = dynamic(() => import("@/components/games/Game2048"), {
  ssr: false,
});

export default function Home() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  // User must explicitly click "Sign in" button - no auto sign in
  // This ensures explicit user consent before authentication
  const { signIn, isLoading, isSignedIn } = useSignIn({
    autoSignIn: false, // Require explicit user consent
  });

  // Initialize MiniKit frame
  useEffect(() => {
    if (!isFrameReady && setFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Show game only if user has explicitly signed in
  // User must click "Sign in with Farcaster" button to authenticate
  if (isSignedIn) {
    return <Game2048 />;
  }

  return (
    <div className="bg-[#eef0f3] flex min-h-screen flex-col items-center px-4 pb-4">
      <div className="text-center space-y-8 max-w-md mt-[150px]">
        <h1 className="text-5xl font-bold text-gray-800"> 2048 Onchain</h1>


        {/* Farcaster Sign In - User must explicitly click to authenticate */}
        {context ? (
          <div className="space-y-2">
            <button
              onClick={signIn}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-[#0000ff] text-white font-semibold rounded-lg shadow-md hover:bg-[#0000cc] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? "Signing in..." : "Sign in with Farcaster"}
            </button>
            <p className="text-sm text-gray-500 text-center">
              Sign in to save your score and play the game!
            </p>
          </div>
        ) : (
          <p className="text-base text-gray-500">
            Please open this app in Base App or Warpcast to play
          </p>
        )}
      </div>
    </div>
  );
}
