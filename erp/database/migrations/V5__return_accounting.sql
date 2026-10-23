-- Preserve the historic item value separately from the cash refund actually owed.
-- Existing V4 return records used refund_amount as the item value.
ALTER TABLE sales_returns
  ADD COLUMN return_amount DECIMAL(12,2) NULL AFTER settlement_status;

UPDATE sales_returns
SET return_amount = refund_amount
WHERE return_amount IS NULL;

ALTER TABLE sales_returns
  MODIFY COLUMN return_amount DECIMAL(12,2) NOT NULL;
