-- =============================================================================
-- Migration 020: Enquiry CRM Columns
-- Adds next_action, next_action_date, next_action_notes, assigned_to
-- to the enquiries table. None of these existed before this migration.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: next_action type enum
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'next_action_type') THEN
    CREATE TYPE next_action_type AS ENUM (
      'CALL_CUSTOMER',
      'SEND_QUOTATION',
      'FOLLOW_UP',
      'COLLECT_ADVANCE',
      'CONFIRM_EVENT',
      'COLLECT_BALANCE',
      'OTHER'
    );
    RAISE NOTICE 'Created next_action_type enum';
  ELSE
    RAISE NOTICE 'next_action_type enum already exists';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add CRM columns to enquiries
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS next_action       next_action_type,
  ADD COLUMN IF NOT EXISTS next_action_date  DATE,
  ADD COLUMN IF NOT EXISTS next_action_notes TEXT,
  ADD COLUMN IF NOT EXISTS next_action_done  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_action_done_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action_done_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN enquiries.next_action IS
  'What needs to happen next for this enquiry.';
COMMENT ON COLUMN enquiries.next_action_date IS
  'When the next action is due. Used for follow-up dashboard (overdue / due today / upcoming).';
COMMENT ON COLUMN enquiries.next_action_notes IS
  'Free-text context for the next action.';
COMMENT ON COLUMN enquiries.next_action_done IS
  'True once the next action has been marked complete.';
COMMENT ON COLUMN enquiries.next_action_done_at IS
  'Timestamp when the next action was marked done.';
COMMENT ON COLUMN enquiries.next_action_done_by IS
  'Staff member who marked the next action as done.';
COMMENT ON COLUMN enquiries.assigned_to IS
  'Staff member (auth.users.id) responsible for this enquiry.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Normalize source values
-- Existing data uses lowercase ('whatsapp', 'form', 'phone').
-- We keep these as-is but add a check constraint for new rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- Normalise any existing non-standard values to 'OTHER'
UPDATE enquiries
SET source = 'OTHER'
WHERE source IS NOT NULL
  AND source NOT IN ('WEBSITE', 'WHATSAPP', 'PHONE', 'REFERRAL', 'OTHER',
                     'website', 'whatsapp', 'phone', 'referral', 'other',
                     'form', 'FORM');

-- Uppercase all source values for consistency
UPDATE enquiries
SET source = UPPER(source)
WHERE source IS NOT NULL;

-- Map legacy 'FORM' → 'WEBSITE'
UPDATE enquiries SET source = 'WEBSITE' WHERE source = 'FORM';

-- Add check constraint for new inserts
ALTER TABLE enquiries
  DROP CONSTRAINT IF EXISTS enquiries_source_check;

ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_source_check
  CHECK (source IS NULL OR source IN ('WEBSITE', 'WHATSAPP', 'PHONE', 'REFERRAL', 'OTHER'));

COMMENT ON COLUMN enquiries.source IS
  'Where the enquiry came from. Values: WEBSITE, WHATSAPP, PHONE, REFERRAL, OTHER';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Indexes for CRM queries
-- ─────────────────────────────────────────────────────────────────────────────

-- Follow-up dashboard: "overdue" and "due today" queries
CREATE INDEX IF NOT EXISTS idx_enquiries_next_action_date
  ON enquiries(next_action_date)
  WHERE next_action_done = false AND next_action_date IS NOT NULL;

-- Assigned staff queries
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_to
  ON enquiries(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Source filter
CREATE INDEX IF NOT EXISTS idx_enquiries_source
  ON enquiries(source)
  WHERE source IS NOT NULL;

-- Event date filter (for CRM date range queries)
CREATE INDEX IF NOT EXISTS idx_enquiries_event_date
  ON enquiries(event_date)
  WHERE event_date IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Follow-up summary view
-- Used by the dashboard follow-up widget.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW followup_summary AS
SELECT
  COUNT(*) FILTER (
    WHERE next_action_date < CURRENT_DATE
      AND next_action_done = false
  ) AS overdue,
  COUNT(*) FILTER (
    WHERE next_action_date = CURRENT_DATE
      AND next_action_done = false
  ) AS due_today,
  COUNT(*) FILTER (
    WHERE next_action_date > CURRENT_DATE
      AND next_action_done = false
  ) AS upcoming,
  COUNT(*) FILTER (
    WHERE next_action_done = true
      AND next_action_done_at >= NOW() - INTERVAL '7 days'
  ) AS completed_last_7_days
FROM enquiries
WHERE next_action_date IS NOT NULL;

COMMENT ON VIEW followup_summary IS
  'Single-row summary for dashboard follow-up widget.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Upcoming follow-ups view
-- Returns enquiries with pending follow-ups, ordered by urgency.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW upcoming_followups AS
SELECT
  e.id,
  e.name,
  e.phone,
  e.event_type,
  e.event_date,
  e.status,
  e.next_action,
  e.next_action_date,
  e.next_action_notes,
  e.assigned_to,
  sp.full_name AS assigned_to_name,
  CASE
    WHEN e.next_action_date < CURRENT_DATE  THEN 'OVERDUE'
    WHEN e.next_action_date = CURRENT_DATE  THEN 'DUE_TODAY'
    ELSE 'UPCOMING'
  END AS followup_urgency,
  (CURRENT_DATE - e.next_action_date) AS days_overdue
FROM enquiries e
LEFT JOIN staff_profiles sp ON sp.user_id = e.assigned_to
WHERE e.next_action_done = false
  AND e.next_action_date IS NOT NULL
  AND e.status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY
  e.next_action_date ASC;

COMMENT ON VIEW upcoming_followups IS
  'Pending follow-ups ordered by urgency (overdue first). Used by dashboard widget.';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Verification
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_cols INT;
BEGIN
  SELECT COUNT(*) INTO v_cols
  FROM information_schema.columns
  WHERE table_name = 'enquiries'
    AND column_name IN ('next_action', 'next_action_date', 'next_action_notes',
                        'next_action_done', 'assigned_to');

  RAISE NOTICE '=== Migration 020 Complete ===';
  RAISE NOTICE 'CRM columns added to enquiries: %/5', v_cols;
  RAISE NOTICE 'Views created: followup_summary, upcoming_followups';
  RAISE NOTICE 'Indexes: next_action_date, assigned_to, source, event_date';
END $$;
