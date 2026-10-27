import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f7f6f4] px-6 py-16 text-[#252525]">
      <div aria-hidden="true" className="absolute -right-20 -top-24 size-80 rounded-full bg-[#ffb600]/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 -left-16 size-80 rounded-full bg-[#e0301e]/15 blur-3xl" />

      <section className="relative w-full max-w-xl rounded-3xl border border-black/5 bg-white/90 p-8 shadow-xl shadow-black/5 sm:p-12">
        <div className="mb-12 inline-flex items-center gap-2" aria-label="PwC">
          <span className="flex h-9 w-9 items-end justify-center overflow-hidden rounded-md bg-[#e65300] pb-1 text-[10px] font-bold tracking-tight text-white">PwC</span>
          <span className="text-sm font-semibold tracking-tight">RTO Planner</span>
        </div>

        <p className="text-sm font-semibold tracking-[0.2em] text-[#e65300] uppercase">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">This page took a wrong turn.</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-[#666]">
          We couldn’t find the page you were looking for. Head back to the planner and pick up where you left off.
        </p>

        <Button asChild size="lg" className="mt-8 bg-[#e65300] text-white hover:bg-[#c94700]">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </Button>

        <div aria-hidden="true" className="mt-12 flex h-2 overflow-hidden rounded-full">
          <span className="w-1/2 bg-[#e65300]" />
          <span className="w-1/4 bg-[#ffb600]" />
          <span className="w-1/4 bg-[#464646]" />
        </div>
      </section>
    </main>
  );
}
