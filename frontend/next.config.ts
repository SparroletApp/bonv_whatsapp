
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        agentFeedback: true,
    },

    // Disable Cache Components and instant navigation validation
    cacheComponents: false,

    turbopack: {
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
