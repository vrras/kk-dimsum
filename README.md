# KK Dimsum E-Commerce & Order Management

A modern web application (frontend and backend) for KK Dimsum designed to manage orders, menus, store configurations, and provide a seamless and integrated checkout experience for customers.

---

## 🚀 Key Features

### 🛒 Customer Facing
- **Interactive Menu Catalog**: Displays a list of food/beverages with neat and responsive categories.
- **Dynamic Shopping Cart**: Local storage state management so customers do not need to log in to add items to their cart.
- **Integrated Checkout System**: Checkout form for collecting customer names and addresses.
- **Payment Methods**: Supports payments via:
  - **Bank Transfer**: (Manually verified by the Admin).
  - **Cash on Delivery (COD)**: Pay on the spot or directly to the courier.
- **Order Tracking**: Customers can independently track their order processing status using their WhatsApp number and the tracking system on the dashboard.
- **Real-time Store Open/Close Indicator**: Visual indicator on the web if the restaurant's operational hours have ended or the store is closed. Customers are automatically prevented from adding items to the cart if the store is closed.
- **Promo Codes**: Customers can enter coupon/promo codes to get order discounts.

### 🛡️ Admin Panel (Dashboard)
- **Secure Authentication**: Secure login protection specifically for admins to keep the system and order management confidential.
- **Order Management**: 
  - Clearly view the list of incoming orders and their tracking status.
  - Progressively update order statuses (e.g., *Awaiting Payment* ➡️ *Processing* ➡️ *Shipped* ➡️ *Completed*).
- **Menu & Category Management**:
  - Full CRUD operations (Add, edit images, adjust prices, and delete) for all menu items in the restaurant catalog.
  - Adding menu categories (Appetizers, Main Courses, Beverages, etc.).
- **Promo Codes & Discounts**: Create specific discount coupons and monitor their status (Active/Inactive/Expired).
- **WhatsApp Setup**: Configure webhook settings for notification messages that will be automatically sent to customers and admins via WhatsApp.
- **Store Settings**:
  - Configure the restaurant's profile and address.
  - **Bank Account Configuration**: Setup guidelines and destination account numbers for transfer payments.
  - **Auto-Closure Scheduling**: Run scripts for store opening (e.g., 08:00) and closing (e.g., 22:00) times, along with filters for regular closed days each week.
  - **Manual Override**: Emergency manual open/close toggle outside of the automated schedule.

---

## 🛠️ Tech Stack
- **Core Framework**: [Next.js 14](https://nextjs.org/) (Utilizing modern App Router & Server Components).
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Static Typing for codebase stability).
- **UI/UX Styling**: [Material UI (MUI)](https://mui.com/) v5 integrated functionally for mobile-responsive beauty and compatibility.
- **ORM Database**: [Prisma](https://www.prisma.io/).
- **Iconography**: [Lucide React](https://lucide.dev/).

---

## ⚙️ Prerequisites
Before reproducing or running this application, please ensure your server or machine has installed:
- [Node.js](https://nodejs.org/) (version **18.x** or higher recommended).
- NPM or Yarn (Node package manager).

---

## 📦 Installation & Local Development Guide

1. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd kk-dimsum
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Database Environment**
   Create or modify the `.env` file in your root folder. Insert your local database configuration (can be MySQL / PostgreSQL / SQLite) and other secret variables:
   ```env
   # Example if using PostgreSQL
   DATABASE_URL="postgresql://user:password@localhost:5432/kk_dimsum"
   
   # Replace with any long, random secret
   NEXTAUTH_SECRET="your_very_long_secret_authentication_code_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Migration (Prisma)**
   Apply the table schema directly to your SQL Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Initial Data Access (Optional Seeding)**
   Generally, you can register an initial manual admin session into the database via database client tools or progressively add menus using the development dashboard.

6. **Run the Application (Development Mode)**
   ```bash
   npm run dev
   ```
   The public application and Admin Panel will be accessible at [http://localhost:3000](http://localhost:3000).

7. **Run the Application (Standard Production Mode for Vercel/VPS)**
   For the best performance before deploying to web hosting:
   ```bash
   npm run build
   npm run start
   ```

---

## 🏗️ Project Structure Overview
This project is based on a Next.js Monorepo architecture where the public UI, dashboard logic, and server APIs reside in a single project for easier management:
- `/app/(customer)` : UI content for the catalog & cart for **general customers**.
- `/app/admin/(dashboard)` : Secure user interface (Protected Routes) specifically for **Admins**.
- `/app/api/` : Pure backend API endpoints that communicate directly with the database.
- `/components/` : Independent Client/Server Component UI modules used repeatedly (e.g., Store Status Banner, Cart Provider, Form Cards).
- `/lib/` : Set of third-party abstraction utility functions like small helpers, `authOptions` setup, and Prisma client initialization.
- `/prisma/schema.prisma` : The source of truth guide file for the schema of Users, Orders, Promotions, and Menus in the database. Strictly controls type patterns.
