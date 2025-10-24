-- Add new columns to change_requests table
ALTER TABLE change_requests
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_token TEXT,
  ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_accepted_at TIMESTAMPTZ;

-- Add comment column to change_items table
ALTER TABLE change_items
  ADD COLUMN IF NOT EXISTS comment TEXT;

-- Update status CHECK constraint to include new statuses
ALTER TABLE change_requests
  DROP CONSTRAINT IF EXISTS change_requests_status_check;

ALTER TABLE change_requests
  ADD CONSTRAINT change_requests_status_check
  CHECK (status IN ('nowy', 'w trakcie', 'zaakceptowany', 'odrzucony', 'oczekuje na akceptację klienta', 'wymaga doprecyzowania'));

-- Create index for client_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_change_requests_client_token ON change_requests(client_token);

-- Comment on new columns
COMMENT ON COLUMN change_requests.messages IS 'JSONB array of Message objects for correspondence between client and technical department';
COMMENT ON COLUMN change_requests.client_token IS 'Unique token for client access without authentication';
COMMENT ON COLUMN change_requests.quote_sent_at IS 'Timestamp when quote was sent to client';
COMMENT ON COLUMN change_requests.quote_accepted_at IS 'Timestamp when client accepted the quote';
COMMENT ON COLUMN change_items.comment IS 'Comment for client regarding this item';
