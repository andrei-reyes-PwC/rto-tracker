"use client";

import dynamic from "next/dynamic";

const OfficePlanner = dynamic(() => import("@/components/office-planner"), { ssr: false });

export default function OfficePlannerShell() {
  return <OfficePlanner />;
}
