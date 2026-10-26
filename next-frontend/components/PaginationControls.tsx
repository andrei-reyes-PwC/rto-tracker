"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  disabled?: boolean;
  className?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function PaginationControls({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  disabled = false,
  className,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  return (
    <div className={cn("flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p className="text-sm text-muted-foreground">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))} disabled={disabled}>
            <SelectTrigger className="w-[84px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
            <SelectContent align="end">{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={disabled || page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}><ChevronLeft />Previous</Button>
        <Button variant="outline" size="sm" disabled={disabled || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Next<ChevronRight /></Button>
      </div>
    </div>
  );
}
