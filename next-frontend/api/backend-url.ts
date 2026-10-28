export const backendApiUrl = (process.env.BACKEND_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
