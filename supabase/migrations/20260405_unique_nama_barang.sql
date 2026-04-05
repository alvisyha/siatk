-- Migration script to enforce unique item names in the barang table

-- First, ensure there are no existing duplicates before applying the constraint.
-- You can run a query to identify duplicates and resolve them manually:
-- SELECT nama, COUNT(*) FROM barang GROUP BY nama HAVING COUNT(*) > 1;

-- Add a UNIQUE constraint to the nama column
ALTER TABLE barang ADD CONSTRAINT unique_nama UNIQUE (nama);
