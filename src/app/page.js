'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryBar from '@/components/home/CategoryBar';
import PromoBanner from '@/components/home/PromoBanner';
import BankOffer from '@/components/home/BankOffer';
import DealsSection from '@/components/home/DealsSection';
import TrendingSection from '@/components/home/TrendingSection';

export default function HomePage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams ? searchParams.get('search') || '' : '';
  const initialCategory = searchParams ? searchParams.get('category') || null : null;
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  return (
    <>
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      {!searchQuery && (
        <>
          <PromoBanner />
          <BankOffer />
        </>
      )}
      <DealsSection filterCategory={selectedCategory} searchQuery={searchQuery} />
      <TrendingSection filterCategory={selectedCategory} searchQuery={searchQuery} />
    </>
  );
}

