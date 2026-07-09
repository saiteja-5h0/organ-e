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
  status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Transit', 'Sent to OR', 'Transplanted')),
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
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Allocated', 'Authorized', 'Completed')),
  patient_name VARCHAR(100),
  patient_age INT,
  patient_report TEXT,
  allocated_doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
  allocated_organ_id INT REFERENCES organs(id) ON DELETE SET NULL,
  verification_code VARCHAR(10),
  verification_confirmed BOOLEAN DEFAULT FALSE,
  authorized_at TIMESTAMP,
  completed_at TIMESTAMP
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
  status VARCHAR(20) DEFAULT 'Requested' CHECK (status IN ('Requested', 'Accepted', 'In Transit', 'Completed', 'Declined')),
  organ_id INT REFERENCES organs(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default accounts for prototyping
INSERT INTO users (username, password, role, name, hospital, location)
VALUES 
  -- Care Hospital
  ('doctor1', 'password', 'doctor', 'Dr. Sai Teja', 'Care Hospital', 'Miyapur, Hyderabad'),
  ('doctor1b', 'password', 'doctor', 'Dr. Aarav Sharma', 'Care Hospital', 'Miyapur, Hyderabad'),
  ('admin1', 'password', 'admin', 'Admit Coord A', 'Care Hospital', 'Miyapur, Hyderabad'),
  ('admin1b', 'password', 'admin', 'Admit Coord A2', 'Care Hospital', 'Miyapur, Hyderabad'),
  ('supervisor1', 'password', 'supervisor', 'Network Sup A1', 'Care Hospital', 'Miyapur, Hyderabad'),
  ('supervisor1b', 'password', 'supervisor', 'Network Sup A2', 'Care Hospital', 'Miyapur, Hyderabad'),
  -- Apollo Hospital
  ('doctor2', 'password', 'doctor', 'Dr. Priya Reddy', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  ('doctor2b', 'password', 'doctor', 'Dr. Rakesh Sen', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  ('admin2', 'password', 'admin', 'Admit Coord B', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  ('admin2b', 'password', 'admin', 'Admit Coord B2', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  ('supervisor2', 'password', 'supervisor', 'Network Sup B1', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  ('supervisor2b', 'password', 'supervisor', 'Network Sup B2', 'Apollo Hospital', 'Banjara Hills, Hyderabad'),
  -- Yashoda Hospital
  ('doctor3', 'password', 'doctor', 'Dr. Vikram Seth', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  ('doctor3b', 'password', 'doctor', 'Dr. Nisha Goel', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  ('admin3', 'password', 'admin', 'Admit Coord C', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  ('admin3b', 'password', 'admin', 'Admit Coord C2', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  ('supervisor3', 'password', 'supervisor', 'Network Sup C1', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  ('supervisor3b', 'password', 'supervisor', 'Network Sup C2', 'Yashoda Hospital', 'Secunderabad, Hyderabad'),
  -- AIG Hospitals
  ('doctor4', 'password', 'doctor', 'Dr. Mahesh Babu', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  ('doctor4b', 'password', 'doctor', 'Dr. Kavya Krishnan', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  ('admin4', 'password', 'admin', 'Admit Coord D', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  ('admin4b', 'password', 'admin', 'Admit Coord D2', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  ('supervisor4', 'password', 'supervisor', 'Network Sup D1', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  ('supervisor4b', 'password', 'supervisor', 'Network Sup D2', 'AIG Hospitals', 'Gachibowli, Hyderabad'),
  -- Fortis Hospital
  ('doctor5', 'password', 'doctor', 'Dr. Sameer Khan', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  ('doctor5b', 'password', 'doctor', 'Dr. Ananya Roy', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  ('admin5', 'password', 'admin', 'Admit Coord E', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  ('admin5b', 'password', 'admin', 'Admit Coord E2', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  ('supervisor5', 'password', 'supervisor', 'Network Sup E1', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  ('supervisor5b', 'password', 'supervisor', 'Network Sup E2', 'Fortis Hospital', 'Shalimar Bagh, Delhi'),
  -- Max Hospital
  ('doctor6', 'password', 'doctor', 'Dr. Sunita Patel', 'Max Hospital', 'Saket, Delhi'),
  ('doctor6b', 'password', 'doctor', 'Dr. Amit Trivedi', 'Max Hospital', 'Saket, Delhi'),
  ('admin6', 'password', 'admin', 'Admit Coord F', 'Max Hospital', 'Saket, Delhi'),
  ('admin6b', 'password', 'admin', 'Admit Coord F2', 'Max Hospital', 'Saket, Delhi'),
  ('supervisor6', 'password', 'supervisor', 'Network Sup F1', 'Max Hospital', 'Saket, Delhi'),
  ('supervisor6b', 'password', 'supervisor', 'Network Sup F2', 'Max Hospital', 'Saket, Delhi')
ON CONFLICT (username) DO NOTHING;
