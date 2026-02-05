-- FamilyForge: add plan_code to parents table

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS plan_code text DEFAULT 'free';
