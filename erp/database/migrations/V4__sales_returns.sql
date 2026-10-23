-- Sales return records and item-level quantities. Existing orders and inventory are untouched.
CREATE TABLE IF NOT EXISTS sales_returns (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sales_order_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  settlement_type VARCHAR(20) NOT NULL,
  settlement_status VARCHAR(20) NOT NULL,
  refund_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sales_returns_order (sales_order_id),
  KEY idx_sales_returns_created_at (created_at),
  CONSTRAINT fk_sales_returns_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_return_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sales_return_id BIGINT NOT NULL,
  sales_item_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  restock BOOLEAN NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sales_return_items_return (sales_return_id),
  KEY idx_sales_return_items_sales_item (sales_item_id),
  CONSTRAINT fk_sales_return_items_return FOREIGN KEY (sales_return_id) REFERENCES sales_returns (id),
  CONSTRAINT fk_sales_return_items_sales_item FOREIGN KEY (sales_item_id) REFERENCES sales_items (id)
) ENGINE=InnoDB;
