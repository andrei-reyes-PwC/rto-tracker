import { backendApiUrl } from "./backend-url";

const aiServiceUrl = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8010").replace(/\/$/, "");

export function getApiRewrites() {
  return [
    {
      source: "/api/assistant/chat",
      destination: `${aiServiceUrl}/api/assistant/chat`,
    },
    {
      source: "/api/:path*",
      destination: `${backendApiUrl}/api/:path*`,
    },
  ];
}
