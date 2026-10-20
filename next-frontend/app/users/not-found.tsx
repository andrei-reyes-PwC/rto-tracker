import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UsersNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-[0.16em] text-[#b83b00] uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you are looking for could not be found.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return to planner</Link>
      </Button>
    </main>
  );
}
