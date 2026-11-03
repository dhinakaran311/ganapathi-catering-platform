-- =============================================================================
-- Migration 026: Enable Realtime on enquiries (E35)
--
-- The admin NotificationBell subscribes to INSERTs on enquiries so new
-- enquiries appear live without a page refresh. Realtime must be enabled
-- (table added to the supabase_realtime publication) and REPLICA IDENTITY
-- FULL set so the full row is delivered on the change event.
-- =============================================================================

-- Add to the realtime publication (idempotent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enquiries'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
      RAISE NOTICE 'Added enquiries to supabase_realtime publication';
    ELSE
      RAISE NOTICE 'enquiries already in supabase_realtime publication';
    END IF;
  ELSE
    RAISE WARNING 'supabase_realtime publication not found — enable Realtime for enquiries in the Supabase dashboard (Database → Replication).';
  END IF;
END $$;

-- Deliver full row on change.
ALTER TABLE public.enquiries REPLICA IDENTITY FULL;
