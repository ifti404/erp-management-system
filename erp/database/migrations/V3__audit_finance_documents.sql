-- Audit history, payment due dates, and printable-document business details.
-- Non-destructive: creates new tables and nullable columns only.
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sales_orders' AND column_name = 'due_date') = 0,
    'ALTER TABLE sales_orders ADD COLUMN due_date DATE NULL', 'SELECT ''sales_orders.due_date already exists''');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'inventory_movements' AND column_name = 'actor_username') = 0,
    'ALTER TABLE inventory_movements ADD COLUMN actor_username VARCHAR(50) NULL', 'SELECT ''inventory_movements.actor_username already exists''');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_orders' AND column_name = 'due_date') = 0,
    'ALTER TABLE purchase_orders ADD COLUMN due_date DATE NULL', 'SELECT ''purchase_orders.due_date already exists''');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT NULL,
    details TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_audit_events_created_at (created_at),
    KEY idx_audit_events_entity (entity_type, entity_id),
    KEY idx_audit_events_actor (actor_username)
);

CREATE TABLE IF NOT EXISTS company_settings (
    id BIGINT NOT NULL,
    business_name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(40) NULL,
    email VARCHAR(120) NULL,
    tax_number VARCHAR(60) NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT',
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO company_settings (id, business_name, currency_code, updated_at)
VALUES (1, 'Gamma ERP Business', 'BDT', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id = id;
