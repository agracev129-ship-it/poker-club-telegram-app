-- Add is_blocked field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Add name field to users table (display name)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing users to set name from first_name + last_name
UPDATE users SET name = CONCAT(first_name, COALESCE(' ' || last_name, '')) WHERE name IS NULL;

-- Create profile_change_requests table
CREATE TABLE IF NOT EXISTS profile_change_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_name VARCHAR(255) NOT NULL,
  current_avatar_url TEXT,
  requested_name VARCHAR(255),
  requested_avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_requests_user_id ON profile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_requests_status ON profile_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

