import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useShoppingBagStore } from '../stores/useShoppingBagStore';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetailsPage = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
    const { addToShoppingBag } = useShoppingBagStore();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/api/products/${productId}`);
                setProduct(response.data);
            } catch (error) {
                setError('Failed to load product details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleWishlistToggle = async () => {
        try {
            if (isInWishlist(productId)) {
                await removeFromWishlist(productId);
                toast.success('Removed from wishlist');
            } else {
                await addToWishlist(productId);
                toast.success('Added to wishlist');
            }
        } catch (error) {
            toast.error('Failed to update wishlist');
        }
    };

    const handleAddToBag = async () => {
        try {
            await addToShoppingBag(productId);
            toast.success('Added to shopping bag');
        } catch (error) {
            toast.error('Failed to add to shopping bag');
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-red-500 text-center mt-4">{error}</div>;
    if (!product) return <div className="text-center mt-4">Product not found</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-[1000px] object-cover rounded-lg"
                    />
                    <button
                        onClick={handleWishlistToggle}
                        className={`absolute top-4 right-4 p-2 rounded-full ${
                            isInWishlist(productId)
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-600'
                        } hover:opacity-80`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill={isInWishlist(productId) ? 'currentColor' : 'none'}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    <p className="text-2xl font-semibold text-gray-800">${product.price}</p>
                    <p className="text-gray-600">{product.description}</p>
                    
                    {/* Product Features */}
                    {product.features && (
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Features</h2>
                            <ul className="list-disc list-inside space-y-1">
                                {product.features.map((feature, index) => (
                                    <li key={index} className="text-gray-600">{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Add to Bag Button */}
                    <button
                        onClick={handleAddToBag}
                        className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add to Shopping Bag
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsPage; 