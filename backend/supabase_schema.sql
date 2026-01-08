-- Drop existing tables to start fresh with V2 Schema
DROP TABLE IF EXISTS reconciliation_results;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cancellations;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS return_charges;

-- 1. Orders Table (From ORDER.csv)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  order_status TEXT,
  final_amount DECIMAL(12,2),
  total_mrp DECIMAL(12,2),
  discount DECIMAL(12,2),
  delivered_on TIMESTAMPTZ,
  cancelled_on TIMESTAMPTZ,
  return_creation_date TIMESTAMPTZ,
  sku_code TEXT,
  style_name TEXT,
  brand TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_order_line_id ON orders(order_line_id);
GRANT ALL ON orders TO anon;

-- 2. Cancellations Table (From CANCEL.csv)
CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  cancellation_reason TEXT,
  cancellation_type TEXT,
  cancellation_date TIMESTAMPTZ,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cancellations_order_line_id ON cancellations(order_line_id);
GRANT ALL ON cancellations TO anon;

-- 3. Returns Table (From RETURN.csv)
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  status TEXT, -- RTO or Return
  return_reason TEXT,
  return_created_date TIMESTAMPTZ,
  refunded_date TIMESTAMPTZ,
  return_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_returns_order_line_id ON returns(order_line_id);
GRANT ALL ON returns TO anon;

-- 4. Payments Table (From PAYMENT.csv - Forward Payments)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  customer_paid_amount DECIMAL(12,2),
  seller_product_amount DECIMAL(12,2),
  expected_settlement DECIMAL(12,2),
  actual_settlement DECIMAL(12,2),
  pending_settlement DECIMAL(12,2),
  commission DECIMAL(12,2),
  logistics_deduction DECIMAL(12,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_line_id ON payments(order_line_id);
GRANT ALL ON payments TO anon;

-- 5. Return Charges Table (From RETURN CHRGE.csv - Reverse Payments)
CREATE TABLE IF NOT EXISTS return_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  return_type TEXT,
  settlement_amount DECIMAL(12,2),
  actual_settlement DECIMAL(12,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_return_charges_order_line_id ON return_charges(order_line_id);
GRANT ALL ON return_charges TO anon;

-- 6. Reconciliation Results Table (For Dashboard & Export)
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id TEXT NOT NULL UNIQUE,
  order_release_id TEXT,
  sku_code TEXT,
  style_name TEXT,
  
  -- Status
  item_status TEXT, -- Delivered, Cancelled, Returned, In Transit
  
  -- Amounts
  final_amount DECIMAL(12,2),
  customer_paid_amount DECIMAL(12,2),
  expected_settlement DECIMAL(12,2),
  actual_settlement DECIMAL(12,2), -- Net from forward payment
  return_charge DECIMAL(12,2) DEFAULT 0, -- Net from return charge
  net_settlement DECIMAL(12,2), -- actual_settlement (payment) + actual_settlement (return_charge)
  
  -- Difference
  difference DECIMAL(12,2),
  customer_difference DECIMAL(12,2), -- customer_paid - net_settlement
  
  -- Reconciliation Status
  reconciliation_status TEXT, -- Matched, Over Settled, Under Settled, Pending
  
  -- Dates for sorting
  order_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_results(item_status);
GRANT ALL ON reconciliation_results TO anon;
