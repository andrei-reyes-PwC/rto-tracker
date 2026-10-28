"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/** Shared debounced search state for CRUD lists backed by server-side queries. */
export function useCrudSearch() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  return { search, setSearch, debouncedSearch };
}
