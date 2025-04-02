import React from 'react';

// Base Skeleton Component
const Skeleton = ({ 
  className = '', 
  variant = 'default', 
  width, 
  height, 
  circle = false,
  lines = 1,
  animate = true 
}) => {
  const baseClasses = 'skeleton';
  const variantClasses = {
    default: 'rounded',
    rounded: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
    title: 'rounded h-6 w-3/4',
    paragraph: 'rounded h-3',
    image: 'rounded-lg aspect-square',
    button: 'rounded-lg h-10 w-24',
    card: 'rounded-xl',
    input: 'rounded-lg h-10',
    avatar: 'rounded-full w-10 h-10'
  };

  const combinedClasses = `
    ${baseClasses} 
    ${variantClasses[variant] || variantClasses.default}
    ${className}
    ${animate ? 'animate-pulse' : ''}
  `;

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} rounded h-3 ${className} ${animate ? 'animate-pulse' : ''}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%', // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={combinedClasses}
      style={style}
    />
  );
};

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-soft overflow-hidden animate-fade-in">
    {/* Image Skeleton */}
    <div className="aspect-square bg-gray-200 skeleton" />
    
    {/* Content Skeleton */}
    <div className="p-5 space-y-3">
      {/* Title */}
      <Skeleton variant="title" />
      
      {/* Price */}
      <Skeleton variant="text" width="60%" />
      
      {/* Size Indicators */}
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="circle" width="28px" height="28px" />
        ))}
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="text" width="14px" height="14px" />
        ))}
        <Skeleton variant="text" width="30px" height="14px" />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" width="40px" />
      </div>
    </div>
  </div>
);

// Shopping Bag Item Skeleton
export const ShoppingBagItemSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
      {/* Image Skeleton */}
      <div className="md:col-span-3">
        <div className="aspect-square rounded-lg bg-gray-200 skeleton" />
      </div>
      
      {/* Details Skeleton */}
      <div className="md:col-span-5 space-y-2">
        <Skeleton variant="title" />
        <Skeleton variant="paragraph" lines={2} />
        <div className="flex gap-3">
          <Skeleton variant="text" width="60px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton variant="button" />
          <Skeleton variant="button" width="80px" />
        </div>
      </div>
      
      {/* Quantity Skeleton */}
      <div className="md:col-span-2">
        <div className="flex flex-col items-center space-y-3">
          <Skeleton variant="text" width="60px" />
          <div className="flex gap-2">
            <Skeleton variant="circle" width="32px" height="32px" />
            <Skeleton variant="text" width="40px" />
            <Skeleton variant="circle" width="32px" height="32px" />
          </div>
          <Skeleton variant="button" width="60px" />
        </div>
      </div>
      
      {/* Total Skeleton */}
      <div className="md:col-span-2 text-right">
        <Skeleton variant="title" width="80px" />
        <Skeleton variant="text" width="60px" />
      </div>
    </div>
  </div>
);

// Category Page Skeleton
export const CategoryPageSkeleton = () => (
  <div className="min-h-screen">
    <div className="container-custom py-16">
      {/* Title Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <Skeleton variant="title" className="text-4xl sm:text-5xl" width="200px" height="40px" />
        <Skeleton variant="button" width="150px" />
      </div>
      
      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Product Details Page Skeleton
export const ProductDetailsSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image Section */}
      <div className="space-y-4">
        <div className="aspect-square rounded-lg bg-gray-200 skeleton" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded bg-gray-200 skeleton" />
          ))}
        </div>
      </div>
      
      {/* Details Section */}
      <div className="space-y-6">
        <Skeleton variant="title" className="text-3xl" />
        <Skeleton variant="text" className="text-2xl" width="120px" />
        <Skeleton variant="paragraph" lines={3} />
        
        {/* Size Selector */}
        <div className="space-y-4">
          <Skeleton variant="text" width="100px" />
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="circle" width="40px" height="40px" />
            ))}
          </div>
        </div>
        
        {/* Buttons */}
        <div className="space-y-3">
          <Skeleton variant="button" className="h-12" />
          <Skeleton variant="button" className="h-12" />
        </div>
      </div>
    </div>
  </div>
);

// Order Summary Skeleton
export const OrderSummarySkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
    <Skeleton variant="title" className="mb-6" />
    
    <div className="space-y-4 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="60px" />
        </div>
      ))}
    </div>
    
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton variant="text" width="80px" />
        <Skeleton variant="text" width="80px" />
      </div>
      <div className="flex justify-between">
        <Skeleton variant="text" width="100px" />
        <Skeleton variant="text" width="70px" />
      </div>
    </div>
    
    <Skeleton variant="button" className="w-full h-12 mt-6" />
  </div>
);

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} />
      {text && (
        <span className="text-sm text-gray-600 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

// Page Loader
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce-soft">
        <span className="text-white text-2xl font-bold">E</span>
      </div>
      <LoadingSpinner size="lg" text="Loading your experience..." />
    </div>
  </div>
);

// List Skeleton
export const ListSkeleton = ({ 
  items = 5, 
  showAvatar = false,
  showActions = false 
}) => (
  <div className="space-y-4">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg">
        {showAvatar && <Skeleton variant="avatar" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" width="150px" />
          <Skeleton variant="paragraph" lines={2} />
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Skeleton variant="button" width="60px" />
            <Skeleton variant="button" width="60px" />
          </div>
        )}
      </div>
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="overflow-hidden rounded-lg shadow">
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} height="20px" />
        ))}
      </div>
    </div>
    <div className="divide-y">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={colIndex} height="16px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Analytics Page Skeleton
export const AnalyticsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg p-6 shadow-lg bg-gray-50 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <Skeleton variant="text" width="120px" height="16px" />
            <Skeleton variant="circle" width="32px" height="32px" />
          </div>
          <Skeleton variant="text" width="80px" height="32px" />
          <div className="absolute -bottom-4 -right-4 text-indigo-800 opacity-50">
            <Skeleton variant="circle" width="128px" height="128px" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Chart Skeleton */}
    <div className="rounded-lg p-6 shadow-lg bg-gray-50 animate-fade-in">
      <div className="h-96 flex items-end justify-between space-x-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 space-y-2">
            <Skeleton variant="text" width="100%" height="12px" />
            <div className="flex space-x-2">
              <Skeleton variant="text" width="60%" height="8px" />
              <Skeleton variant="text" width="40%" height="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
