-- 018_audit_event_types.sql
-- Comprehensive audit logging for all critical business actions
-- Ensures compliance, accountability, and traceable financial records

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create audit action enum for type safety (optional but recommended)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM (
      -- Customer events
      'CUSTOMER_CREATED',
      'CUSTOMER_UPDATED',
      'CUSTOMER_DELETED',
      
      -- Enquiry events
      'ENQUIRY_CREATED',
      'ENQUIRY_UPDATED',
      'ENQUIRY_STATUS_CHANGED',
      'ENQUIRY_CANCELLED',
      
      -- Invoice events
      'INVOICE_CREATED',
      'INVOICE_UPDATED',
      'INVOICE_SENT',
      'INVOICE_CANCELLED',
      'INVOICE_PAID',
      
      -- Payment events
      'PAYMENT_CREATED',
      'PAYMENT_VERIFIED',
      'PAYMENT_REJECTED',
      'PAYMENT_UPDATED',
      'PAYMENT_DELETED',
      
      -- System events
      'ADMIN_LOGIN',
      'ADMIN_LOGOUT',
      'SETTINGS_UPDATED'
    );
    RAISE NOTICE 'Created audit_action enum type';
  ELSE
    RAISE NOTICE 'audit_action enum already exists';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Enhance audit_logs table (if needed)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Add any missing columns to support comprehensive auditing
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN audit_logs.metadata IS 
  'Additional context about the audit event (e.g., changed fields, request details)';

COMMENT ON COLUMN audit_logs.error_message IS 
  'If the action failed, store the error message for debugging';

-- Create indexes for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
  ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON audit_logs(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create helper function to log audit events
-- This function is SECURITY DEFINER so it can be called from app code
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address,
    user_agent,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_ip_address,
    p_user_agent,
    p_metadata,
    NOW()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event IS 
  'Creates an audit log entry. Call this from API routes for all critical business actions.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create automatic audit triggers for critical tables
-- These triggers automatically log changes without manual API calls
-- ═══════════════════════════════════════════════════════════════════════════════

-- Generic trigger function for automatic auditing
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  current_user_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    audit_action := TG_TABLE_NAME || '_CREATED';
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := TG_TABLE_NAME || '_UPDATED';
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := TG_TABLE_NAME || '_DELETED';
  END IF;
  
  -- Try to get current user ID from session
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;
  
  -- Log the audit event
  IF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      current_user_id,
      audit_action,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  ELSE
    PERFORM log_audit_event(
      current_user_id,
      audit_action,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We will NOT enable automatic triggers on all tables
-- Instead, we'll use explicit audit calls in API routes for better control
-- Automatic triggers can cause performance issues and circular dependencies

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create views for common audit queries
-- ═══════════════════════════════════════════════════════════════════════════════

-- Recent audit events
CREATE OR REPLACE VIEW recent_audit_events AS
SELECT 
  al.id,
  al.action,
  al.table_name,
  al.record_id,
  al.created_at,
  u.email as user_email,
  al.ip_address,
  al.metadata
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_audit_events IS 
  'Most recent 100 audit events with user details';

-- Invoice audit trail
CREATE OR REPLACE VIEW invoice_audit_trail AS
SELECT 
  al.id as audit_id,
  al.action,
  al.record_id as invoice_id,
  i.invoice_number,
  al.old_data->>'status' as old_status,
  al.new_data->>'status' as new_status,
  al.old_data->>'total_amount' as old_amount,
  al.new_data->>'total_amount' as new_amount,
  u.email as performed_by,
  al.created_at as performed_at,
  al.ip_address,
  al.metadata
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
LEFT JOIN invoices i ON i.id = al.record_id
WHERE al.table_name = 'invoices'
ORDER BY al.created_at DESC;

COMMENT ON VIEW invoice_audit_trail IS 
  'Complete audit trail for all invoice changes';

-- Payment audit trail
CREATE OR REPLACE VIEW payment_audit_trail AS
SELECT 
  al.id as audit_id,
  al.action,
  al.record_id as payment_id,
  p.amount,
  p.payment_method,
  p.payment_type,
  al.old_data->>'status' as old_status,
  al.new_data->>'status' as new_status,
  u.email as performed_by,
  al.created_at as performed_at,
  al.metadata
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
LEFT JOIN payments p ON p.id = al.record_id
WHERE al.table_name = 'payments'
ORDER BY al.created_at DESC;

COMMENT ON VIEW payment_audit_trail IS 
  'Complete audit trail for all payment changes';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: Create helper functions for common audit scenarios
-- ═══════════════════════════════════════════════════════════════════════════════

-- Log enquiry status change
CREATE OR REPLACE FUNCTION log_enquiry_status_change(
  p_enquiry_id UUID,
  p_old_status TEXT,
  p_new_status TEXT,
  p_user_id UUID,
  p_change_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  SELECT log_audit_event(
    p_user_id,
    'ENQUIRY_STATUS_CHANGED',
    'enquiries',
    p_enquiry_id,
    jsonb_build_object('status', p_old_status),
    jsonb_build_object('status', p_new_status),
    NULL, -- ip_address
    NULL, -- user_agent
    jsonb_build_object('change_reason', p_change_reason)
  ) INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_enquiry_status_change IS 
  'Convenience function to log enquiry status changes with reason';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: Create audit summary report function
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_audit_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  action_type TEXT,
  event_count BIGINT,
  unique_users BIGINT,
  last_event TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    COUNT(*) as event_count,
    COUNT(DISTINCT al.user_id) as unique_users,
    MAX(al.created_at) as last_event
  FROM audit_logs al
  WHERE al.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY al.action
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_audit_summary IS 
  'Generate audit activity summary for a date range. Default: last 30 days.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: Verification and testing
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  test_audit_id UUID;
  audit_count INT;
  action_record RECORD;
BEGIN
  RAISE NOTICE '=== Audit System Verification ===';
  
  -- Test the log_audit_event function
  SELECT log_audit_event(
    NULL, -- user_id (system action)
    'SYSTEM_TEST',
    'test_table',
    gen_random_uuid(),
    NULL,
    jsonb_build_object('test', 'data'),
    '127.0.0.1',
    'Migration Script',
    jsonb_build_object('test_run', true)
  ) INTO test_audit_id;
  
  RAISE NOTICE 'Test audit event created: %', test_audit_id;
  
  -- Count total audit events
  SELECT COUNT(*) INTO audit_count FROM audit_logs;
  RAISE NOTICE 'Total audit events in database: %', audit_count;
  
  -- Show recent actions
  RAISE NOTICE 'Recent audit actions:';
  FOR action_record IN 
    SELECT DISTINCT action FROM audit_logs ORDER BY action LIMIT 10
  LOOP
    RAISE NOTICE '  - %', action_record.action;
  END LOOP;
  
  RAISE NOTICE 'Audit system ready for use';
END $$;
