import OfficePlanner, { OfficePlannerLoading } from "./component/OfficePlanner";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "My Schedule | RTO Planner" } };

export default function Home() {
  return <Suspense fallback={<OfficePlannerLoading />}><OfficePlanner /></Suspense>;
}
