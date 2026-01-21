import { connectDB, disconnectDB, clearDB } from "../setup.js";
import Product from "../../models/product.model.js";

describe("Product Model Tests", () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        await clearDB();
    });

    it("should create a non-sized product successfully", async () => {
        const productData = {
            name: "T-Shirt",
            description: "A cool t-shirt",
            price: 19.99,
            image: "image_url",
            category: "Apparel",
            quantity: 10,
            hasSizes: false
        };
        const product = await Product.create(productData);
        expect(product.name).toBe(productData.name);
        expect(product.inStock).toBe(true);
    });

    it("should create a sized product successfully", async () => {
        const productData = {
            name: "Jersey",
            description: "A cool jersey",
            price: 29.99,
            image: "image_url",
            category: "Apparel",
            hasSizes: true,
            sizes: [
                { size: "M", quantity: 5 },
                { size: "L", quantity: 0 }
            ]
        };
        const product = await Product.create(productData);
        expect(product.name).toBe(productData.name);
        expect(product.inStock).toBe(true); // Since M has quantity 5
    });

    it("should mark product as out of stock if quantity is 0", async () => {
        const product = await Product.create({
            name: "Out of Stock Item",
            description: "None left",
            price: 9.99,
            image: "image_url",
            category: "Misc",
            quantity: 0,
            hasSizes: false
        });
        expect(product.inStock).toBe(false);
    });

    it("should mark sized product as out of stock if all sizes have 0 quantity", async () => {
        const product = await Product.create({
            name: "Out of Stock Sized Item",
            description: "None left",
            price: 9.99,
            image: "image_url",
            category: "Misc",
            hasSizes: true,
            sizes: [
                { size: "S", quantity: 0 },
                { size: "XL", quantity: 0 }
            ]
        });
        expect(product.inStock).toBe(false);
    });

    it("should fail validation if required fields are missing", async () => {
        const product = new Product({});
        try {
            await product.save();
        } catch (error) {
            expect(error.errors.name).toBeDefined();
            expect(error.errors.price).toBeDefined();
            expect(error.errors.image).toBeDefined();
        }
    });

    it("should fail if price is negative", async () => {
        const product = new Product({
            name: "Negative Price",
            description: "D",
            price: -1,
            image: "url",
            category: "test"
        });
        try {
            await product.save();
        } catch (error) {
            expect(error.errors.price).toBeDefined();
        }
    });
});
