-- This migration captures the current state of the database after db push
-- All changes have already been applied to the database
-- This migration serves as a baseline for future changes

-- Changes applied:
-- 1. Added PropertyStatus enum
-- 2. Removed FollowUpType, FollowUpResult, FollowUpStatus tables
-- 3. Modified FollowUp table to use new simplified structure
-- 4. Modified Person table: birth_date and gender are now nullable
-- 5. Added new fields to Property table:
--    - sale_price DECIMAL
--    - rental_price DECIMAL
--    - status PropertyStatus (default 'sin_estado')
--    - is_president BOOLEAN (default false)
--    - is_informer BOOLEAN (default false)

