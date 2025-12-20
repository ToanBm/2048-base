"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Identity, Avatar, Name } from "@coinbase/onchainkit/identity";
import { useTheme } from "@/hooks/use-theme";

export default function Header() {
    const { context } = useMiniKit();
    const { address } = useAccount();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="mb-8 text-center relative w-full">
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="absolute top-0 right-0 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
            >
                {theme === "dark" ? (
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                    </svg>
                )}
            </button>

            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 pt-8">2048 Onchain</h1>

            <div className="flex items-center justify-center gap-2 mb-4 min-h-[40px]">
                {context?.user?.displayName ? (
                    /* Farcaster User Display */
                    <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
                        <span>Welcome,</span>
                        {context.user?.pfpUrl && (
                            <img
                                src={context.user.pfpUrl}
                                alt={context.user.displayName || "User"}
                                className="w-6 h-6 rounded-full border border-gray-300"
                            />
                        )}
                        <span className="font-semibold">{context.user.displayName}!</span>
                    </div>
                ) : (
                    /* Wallet Display (Base App) */
                    <div className="flex justify-center items-center">
                        {address ? (
                            <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
                                <Identity
                                    address={address}
                                    className="flex items-center gap-2"
                                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9" // Optional: standard schema
                                >
                                    <Avatar className="w-6 h-6 rounded-full border border-gray-300" />
                                    <Name className="font-semibold text-gray-600 dark:text-gray-400" />
                                </Identity>
                            </div>
                        ) : (
                            <Wallet>
                                <ConnectWallet className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm">
                                    Connect Wallet
                                </ConnectWallet>
                            </Wallet>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
