import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    // REQUIRED: Authentication
    NEYNAR_API_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    // OPTIONAL: Redis for notifications (app still works without)
    REDIS_URL: z.string().min(1).optional(),
    REDIS_TOKEN: z.string().min(1).optional(),
  },
  client: {
    // REQUIRED: App URL
    NEXT_PUBLIC_URL: z.string().min(1),
    // REQUIRED: MiniKit Project ID
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: z.string().min(1),
    // OPTIONAL: OnchainKit API Key (for wallet modal, optional but recommended)
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string().min(1).optional(),
    // OPTIONAL: Environment (defaults to development)
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
    // OPTIONAL: Farcaster Account Association (only needed when publishing)
    NEXT_PUBLIC_FARCASTER_HEADER: z.string().min(1).optional(),
    NEXT_PUBLIC_FARCASTER_PAYLOAD: z.string().min(1).optional(),
    NEXT_PUBLIC_FARCASTER_SIGNATURE: z.string().min(1).optional(),
    // REQUIRED: Supabase configuration
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: process.env.NEXT_PUBLIC_MINIKIT_PROJECT_ID,
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    NEXT_PUBLIC_FARCASTER_HEADER: process.env.NEXT_PUBLIC_FARCASTER_HEADER,
    NEXT_PUBLIC_FARCASTER_PAYLOAD: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
    NEXT_PUBLIC_FARCASTER_SIGNATURE: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});
