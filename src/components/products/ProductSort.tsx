
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

interface ProductSortProps {
  dictionary: {
    sortByLabel: string;
    sortPlaceholder: string;
    relevanceOption: string;
    priceAscOption: string;
    priceDescOption: string;
    nameAscOption: string;
    nameDescOption: string;
    newestOption: string;
  }
}

export function ProductSort({ dictionary }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = routeParams.locale as Locale || 'uz';
  const currentSort = searchParams.get("sort") || "relevance";

  const sortOptions = [
    { value: "relevance", label: dictionary.relevanceOption },
    { value: "price-asc", label: dictionary.priceAscOption },
    { value: "price-desc", label: dictionary.priceDescOption },
    { value: "name-asc", label: dictionary.nameAscOption },
    { value: "name-desc", label: dictionary.nameDescOption },
    { value: "newest", label: dictionary.newestOption },
  ];

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
      <span className="text-sm text-muted-foreground">{dictionary.sortByLabel}</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder={dictionary.sortPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
