-- Empty database schema for a brand-new university showcase deployment.
-- Generated to match the current JPA entities. This contains no business data.
-- Do not run against an existing database: CREATE TABLE statements intentionally
-- use a clean schema and are separate from the V1-V5 upgrade migrations.

CREATE TABLE categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE company_settings (
    id BIGINT NOT NULL,
    business_name VARCHAR(120) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(40),
    email VARCHAR(120),
    tax_number VARCHAR(60),
    currency_code VARCHAR(3) NOT NULL,
    logo_data LONGTEXT,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE suppliers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    address VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission VARCHAR(60) NOT NULL,
    PRIMARY KEY (role_id, permission),
    KEY idx_role_permissions_permission (permission),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sku VARCHAR(45) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    unit_cost DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    reorder_level INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    category_id BIGINT NOT NULL,
    supplier_id BIGINT,
    PRIMARY KEY (id),
    KEY idx_products_category_id (category_id),
    KEY idx_products_supplier_id (supplier_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
) ENGINE=InnoDB;

CREATE TABLE inventory (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_inventory_product_id (product_id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE sales_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    order_date DATETIME(6) NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    delivery_charge DECIMAL(12,2) NOT NULL,
    courier VARCHAR(30),
    parcel_id VARCHAR(100),
    notes VARCHAR(255),
    inventory_released BIT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sales_orders_customer_id (customer_id),
    CONSTRAINT fk_sales_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    supplier_id BIGINT NOT NULL,
    order_date DATETIME(6) NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    notes VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_purchase_orders_supplier_id (supplier_id),
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
) ENGINE=InnoDB;

CREATE TABLE sales_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sales_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sales_items_sales_order_id (sales_order_id),
    KEY idx_sales_items_product_id (product_id),
    CONSTRAINT fk_sales_items_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id),
    CONSTRAINT fk_sales_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE purchase_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    received_quantity INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_purchase_items_purchase_order_id (purchase_order_id),
    KEY idx_purchase_items_product_id (product_id),
    CONSTRAINT fk_purchase_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
    CONSTRAINT fk_purchase_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_date DATETIME(6) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    sales_order_id BIGINT,
    purchase_order_id BIGINT,
    notes VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_payments_sales_order_id (sales_order_id),
    KEY idx_payments_purchase_order_id (purchase_order_id),
    CONSTRAINT fk_payments_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id),
    CONSTRAINT fk_payments_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    theme_preference VARCHAR(8) NOT NULL DEFAULT 'LIGHT',
    photo_data LONGTEXT,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_users_role_id (role_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

CREATE TABLE expense_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    active BIT NOT NULL DEFAULT b'1',
    PRIMARY KEY (id),
    UNIQUE KEY uk_expense_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    reference VARCHAR(100),
    notes VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_expenses_date (expense_date),
    KEY idx_expenses_category (category_id),
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories (id)
) ENGINE=InnoDB;

INSERT INTO expense_categories (name, description) VALUES
('Office', 'Office and administrative expenses'),
('Transport', 'Travel and delivery costs'),
('Utilities', 'Electricity, internet, and other utilities'),
('Supplies', 'Operational and office supplies'),
('Marketing', 'Promotion and advertising'),
('Other', 'Other business expenses');

CREATE TABLE inventory_movements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity_change INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    notes VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    actor_username VARCHAR(50),
    PRIMARY KEY (id),
    KEY idx_inventory_movements_created_at (created_at),
    KEY idx_inventory_movements_product_id (product_id),
    CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE remembered_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_remembered_sessions_token_hash (token_hash),
    KEY idx_remembered_sessions_user_id (user_id),
    KEY idx_remembered_sessions_expires_at (expires_at),
    CONSTRAINT fk_remembered_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    PRIMARY KEY (id),
    KEY idx_audit_events_created_at (created_at),
    KEY idx_audit_events_entity (entity_type, entity_id),
    KEY idx_audit_events_actor (actor_username)
) ENGINE=InnoDB;

CREATE TABLE sales_returns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sales_order_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    settlement_type VARCHAR(20) NOT NULL,
    settlement_status VARCHAR(20) NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    return_amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sales_returns_order (sales_order_id),
    KEY idx_sales_returns_created_at (created_at),
    CONSTRAINT fk_sales_returns_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id)
) ENGINE=InnoDB;

CREATE TABLE sales_return_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sales_return_id BIGINT NOT NULL,
    sales_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    restock BIT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sales_return_items_return (sales_return_id),
    KEY idx_sales_return_items_sales_item (sales_item_id),
    CONSTRAINT fk_sales_return_items_return FOREIGN KEY (sales_return_id) REFERENCES sales_returns (id),
    CONSTRAINT fk_sales_return_items_sales_item FOREIGN KEY (sales_item_id) REFERENCES sales_items (id)
) ENGINE=InnoDB;

INSERT INTO company_settings (id, business_name, currency_code, updated_at)
VALUES (1, 'Gamma ERP Business', 'BDT', CURRENT_TIMESTAMP(6));
