import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Coupon from '../models/coupon.model.js';
import Wishlist from '../models/wishlist.model.js';

/**
 * Create comprehensive database indexes for all collections
 * Optimizes queries for faster performance
 */

// =========================
// PRODUCT INDEXES
// =========================
export const createProductIndexes = async () => {
    try {
        const db = Product.collection;

        // Compound index for sized product stock queries
        // Optimizes: { _id: x, 'sizes.size': 'M', 'sizes.quantity': { $gte: 1 }}
        await db.createIndex({
            _id: 1,
            'sizes.size': 1,
            'sizes.quantity': 1
        }, { name: 'product_sized_stock' });

        // Index for non-sized product stock queries
        await db.createIndex({
            _id: 1,
            quantity: 1
        }, { name: 'product_nonsized_stock' });

        // Index for category browsing
        await db.createIndex({
            category: 1
        }, { name: 'product_category' });

        // Index for featured products
        await db.createIndex({
            isFeatured: 1
        }, { name: 'product_featured' });

        // Compound index for category + featured filtering
        await db.createIndex({
            category: 1,
            isFeatured: 1
        }, { name: 'product_category_featured' });

        // Text search index for product name and description
        await db.createIndex({
            name: 'text',
            description: 'text'
        }, { name: 'product_text_search' });

        console.log('✓ Product indexes created');
    } catch (error) {
        console.error('Error creating product indexes:', error.message);
    }
};

// =========================
// USER INDEXES
// =========================
export const createUserIndexes = async () => {
    try {
        const db = User.collection;

        // Email is already unique, but add index for faster lookups
        await db.createIndex({
            email: 1
        }, { name: 'user_email', unique: true });

        // Index for role-based queries (e.g., find all admins)
        await db.createIndex({
            role: 1
        }, { name: 'user_role' });

        // Index for shopping bag product lookups
        await db.createIndex({
            'ShoppingBagItems.product': 1
        }, { name: 'user_cart_products' });

        // Compound index for createdAt (useful for analytics)
        await db.createIndex({
            createdAt: -1
        }, { name: 'user_created_desc' });

        console.log('✓ User indexes created');
    } catch (error) {
        console.error('Error creating user indexes:', error.message);
    }
};

// =========================
// ORDER INDEXES
// =========================
export const createOrderIndexes = async () => {
    try {
        const db = Order.collection;

        // Index for user's order history
        await db.createIndex({
            user: 1
        }, { name: 'order_user' });

        // Compound index for user orders sorted by date
        await db.createIndex({
            user: 1,
            createdAt: -1
        }, { name: 'order_user_date' });

        // Index for Stripe session lookups
        await db.createIndex({
            stripeSessionId: 1
        }, { name: 'order_stripe_session', unique: true, sparse: true });

        // Index for product analytics (which products are ordered)
        await db.createIndex({
            'products.id': 1
        }, { name: 'order_products' });

        // Index for recent orders
        await db.createIndex({
            createdAt: -1
        }, { name: 'order_created_desc' });

        // Index for total amount queries (analytics)
        await db.createIndex({
            totalAmount: 1
        }, { name: 'order_total_amount' });

        // Index for order email lookups
        await db.createIndex({
            email: 1
        }, { name: 'order_email' });

        console.log('✓ Order indexes created');
    } catch (error) {
        console.error('Error creating order indexes:', error.message);
    }
};

// =========================
// COUPON INDEXES
// =========================
export const createCouponIndexes = async () => {
    try {
        const db = Coupon.collection;

        // Index for coupon code lookups (already unique)
        await db.createIndex({
            code: 1
        }, { name: 'coupon_code', unique: true });

        // Index for user's coupon
        await db.createIndex({
            userId: 1
        }, { name: 'coupon_user', unique: true });

        // Compound index for active coupons per user
        await db.createIndex({
            userId: 1,
            isActive: 1
        }, { name: 'coupon_user_active' });

        // Index for expiration cleanup queries
        await db.createIndex({
            expirationDate: 1
        }, { name: 'coupon_expiration' });

        // Compound index for finding valid coupons
        await db.createIndex({
            userId: 1,
            isActive: 1,
            expirationDate: 1
        }, { name: 'coupon_valid_lookup' });

        console.log('✓ Coupon indexes created');
    } catch (error) {
        console.error('Error creating coupon indexes:', error.message);
    }
};

// =========================
// WISHLIST INDEXES
// =========================
export const createWishlistIndexes = async () => {
    try {
        const db = Wishlist.collection;

        // Compound unique index for user-product combinations
        // (Already defined in schema, but ensuring it exists)
        await db.createIndex({
            userId: 1,
            productId: 1
        }, { name: 'wishlist_user_product', unique: true });

        // Index for user's wishlist
        await db.createIndex({
            userId: 1
        }, { name: 'wishlist_user' });

        // Index for product popularity (how many wishlisted)
        await db.createIndex({
            productId: 1
        }, { name: 'wishlist_product' });

        // Index for recent wishlist additions
        await db.createIndex({
            createdAt: -1
        }, { name: 'wishlist_created_desc' });

        console.log('✓ Wishlist indexes created');
    } catch (error) {
        console.error('Error creating wishlist indexes:', error.message);
    }
};

// =========================
// CREATE ALL INDEXES
// =========================
export const createAllIndexes = async () => {
    console.log('Creating database indexes...');

    try {
        await Promise.all([
            createProductIndexes(),
            createUserIndexes(),
            createOrderIndexes(),
            createCouponIndexes(),
            createWishlistIndexes()
        ]);

        console.log('✓ All database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error.message);
        // Don't throw - index creation failures shouldn't prevent app startup
    }
};
