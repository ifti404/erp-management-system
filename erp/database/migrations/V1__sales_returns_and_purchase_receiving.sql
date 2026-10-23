-- Apply once to the existing Gamma ERP database before starting the new backend.
-- Take a database backup first. This migration preserves all existing rows.
CREATE TABLE IF NOT EXISTS erp_schema_migrations (
  version VARCHAR(100) NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SET @legacy_migration_needed = (
  SELECT COUNT(*) = 0 FROM erp_schema_migrations
  WHERE version = 'V1__sales_returns_and_purchase_receiving'
);

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'sales_orders'
     AND column_name = 'delivery_charge') = 0,
  'ALTER TABLE sales_orders ADD COLUMN delivery_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00',
  'SELECT ''sales_orders.delivery_charge already exists'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  movement_type VARCHAR(30) NOT NULL,
  quantity_change INT NOT NULL,
  quantity_after INT NOT NULL,
  reference_type VARCHAR(30) NULL,
  reference_id BIGINT NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_inventory_movements_created_at (created_at),
  KEY idx_inventory_movements_product_id (product_id),
  CONSTRAINT fk_inventory_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'sales_orders'
     AND column_name = 'inventory_released') = 0,
  'ALTER TABLE sales_orders ADD COLUMN inventory_released BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT ''sales_orders.inventory_released already exists'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'purchase_items'
     AND column_name = 'received_quantity') = 0,
  'ALTER TABLE purchase_items ADD COLUMN received_quantity INT NOT NULL DEFAULT 0',
  'SELECT ''purchase_items.received_quantity already exists'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

START TRANSACTION;

-- Before this release, creating a purchase item immediately increased stock.
-- Backfill only once, so rerunning this SQL cannot overwrite later receipts.
UPDATE purchase_items
SET received_quantity = quantity
WHERE id > 0 AND @legacy_migration_needed = 1 AND received_quantity = 0;

UPDATE purchase_orders
SET status = 'RECEIVED'
WHERE @legacy_migration_needed = 1
  AND purchase_orders.id > 0
  AND UPPER(status) IN ('PENDING', 'ORDERED')
  AND EXISTS (SELECT 1 FROM purchase_items pi WHERE pi.purchase_order_id = purchase_orders.id)
  AND NOT EXISTS (
    SELECT 1 FROM purchase_items pi
    WHERE pi.purchase_order_id = purchase_orders.id AND pi.received_quantity < pi.quantity
  );

INSERT IGNORE INTO erp_schema_migrations(version)
VALUES ('V1__sales_returns_and_purchase_receiving');

COMMIT;

-- Existing releases are not inferable from the old schema. Keep the default
-- FALSE rather than guessing, so a migration never changes stock quantities.
