ALTER TABLE users ADD COLUMN theme_preference VARCHAR(8) NOT NULL DEFAULT 'LIGHT';

CREATE TABLE expense_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
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
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories(id)
) ENGINE=InnoDB;

INSERT INTO expense_categories (name, description) VALUES
('Office', 'Office and administrative expenses'),
('Transport', 'Travel and delivery costs'),
('Utilities', 'Electricity, internet, and other utilities'),
('Supplies', 'Operational and office supplies'),
('Marketing', 'Promotion and advertising'),
('Other', 'Other business expenses');
