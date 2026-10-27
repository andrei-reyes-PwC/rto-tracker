import OfficePlanner from "./component/OfficePlanner";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "My Schedule | RTO Planner" } };

export default function Home() {
  return <OfficePlanner />;
}
