/**
 * Prisma seed script — populates the database with sample data for development.
 *
 * Run with:  pnpm --filter @yet-a-ecommerce/shell db:seed
 *        or: cd apps/shell && npx prisma db seed
 */

import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // -----------------------------------------------------------------------
  // 1. Users
  // -----------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: passwordHash,
      phone: "+1-555-0101",
      address: "123 Main St, Springfield, IL 62701",
      role: "USER",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      password: passwordHash,
      phone: "+1-555-0102",
      address: "456 Oak Ave, Portland, OR 97201",
      role: "USER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  console.log(`  ✓ Created users: ${alice.email}, ${bob.email}, ${admin.email}`);

  // -----------------------------------------------------------------------
  // 2. Products
  // -----------------------------------------------------------------------
  const products = await Promise.all([
    // Electronics
    prisma.product.upsert({
      where: { id: "prod_electronics_001" },
      update: {},
      create: {
        id: "prod_electronics_001",
        name: "Wireless Noise-Cancelling Headphones",
        description:
          "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Bluetooth 5.2. Perfect for work and travel.",
        price: 299.99,
        images: ["https://placehold.co/600x400?text=Headphones"],
        category: "Electronics",
        stock: 45,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_electronics_002" },
      update: {},
      create: {
        id: "prod_electronics_002",
        name: "4K Ultra HD Smart Monitor — 27\"",
        description:
          "27-inch 4K IPS display with 144 Hz refresh rate, USB-C 90W charging, and HDR400 support. Built-in KVM switch for multi-device setups.",
        price: 549.0,
        images: ["https://placehold.co/600x400?text=Monitor"],
        category: "Electronics",
        stock: 18,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_electronics_003" },
      update: {},
      create: {
        id: "prod_electronics_003",
        name: "Mechanical Keyboard — TKL RGB",
        description:
          "Tenkeyless mechanical keyboard with Cherry MX Blue switches, per-key RGB lighting, and aircraft-grade aluminium frame.",
        price: 129.99,
        images: ["https://placehold.co/600x400?text=Keyboard"],
        category: "Electronics",
        stock: 72,
      },
    }),
    // Clothing
    prisma.product.upsert({
      where: { id: "prod_clothing_001" },
      update: {},
      create: {
        id: "prod_clothing_001",
        name: "Classic Fit Chino Trousers",
        description:
          "100% cotton chino trousers with a relaxed fit. Machine washable, available in multiple colours.",
        price: 49.99,
        images: ["https://placehold.co/600x400?text=Chinos"],
        category: "Clothing",
        stock: 120,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_clothing_002" },
      update: {},
      create: {
        id: "prod_clothing_002",
        name: "Merino Wool Crew-neck Sweater",
        description:
          "Lightweight merino wool sweater, perfect for layering. Anti-itch, moisture-wicking, and naturally odour-resistant.",
        price: 89.0,
        images: ["https://placehold.co/600x400?text=Sweater"],
        category: "Clothing",
        stock: 0, // out of stock — useful for testing
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_clothing_003" },
      update: {},
      create: {
        id: "prod_clothing_003",
        name: "Running Jacket — Waterproof",
        description:
          "Lightweight waterproof running jacket with reflective strips, ventilation zips, and a packable hood.",
        price: 119.95,
        images: ["https://placehold.co/600x400?text=Jacket"],
        category: "Clothing",
        stock: 35,
      },
    }),
    // Books
    prisma.product.upsert({
      where: { id: "prod_books_001" },
      update: {},
      create: {
        id: "prod_books_001",
        name: "Clean Code: A Handbook of Agile Software Craftsmanship",
        description:
          "Robert C. Martin's guide to writing clean, maintainable code. Essential reading for every software developer.",
        price: 39.99,
        images: ["https://placehold.co/600x400?text=Clean+Code"],
        category: "Books",
        stock: 200,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_books_002" },
      update: {},
      create: {
        id: "prod_books_002",
        name: "Designing Data-Intensive Applications",
        description:
          "Martin Kleppmann's comprehensive guide to modern data systems — covering replication, partitioning, transactions, and more.",
        price: 54.99,
        images: ["https://placehold.co/600x400?text=DDIA"],
        category: "Books",
        stock: 150,
      },
    }),
    // Home
    prisma.product.upsert({
      where: { id: "prod_home_001" },
      update: {},
      create: {
        id: "prod_home_001",
        name: "Ergonomic Office Chair",
        description:
          "Fully adjustable office chair with lumbar support, 4D armrests, and breathable mesh back. Supports up to 150 kg.",
        price: 449.0,
        images: ["https://placehold.co/600x400?text=Chair"],
        category: "Home",
        stock: 25,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_home_002" },
      update: {},
      create: {
        id: "prod_home_002",
        name: "Bamboo Desk Organiser Set",
        description:
          "6-piece sustainable bamboo desk organiser set. Includes pen holder, letter tray, sticky note holder, and cable clips.",
        price: 34.99,
        images: ["https://placehold.co/600x400?text=Organiser"],
        category: "Home",
        stock: 88,
      },
    }),
  ]);

  console.log(`  ✓ Created ${products.length} products`);

  // -----------------------------------------------------------------------
  // 3. Carts (one per user, but leave them empty — carts are created on demand)
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // 4. Orders
  // -----------------------------------------------------------------------

  // Alice — two orders
  const aliceOrder1 = await prisma.order.create({
    data: {
      userId: alice.id,
      totalAmount: 429.98,
      status: OrderStatus.DELIVERED,
      shippingAddress: "123 Main St, Springfield, IL 62701",
      paymentMethod: "credit_card",
      shippingFee: 9.99,
      discountAmount: 0,
      items: {
        create: [
          {
            productId: "prod_electronics_001",
            quantity: 1,
            price: 299.99,
          },
          {
            productId: "prod_electronics_003",
            quantity: 1,
            price: 129.99,
          },
        ],
      },
    },
  });

  const aliceOrder2 = await prisma.order.create({
    data: {
      userId: alice.id,
      totalAmount: 89.0,
      status: OrderStatus.PROCESSING,
      shippingAddress: "123 Main St, Springfield, IL 62701",
      paymentMethod: "paypal",
      shippingFee: 4.99,
      discountAmount: 0,
      items: {
        create: [
          {
            productId: "prod_books_001",
            quantity: 1,
            price: 39.99,
          },
          {
            productId: "prod_books_002",
            quantity: 1,
            price: 49.01,
          },
        ],
      },
    },
  });

  // Bob — one order
  const bobOrder1 = await prisma.order.create({
    data: {
      userId: bob.id,
      totalAmount: 584.0,
      status: OrderStatus.SHIPPING,
      shippingAddress: "456 Oak Ave, Portland, OR 97201",
      paymentMethod: "credit_card",
      shippingFee: 0,
      discountAmount: 15.0,
      items: {
        create: [
          {
            productId: "prod_home_001",
            quantity: 1,
            price: 449.0,
          },
          {
            productId: "prod_home_002",
            quantity: 2,
            price: 34.99,
          },
          {
            productId: "prod_clothing_001",
            quantity: 1,
            price: 49.99,
          },
        ],
      },
    },
  });

  console.log(
    `  ✓ Created orders: ${aliceOrder1.id} (delivered), ${aliceOrder2.id} (processing), ${bobOrder1.id} (shipping)`
  );

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
