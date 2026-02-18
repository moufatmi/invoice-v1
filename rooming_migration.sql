
-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Double', 'Triple', 'Quad', 'Quint')),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 2 AND 5),
  floor_number INTEGER,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create room_assignments table (link clients to rooms)
CREATE TABLE room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE     CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id) -- A client can only be in one room at a time
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for Rooms
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON rooms FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for Room Assignments
CREATE POLICY "Enable read access for all users" ON room_assignments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON room_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON room_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON room_assignments FOR DELETE USING (auth.role() = 'authenticated');
