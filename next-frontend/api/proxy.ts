const backendApiUrl = (process.env.BACKEND_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export function getApiRewrites() {
  return [
    {
      source: "/api/:path*",
      destination: `${backendApiUrl}/api/:path*`,
    },
  ];
}
