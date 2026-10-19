import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | RTO Planner",
  description: "Sign in to your RTO Planner account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
