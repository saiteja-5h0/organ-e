-- Setup SQL for Organ-E

-- Users: Doctors, Admins, Supervisors
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'admin', 'supervisor')),
  name VARCHAR(100) NOT NULL,
  hospital VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL
);

-- Organs inventory
CREATE TABLE IF NOT EXISTS organs (
  id SERIAL PRIMARY KEY,
  organ_type VARCHAR(50) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sent to OR', 'Transplanted')),
  hospital VARCHAR(100) NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transplant Requests
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  organ VARCHAR(50) NOT NULL,
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('Critical', 'High', 'Moderate')),
  blood VARCHAR(10) NOT NULL,
  location VARCHAR(150) NOT NULL,
  hospital VARCHAR(100) NOT NULL,
  time VARCHAR(50) DEFAULT 'Just Now',
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Allocated', 'Completed')),
  allocated_doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
  allocated_organ_id INT REFERENCES organs(id) ON DELETE SET NULL,
  verification_code VARCHAR(10),
  verification_confirmed BOOLEAN DEFAULT FALSE
);

-- Donations (Money & Organ)
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  donor_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  donation_type VARCHAR(20) NOT NULL CHECK (donation_type IN ('money', 'organ')),
  amount NUMERIC(12,2) DEFAULT 0,
  organ_type VARCHAR(50),
  blood_group VARCHAR(10),
  hospital VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctor / Transplant Activities tracking log
CREATE TABLE IF NOT EXISTS transplant_activities (
  id SERIAL PRIMARY KEY,
  doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organ Transfers (Supervisor Networking)
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  organ_type VARCHAR(50) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  from_hospital VARCHAR(100) NOT NULL,
  to_hospital VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'Requested' CHECK (status IN ('Requested', 'Accepted', 'Declined', 'Completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default accounts for prototyping
INSERT INTO users (username, password, role, name, hospital, location)
VALUES 
  ('doctor1', 'password', 'doctor', 'Dr. Sai Teja', 'Care Hospital', 'Miyapur, Hyderabad')
  ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, role, name, hospital, location)
VALUES 
  ('admin1', 'password', 'admin', 'Admit Coord A', 'Care Hospital', 'Miyapur, Hyderabad')
  ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, role, name, hospital, location)
VALUES 
  ('supervisor1', 'password', 'supervisor', 'Network Sup B', 'Care Hospital', 'Miyapur, Hyderabad')
  ON CONFLICT (username) DO NOTHING;
