# Gamma ERP

A web-based Business ERP Management System built with Java Spring Boot, MySQL, and Next.js.

Gamma ERP is designed as a practical ERP solution for managing products, inventory, suppliers, customers, purchases, sales, and payments in one system.

> Academic project developed for learning and demonstrating Java, Spring Boot, database design, REST APIs, and modern web development.

---

## Features

### Dashboard

- Total products
- Total inventory units
- Low-stock products
- Out-of-stock products
- Sales received
- Purchases paid
- Recent sales orders
- Recent purchase orders
- Low-stock product overview

### Product Management

- Create products
- Edit products
- Delete products
- SKU management
- Product pricing
- Reorder levels
- Product categories
- Product suppliers
- Product status management
- Create categories directly while adding a product

### Inventory Management

- Automatic inventory creation for new products
- Automatic stock increase after purchases
- Automatic stock deduction after sales
- Automatic stock restoration when sales items are deleted
- Automatic stock restoration when purchase items are deleted
- Low-stock detection
- Out-of-stock detection
- Protection against negative inventory

### Customer Management

- Create customers
- Edit customers
- Delete customers
- Customer information management

### Supplier Management

- Create suppliers
- Edit suppliers
- Delete suppliers
- Supplier information management

### Purchase Management

- Create purchase orders
- Edit purchase orders
- Purchase order status
- Add purchase items
- Edit purchase items
- Delete purchase items
- Automatic subtotal calculation
- Automatic purchase order total calculation
- Automatic inventory updates

### Sales Management

- Create sales orders
- Edit sales orders
- Sales order status
- Add sales items
- Edit sales items
- Delete sales items
- Automatic subtotal calculation
- Automatic sales order total calculation
- Automatic inventory deduction

### Payment Management

- Record sales payments
- Record purchase payments
- Edit payments
- Delete payments
- Payment status
- Payment method
- Payment notes
- Payments linked to the appropriate sales or purchase order

### Data Integrity

- Primary and foreign key relationships
- Backend validation
- Required-field validation
- Quantity validation
- Price validation
- Inventory protection
- Relationship protection when deleting records
- Transactional inventory updates

---

## Tech Stack

### Backend

- Java 27
- Spring Boot 4.1.1
- Spring Data JPA
- Hibernate
- Maven
- REST API
- Bean Validation

### Database

- MySQL 8.x
- MySQL Workbench

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Development Tools

- IntelliJ IDEA
- Visual Studio Code
- Git
- GitHub
- MySQL Workbench

---

## System Architecture

The application follows a simple client-server architecture.

```text
┌───────────────────────────────┐
│          Next.js              │
│        Frontend UI            │
│     React + TypeScript        │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│        Spring Boot            │
│          Backend              │
│                               │
│ Controller → Service → JPA    │
└───────────────┬───────────────┘
                │
                │ JDBC / Hibernate
                ▼
┌───────────────────────────────┐
│            MySQL              │
│          erp_db               │
└───────────────────────────────┘
```
