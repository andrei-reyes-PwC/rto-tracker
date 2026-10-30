-- Existing receipts have no known claim time and remain NULL.
ALTER TABLE lunch_recipients
    ADD COLUMN claimed_at DATETIME(6) NULL;
