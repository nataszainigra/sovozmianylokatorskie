-- Create change_requests table
CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_street TEXT,
  address_zip TEXT,
  address_city TEXT,
  status TEXT NOT NULL DEFAULT 'nowy' CHECK (status IN ('nowy', 'w trakcie', 'zaakceptowany', 'odrzucony')),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  estimated_cost JSONB,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create change_items table
CREATE TABLE IF NOT EXISTS change_items (
  id SERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  branch TEXT NOT NULL,
  code TEXT,
  description TEXT,
  unit TEXT,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2),
  technical_analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_submitted_at ON change_requests(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_unit_number ON change_requests(unit_number);
CREATE INDEX IF NOT EXISTS idx_change_items_request_id ON change_items(request_id);

-- Enable Row Level Security (RLS)
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_items ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - adjust based on your auth requirements)
-- You can modify these policies later to restrict access based on user roles

CREATE POLICY "Allow all operations on change_requests" ON change_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on change_items" ON change_items
  FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on change_requests
CREATE TRIGGER update_change_requests_updated_at
  BEFORE UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
