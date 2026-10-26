-- Run once against the existing ERP database before deploying the financial account features.
CREATE TABLE financial_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    active BIT NOT NULL DEFAULT b'1',
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_financial_accounts_name (name)
) ENGINE=InnoDB;

INSERT INTO financial_accounts (name, account_type, currency_code, opening_balance, active, created_at)
VALUES ('Main account', 'CASH', 'BDT', 0.00, b'1', CURRENT_TIMESTAMP(6));

ALTER TABLE payments ADD COLUMN account_id BIGINT NULL;
ALTER TABLE expenses ADD COLUMN account_id BIGINT NULL;

UPDATE payments SET account_id = 1 WHERE UPPER(status) IN ('PAID', 'REFUNDED');
UPDATE expenses SET account_id = 1;
ALTER TABLE expenses MODIFY account_id BIGINT NOT NULL;

ALTER TABLE payments ADD KEY idx_payments_account_id (account_id),
    ADD CONSTRAINT fk_payments_financial_account FOREIGN KEY (account_id) REFERENCES financial_accounts (id);
ALTER TABLE expenses ADD KEY idx_expenses_account_id (account_id),
    ADD CONSTRAINT fk_expenses_financial_account FOREIGN KEY (account_id) REFERENCES financial_accounts (id);

CREATE TABLE account_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    account_id BIGINT NOT NULL,
    entry_date DATETIME(6) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    direction VARCHAR(3) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    description VARCHAR(180) NOT NULL,
    reference VARCHAR(100) NULL,
    source_type VARCHAR(20) NOT NULL,
    source_id BIGINT NULL,
    entry_leg VARCHAR(10) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_entry_source (source_type, source_id, entry_leg),
    KEY idx_account_entries_account_date (account_id, entry_date, id),
    CONSTRAINT fk_account_entries_account FOREIGN KEY (account_id) REFERENCES financial_accounts (id)
) ENGINE=InnoDB;

CREATE TABLE internal_transfers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    from_account_id BIGINT NOT NULL,
    to_account_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    transfer_date DATETIME(6) NOT NULL,
    reference VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_internal_transfers_from (from_account_id, transfer_date),
    KEY idx_internal_transfers_to (to_account_id, transfer_date),
    CONSTRAINT fk_internal_transfers_from FOREIGN KEY (from_account_id) REFERENCES financial_accounts (id),
    CONSTRAINT fk_internal_transfers_to FOREIGN KEY (to_account_id) REFERENCES financial_accounts (id)
) ENGINE=InnoDB;

-- Preserve existing cash history in the new ledger. Pending and failed payments do not change balances.
INSERT INTO account_entries (account_id, entry_date, entry_type, direction, amount, description, reference,
    source_type, source_id, entry_leg, created_at, created_by)
SELECT p.account_id, p.payment_date,
       CASE WHEN UPPER(p.status) = 'REFUNDED' THEN 'REFUND' ELSE 'PAYMENT' END,
       CASE WHEN UPPER(p.status) = 'PAID' AND p.sales_order_id IS NOT NULL THEN 'IN' ELSE 'OUT' END,
       p.amount,
       CASE WHEN UPPER(p.status) = 'REFUNDED' THEN 'Customer refund'
            WHEN p.sales_order_id IS NOT NULL THEN 'Sales receipt' ELSE 'Supplier payment' END,
       p.notes, 'PAYMENT', p.id, 'MAIN', CURRENT_TIMESTAMP(6), 'SYSTEM'
FROM payments p WHERE UPPER(p.status) IN ('PAID', 'REFUNDED');

INSERT INTO account_entries (account_id, entry_date, entry_type, direction, amount, description, reference,
    source_type, source_id, entry_leg, created_at, created_by)
SELECT e.account_id, CONCAT(e.expense_date, ' 00:00:00'), 'EXPENSE', 'OUT', e.amount,
       CONCAT('Expense · ', COALESCE(c.name, 'Expense')), e.reference,
       'EXPENSE', e.id, 'MAIN', COALESCE(e.created_at, CURRENT_TIMESTAMP(6)), COALESCE(e.created_by, 'SYSTEM')
FROM expenses e LEFT JOIN expense_categories c ON c.id = e.category_id;
