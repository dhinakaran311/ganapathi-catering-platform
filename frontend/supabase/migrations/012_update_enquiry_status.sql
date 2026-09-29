-- Migration to fix and standardize enquiry status values

-- 1. Update the enquiries table data
UPDATE enquiries SET status = 'NEW' WHERE status = 'pending';
UPDATE enquiries SET status = 'CONFIRMED' WHERE status = 'confirmed';
UPDATE enquiries SET status = 'CANCELLED' WHERE status = 'cancelled';
UPDATE enquiries SET status = 'COMPLETED' WHERE status = 'completed';

-- 2. Update the enquiry_status_history table data
UPDATE enquiry_status_history SET old_status = 'NEW' WHERE old_status = 'pending';
UPDATE enquiry_status_history SET old_status = 'CONFIRMED' WHERE old_status = 'confirmed';
UPDATE enquiry_status_history SET old_status = 'CANCELLED' WHERE old_status = 'cancelled';
UPDATE enquiry_status_history SET old_status = 'COMPLETED' WHERE old_status = 'completed';

UPDATE enquiry_status_history SET new_status = 'NEW' WHERE new_status = 'pending';
UPDATE enquiry_status_history SET new_status = 'CONFIRMED' WHERE new_status = 'confirmed';
UPDATE enquiry_status_history SET new_status = 'CANCELLED' WHERE new_status = 'cancelled';
UPDATE enquiry_status_history SET new_status = 'COMPLETED' WHERE new_status = 'completed';

-- 3. Add CHECK constraints to prevent invalid statuses in the future
ALTER TABLE enquiries 
  ADD CONSTRAINT enquiries_status_check 
  CHECK (status IN ('NEW', 'CONTACTED', 'DISCUSSION', 'QUOTE_SENT', 'FOLLOW_UP', 'CONFIRMED', 'COMPLETED', 'CANCELLED'));

ALTER TABLE enquiry_status_history 
  ADD CONSTRAINT enquiry_status_history_new_status_check 
  CHECK (new_status IN ('NEW', 'CONTACTED', 'DISCUSSION', 'QUOTE_SENT', 'FOLLOW_UP', 'CONFIRMED', 'COMPLETED', 'CANCELLED'));
