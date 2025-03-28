# E-Commerce Application

A modern e-commerce platform built with React and Node.js, featuring a responsive design and comprehensive shopping experience.

## Features

- **Product Management**
  - Browse products by category
  - Search functionality
  - Size selection for clothing items
  - Featured products showcase

- **Shopping Bag**
  - Add/remove items
  - Size selection
  - Quantity management
  - Persistent shopping bag across sessions

- **Order Management**
  - Order summary with size details
  - Multiple shipping options
  - Address management
  - Secure checkout process

- **Admin Dashboard**
  - Product management
  - Size inventory control
  - Featured product toggle
  - Order tracking

## Technology Stack

- **Frontend**
  - React
  - Zustand for state management
  - Tailwind CSS for styling
  - Framer Motion for animations

- **Backend**
  - Node.js
  - Express
  - MongoDB
  - Redis for caching

## Getting Started

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MongoDB
   - Redis

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies for backend
   cd server
   npm install

   # Install dependencies for frontend
   cd client
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Running the Application**
   ```bash
   # Start the backend server
   cd server
   npm run dev

   # Start the frontend application
   cd client
   npm start
   ```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create a new product (admin)
- `PATCH /api/products/:id` - Update product (admin)

### Shopping Bag
- `GET /api/shoppingBag` - Get user's shopping bag
- `POST /api/shoppingBag` - Add item to shopping bag
- `PUT /api/shoppingBag/:id` - Update item quantity
- `DELETE /api/shoppingBag` - Remove item from shopping bag

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Stripe for payment processing
- Cloudinary for image hosting
- React Hot Toast for notifications 