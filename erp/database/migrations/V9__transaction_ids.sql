ALTER TABLE sales_orders ADD COLUMN transaction_id VARCHAR(40) NULL;
UPDATE sales_orders SET transaction_id = CONCAT('ORD-', LPAD(id, 2, '0'));
CREATE UNIQUE INDEX uk_sales_orders_transaction_id ON sales_orders(transaction_id);

ALTER TABLE purchase_orders ADD COLUMN transaction_id VARCHAR(40) NULL;
UPDATE purchase_orders SET transaction_id = CONCAT('PUR-', LPAD(id, 2, '0'));
CREATE UNIQUE INDEX uk_purchase_orders_transaction_id ON purchase_orders(transaction_id);

ALTER TABLE expenses ADD COLUMN transaction_id VARCHAR(40) NULL;
UPDATE expenses SET transaction_id = CONCAT('EXP-', LPAD(id, 2, '0'));
CREATE UNIQUE INDEX uk_expenses_transaction_id ON expenses(transaction_id);
