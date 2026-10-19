import { backendApiUrl } from "./backend-url";

export function getApiRewrites() {
  return [
    {
      source: "/api/:path*",
      destination: `${backendApiUrl}/api/:path*`,
    },
  ];
}
