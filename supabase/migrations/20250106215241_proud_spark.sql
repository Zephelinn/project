/*
  # Initialize Ticket System Schema

  1. New Tables
    - tickets
      - id (uuid, primary key)
      - channel_id (text)
      - user_id (text)
      - category (text)
      - status (text)
      - created_at (timestamp)
      - closed_at (timestamp)
    
    - blacklisted_users
      - user_id (text, primary key)
      - blacklisted_at (timestamp)
      - blacklisted_by (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for service role access
*/

-- Tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  user_id text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Blacklisted users table
CREATE TABLE blacklisted_users (
  user_id text PRIMARY KEY,
  blacklisted_at timestamptz DEFAULT now(),
  blacklisted_by text NOT NULL
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklisted_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage tickets"
  ON tickets
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage blacklist"
  ON blacklisted_users
  TO service_role
  USING (true)
  WITH CHECK (true);