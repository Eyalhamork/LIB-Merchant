// components/products/category-filter.tsx

'use client';

import { useCategories } from '@/hooks/use-products';
import Select from '@/components/ui/select';

interface CategoryFilterProps {
  shopId: string;
  value: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ shopId, value, onChange }: CategoryFilterProps) {
  const { categories, isLoading } = useCategories(shopId);

  if (isLoading) {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)} disabled>
        <option value="">Loading...</option>
      </Select>
    );
  }

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All Categories</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </Select>
  );
}
