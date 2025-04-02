import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const SortSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';
  const currentQuery = searchParams.get('q') || '';
  const isCategoryPage = location.pathname.startsWith('/category/');
  const category = isCategoryPage ? location.pathname.split('/').pop() : '';

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    
    if (isCategoryPage) {
      // For category pages, preserve the category in the URL
      navigate(`/category/${category}?sort=${newSort}`);
    } else {
      // For search pages, preserve the search query
      navigate(`/search?q=${currentQuery}&sort=${newSort}`);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 sm:text-sm"
      >
        <option value="newest">Newest First</option>
        <option value="featured">Featured</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
    </div>
  );
};

export default SortSelect; 