import Wishlist from '../models/wishlist.model.js';

export const getWishlistItems = async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({ userId: req.user.id })
            .populate('productId', 'name price image');

        res.json(wishlistItems.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.image
        })));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const wishlistItem = new Wishlist({
            userId: req.user.id,
            productId
        });
        await wishlistItem.save();

        const populatedItem = await Wishlist.findById(wishlistItem._id)
            .populate('productId', 'name price image');

        res.status(201).json({
            productId: populatedItem.productId._id,
            name: populatedItem.productId.name,
            price: populatedItem.productId.price,
            image: populatedItem.productId.image
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Item already in wishlist' });
        } else {
            res.status(500).json({ message: 'Server error' });
        }
    }
}

export const removeFromWishlist = async (req, res) => {
    try {
        const wishlistItem = await Wishlist.findOneAndDelete({
            userId: req.user.id,
            productId: req.params.productId
        });

        if (!wishlistItem) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }

        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}