
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale } from '@/lib/i1n-config';
import type { Category, Product } from '@/lib/types';

interface ProductFiltersProps {
  dictionary: {
    filtersTitle: string;
    clearAllButton: string;
    categoryTitle: string;
    priceRangeTitle: string;
    scentTitle: string;
    materialTitle: string;
    applyFiltersButton?: string; 
  };
  categoriesData: Category[];
  allProducts: Product[]; // Should be pre-filtered for active status by the parent
  onApplyFilters?: () => void; 
}

const PRICE_DIVISOR = 1; 

export function ProductFilters({ dictionary, categoriesData, allProducts, onApplyFilters }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = routeParams.locale as Locale || 'uz';

  const { minProductPrice, maxProductPrice } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { minProductPrice: 0, maxProductPrice: 500000 }; 
    }
    const prices = allProducts.map(p => p.price / PRICE_DIVISOR);
    return {
      minProductPrice: Math.floor(Math.min(...prices) || 0),
      maxProductPrice: Math.ceil(Math.max(...prices) || 500000),
    };
  }, [allProducts]);

  const getInitialState = useCallback(() => {
    const searchMin = Number(searchParams.get('minPrice'));
    const searchMax = Number(searchParams.get('maxPrice'));
    
    let currentMin = minProductPrice;
    if (!isNaN(searchMin) && searchMin >= minProductPrice && searchMin <= maxProductPrice) {
        currentMin = searchMin;
    }

    let currentMax = maxProductPrice;
    if (!isNaN(searchMax) && searchMax <= maxProductPrice && searchMax >= minProductPrice) {
        currentMax = searchMax;
    }
    // Ensure min is not greater than max after reading from params
    if (currentMin > currentMax) {
        currentMin = currentMax; 
    }
    
    return {
      selectedCategories: searchParams.getAll('category') || [],
      selectedScents: searchParams.getAll('scent') || [],
      selectedMaterials: searchParams.getAll('material') || [],
      priceRange: [currentMin, currentMax] as [number, number],
      minPriceInput: String(currentMin),
      maxPriceInput: String(currentMax),
    };
  }, [searchParams, minProductPrice, maxProductPrice]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(getInitialState().selectedCategories);
  const [selectedScents, setSelectedScents] = useState<string[]>(getInitialState().selectedScents);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(getInitialState().selectedMaterials);
  const [priceRange, setPriceRange] = useState<[number, number]>(getInitialState().priceRange);
  const [minPriceInput, setMinPriceInput] = useState(getInitialState().minPriceInput);
  const [maxPriceInput, setMaxPriceInput] = useState(getInitialState().maxPriceInput);
  
  useEffect(() => {
    const initialState = getInitialState();
    setSelectedCategories(initialState.selectedCategories);
    setSelectedScents(initialState.selectedScents);
    setSelectedMaterials(initialState.selectedMaterials);
    setPriceRange(initialState.priceRange);
    setMinPriceInput(initialState.minPriceInput);
    setMaxPriceInput(initialState.maxPriceInput);
  }, [searchParams, getInitialState]);


  const uniqueScents = useMemo(() => {
    if (!allProducts) return [];
    const scents = allProducts
      .map(p => p.scent)
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '');
    return Array.from(new Set(scents)).sort();
  }, [allProducts]);

  const uniqueMaterials = useMemo(() => {
    if (!allProducts) return [];
    const materials = allProducts
      .map(p => p.material)
      .filter((m): m is string => typeof m === 'string' && m.trim() !== '');
    return Array.from(new Set(materials)).sort();
  }, [allProducts]);

  const applyFiltersToURL = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.delete('category');
    selectedCategories.forEach(cat => params.append('category', cat));

    params.delete('scent');
    selectedScents.forEach(scent => params.append('scent', scent));
    
    params.delete('material');
    selectedMaterials.forEach(mat => params.append('material', mat));

    if (priceRange[0] > minProductPrice) {
      params.set('minPrice', String(priceRange[0]));
    } else {
      params.delete('minPrice');
    }
    if (priceRange[1] < maxProductPrice) {
      params.set('maxPrice', String(priceRange[1]));
    } else {
      params.delete('maxPrice');
    }
    
    router.push(`/${locale}/products?${params.toString()}`, { scroll: false });
    if(onApplyFilters) {
        onApplyFilters(); 
    }
  }, [selectedCategories, selectedScents, selectedMaterials, priceRange, searchParams, router, locale, onApplyFilters, minProductPrice, maxProductPrice]);

  useEffect(() => {
    if (!onApplyFilters) { 
      const timeoutId = setTimeout(applyFiltersToURL, 500); 
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCategories, selectedScents, selectedMaterials, priceRange, onApplyFilters, applyFiltersToURL]);


  const handleCheckboxChange = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newList = list.includes(value)
      ? list.filter(item => item !== value)
      : [...list, value];
    setter(newList);
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value, 10);
    if (type === 'min') {
      setMinPriceInput(value); // Update input visually immediately
      if (!isNaN(numValue)) {
        const newMin = Math.max(minProductPrice, Math.min(numValue, priceRange[1]));
        setPriceRange([newMin, priceRange[1]]);
      }
    } else {
      setMaxPriceInput(value); // Update input visually immediately
      if (!isNaN(numValue)) {
        const newMax = Math.min(maxProductPrice, Math.max(numValue, priceRange[0]));
        setPriceRange([priceRange[0], newMax]);
      }
    }
  };
  
  const handlePriceInputCommit = (type: 'min' | 'max') => {
    let numValue = parseInt(type === 'min' ? minPriceInput : maxPriceInput, 10);
    
    if (type === 'min') {
      if (isNaN(numValue) || numValue < minProductPrice || numValue > priceRange[1]) numValue = minProductPrice;
      const newMin = Math.max(minProductPrice, Math.min(numValue, priceRange[1]));
      setPriceRange(prev => [newMin, prev[1]]);
      setMinPriceInput(String(newMin));
    } else {
      if (isNaN(numValue) || numValue > maxProductPrice || numValue < priceRange[0]) numValue = maxProductPrice;
      const newMax = Math.min(maxProductPrice, Math.max(numValue, priceRange[0]));
      setPriceRange(prev => [prev[0], newMax]);
      setMaxPriceInput(String(newMax));
    }
    // Filter application is handled by useEffect or explicit button for mobile
  };
  

  const handleSliderCommit = (newRange: [number, number]) => {
    setPriceRange(newRange);
    setMinPriceInput(String(newRange[0]));
    setMaxPriceInput(String(newRange[1]));
  };
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedScents([]);
    setSelectedMaterials([]);
    setPriceRange([minProductPrice, maxProductPrice]);
    setMinPriceInput(String(minProductPrice));
    setMaxPriceInput(String(maxProductPrice));
    
    const params = new URLSearchParams(searchParams.toString());
    ['category', 'scent', 'material', 'minPrice', 'maxPrice'].forEach(p => params.delete(p));
    router.push(`/${locale}/products?${params.toString()}`, { scroll: false });

     if(onApplyFilters) { 
        onApplyFilters();
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedScents.length > 0 || selectedMaterials.length > 0 || priceRange[0] > minProductPrice || priceRange[1] < maxProductPrice;

  return (
    <aside className="w-full space-y-4 p-4 lg:border lg:border-border/60 lg:rounded-lg lg:shadow-sm lg:bg-card">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{dictionary.filtersTitle}</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="mr-1 h-3 w-3" /> {dictionary.clearAllButton}
          </Button>
        )}
      </div>
      <Accordion type="multiple" defaultValue={['category', 'price', 'scent', 'material']} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="text-base py-3">{dictionary.categoryTitle}</AccordionTrigger>
          <AccordionContent className="space-y-2 pt-2">
            {categoriesData.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category.slug}-${onApplyFilters ? 'mobile' : 'desktop'}`}
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={() => handleCheckboxChange(category.slug, selectedCategories, setSelectedCategories)}
                />
                <Label htmlFor={`cat-${category.slug}-${onApplyFilters ? 'mobile' : 'desktop'}`} className="font-normal text-sm">{category.name}</Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-base py-3">{dictionary.priceRangeTitle}</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-3">
            <Slider
              value={priceRange}
              min={minProductPrice} 
              max={maxProductPrice} 
              step={Math.max(1000, Math.floor((maxProductPrice - minProductPrice) / 100))} 
              onValueChange={handleSliderCommit} // Use onValueChange for smoother slider updates if preferred, or keep onValueCommit
              className="my-2"
            />
            <div className="flex justify-between items-center space-x-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">UZS</span>
                <Input 
                  type="text"
                  value={minPriceInput}
                  onChange={(e) => handlePriceInputChange('min', e.target.value)}
                  onBlur={() => handlePriceInputCommit('min')}
                  className="w-full pl-12 h-9 text-sm" 
                />
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">UZS</span>
                <Input 
                  type="text" 
                  value={maxPriceInput}
                  onChange={(e) => handlePriceInputChange('max', e.target.value)}
                  onBlur={() => handlePriceInputCommit('max')}
                  className="w-full pl-12 h-9 text-sm" 
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {uniqueScents.length > 0 && (
          <AccordionItem value="scent">
            <AccordionTrigger className="text-base py-3">{dictionary.scentTitle}</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {uniqueScents.map(scent => (
                <div key={scent} className="flex items-center space-x-2">
                  <Checkbox
                    id={`scent-${scent.toLowerCase().replace(/\s+/g, '-')}-${onApplyFilters ? 'mobile' : 'desktop'}`}
                    checked={selectedScents.includes(scent)}
                    onCheckedChange={() => handleCheckboxChange(scent, selectedScents, setSelectedScents)}
                  />
                  <Label htmlFor={`scent-${scent.toLowerCase().replace(/\s+/g, '-')}-${onApplyFilters ? 'mobile' : 'desktop'}`} className="font-normal text-sm">{scent}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
        
        {uniqueMaterials.length > 0 && (
          <AccordionItem value="material">
            <AccordionTrigger className="text-base py-3">{dictionary.materialTitle}</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {uniqueMaterials.map(material => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={`material-${material.toLowerCase().replace(/\s+/g, '-')}-${onApplyFilters ? 'mobile' : 'desktop'}`}
                    checked={selectedMaterials.includes(material)}
                    onCheckedChange={() => handleCheckboxChange(material, selectedMaterials, setSelectedMaterials)}
                  />
                  <Label htmlFor={`material-${material.toLowerCase().replace(/\s+/g, '-')}-${onApplyFilters ? 'mobile' : 'desktop'}`} className="font-normal text-sm">{material}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      {onApplyFilters && (
        <Button onClick={applyFiltersToURL} className="w-full mt-4">
          {dictionary.applyFiltersButton || "Show Results"}
        </Button>
      )}
    </aside>
  );
}
