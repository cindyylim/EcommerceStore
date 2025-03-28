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

## Main page
<img width="1440" src="https://github.com/user-attachments/assets/bad69387-b2c8-40b6-b366-9ef0226559b3" />

## Featured products list
<img width="1357" alt="Screenshot 2025-03-28 at 10 41 56 AM" src="https://github.com/user-attachments/assets/db886cfd-de26-4693-bc58-ad9b8cea7a17" />

## Wishlist page
<img width="1429" alt="Screenshot 2025-03-28 at 10 42 18 AM" src="https://github.com/user-attachments/assets/ae71abe1-f51f-40ab-85c8-36830e87aca2" />

## Category page
<img width="1440" alt="Screenshot 2025-03-28 at 10 43 17 AM" src="https://github.com/user-attachments/assets/2c9f8419-8719-456d-94a8-b7f01ebd3141" />

## Product details page
<img width="1440" alt="Screenshot 2025-03-28 at 10 43 24 AM" src="https://github.com/user-attachments/assets/b50a0165-5f56-4543-bbcb-712d5d1e68e9" />

## Order checkout page
<img width="1440" alt="Screenshot 2025-03-28 at 10 42 25 AM" src="https://github.com/user-attachments/assets/24cb0577-bb4c-4a00-8374-2438eee09bf9" />

## Admin dashboard

<img width="1440" alt="Screenshot 2025-03-28 at 10 42 44 AM" src="https://github.com/user-attachments/assets/da6c1a27-9642-41df-ac50-052cc0832107" />

<img width="1425" alt="Screenshot 2025-03-28 at 10 42 50 AM" src="https://github.com/user-attachments/assets/72a96329-da29-4f30-917c-df542940d72c" />

<img width="1436" alt="Screenshot 2025-03-28 at 10 42 56 AM" src="https://github.com/user-attachments/assets/aedc8a7a-c133-4d3a-bbf1-8c55ba2f7636" />


  
