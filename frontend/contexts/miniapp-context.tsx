"use client";

import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

interface MiniAppContextType {
  isFrameReady: boolean;
  setFrameReady: () => void;
  addFrame: () => Promise<{ url: string; token: string } | null>;
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

export function MiniAppProvider({ children }: { children: ReactNode }) {
  // useMiniKit hook - will throw if OnchainKitProvider with miniKit enabled is not available
  // This is expected behavior - the error indicates the provider setup issue
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();

  const handleAddFrame = useCallback(async () => {
    try {
      // Check if addFrame is available
      if (!addFrame) {
        console.warn("addFrame is not available");
        return null;
      }
      
      const result = await addFrame();
      if (result && result.url && result.token) {
        return result;
      }
      return null;
    } catch (error) {
      console.error("[error] adding frame", error);
      // Silently fail - feature may not be available yet
      return null;
    }
  }, [addFrame]);

  useEffect(() => {
    // on load, set the frame as ready
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Disable auto-add frame for now (feature not available in Base App yet)
  // Users can manually add frame if needed
  // useEffect(() => {
  //   // when the frame is ready, if the frame is not added, prompt the user to add the frame
  //   if (isFrameReady && !context?.client?.added) {
  //     handleAddFrame();
  //   }
  // }, [context?.client?.added, handleAddFrame, isFrameReady]);

  return (
    <MiniAppContext.Provider
      value={{
        isFrameReady,
        setFrameReady,
        addFrame: handleAddFrame,
      }}
    >
      {children}
    </MiniAppContext.Provider>
  );
}

export function useMiniApp() {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}
