import React, { useEffect } from 'react';
import { useWishlistStore } from '../stores/useWishlistStore';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageLoader } from '../components/SkeletonLoader';

const WishlistPage = () => {
    const { wishlistItems, isLoading, error, getWishlistItems, removeFromWishlist } = useWishlistStore();

    useEffect(() => {
        getWishlistItems();
    }, [getWishlistItems]);

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await removeFromWishlist(productId);
            toast.success('Item removed from wishlist');
        } catch (error) {
            toast.error('Failed to remove item from wishlist');
        }
    };

    if (isLoading) return <PageLoader />;
    if (error) return <div className="text-red-500 text-center mt-4">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

            {wishlistItems.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link to="/" className="text-blue-600 hover:text-blue-800">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                        <div key={item.productId} className="border rounded-lg p-4 shadow-sm">
                            <div className="relative">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-48 object-cover rounded-md"
                                />
                                <button
                                    onClick={() => handleRemoveFromWishlist(item.productId)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <h3 className="text-lg font-semibold mt-2">{item.name}</h3>
                            <p className="text-gray-600">${item.price}</p>
                            <Link
                                to={`/product/${item.productId}`}
                                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                            >
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
