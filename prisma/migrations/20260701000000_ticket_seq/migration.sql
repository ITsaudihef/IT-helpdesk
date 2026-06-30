-- Create a PostgreSQL sequence for atomic ticket numbering
CREATE SEQUENCE IF NOT EXISTS ticket_seq;

-- Initialise the sequence to the current highest ticket sequence number
-- so next generated number continues from where the old count-based approach left off
DO $$
DECLARE max_seq INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART("ticketNo", '-', 3) AS INTEGER)), 0
  )
  INTO max_seq
  FROM tickets
  WHERE "ticketNo" ~ '^IT-[0-9]{4}-[0-9]+$';

  -- setval with is_called=true means nextval() returns max_seq + 1
  PERFORM setval('ticket_seq', GREATEST(max_seq, 19), true);
END $$;
