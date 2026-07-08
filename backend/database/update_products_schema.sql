-- Update products table to add missing columns for categories, subcategories, and additional product details
-- Run this script in your MySQL database

-- Note: If columns already exist, you may see errors. That's okay - just means they're already added.

-- Add category_id column (if not exists)
ALTER TABLE products ADD COLUMN category_id INT NULL AFTER category;

-- Add subcategory_id column (if not exists)
ALTER TABLE products ADD COLUMN subcategory_id INT NULL AFTER category_id;

-- Add sub_subcategory_id column (if not exists)
ALTER TABLE products ADD COLUMN sub_subcategory_id INT NULL AFTER subcategory_id;

-- Add gender column (if not exists)
ALTER TABLE products ADD COLUMN gender VARCHAR(20) NULL AFTER age_range;

-- Add highlights column (if not exists)
ALTER TABLE products ADD COLUMN highlights TEXT NULL AFTER gender;

-- Add specifications column (if not exists)
ALTER TABLE products ADD COLUMN specifications TEXT NULL AFTER highlights;

-- Add product_details column (if not exists)
ALTER TABLE products ADD COLUMN product_details TEXT NULL AFTER specifications;

-- Add additional_details column (if not exists)
ALTER TABLE products ADD COLUMN additional_details TEXT NULL AFTER product_details;

-- Add indexes for better query performance
CREATE INDEX idx_category_id ON products(category_id);
CREATE INDEX idx_subcategory_id ON products(subcategory_id);

-- Note: After running this, existing products will have NULL values for these new columns
-- You may want to populate them based on your existing data or leave them NULL for new products only

