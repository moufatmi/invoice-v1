
-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  passport_number TEXT,
  gender TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table (services)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  invoice_id UUID NOT NULL, -- Needs foreign key later
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id),
  agent_id UUID, -- Assuming agents table exists or handled separately
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  
  -- Umrah Specific Fields
  passport_number TEXT, -- Extracted from OCR
  gender TEXT,
  flight_number TEXT,
  room_type TEXT,
  visa_status TEXT DEFAULT 'Pending',
  departure_date DATE,
  date_of_birth DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for items -> invoices
ALTER TABLE items ADD CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust as needed for auth)
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ... repeat for other tables/operations
