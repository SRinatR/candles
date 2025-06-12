"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import React, { useCallback } from "react";
import type { Locale } from '@/lib/i1n-config';

const sortOptions = [
  { value: "relevance", label: "Relevance" }, // TODO: Localize labels
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest Arrivals" },
];

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = routeParams.locale as Locale || 'uz';
  const currentSort = searchParams.get("sort") || "relevance";

  const handleSortChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "relevance") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      router.push(`/${locale}/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, locale]
  );

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">Sort by:</span> {/* TODO: Localize */}
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Sort by" /> {/* TODO: Localize */}
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label} {/* TODO: Localize */}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}