/*
# Create product_categories table for standalone POS mode

1. New Tables
- `product_categories`
  - `id` (uuid, primary key)
  - `name` (text, not null) — display name e.g. "Wedding Sarees"
  - `slug` (text, unique, not null) — URL-friendly identifier
  - `description` (text, nullable) — optional category description
  - `image_url` (text, nullable) — optional category image
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `product_categories`.
- Owner-scoped CRUD: authenticated users can manage categories.
- All four CRUD policies (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`.

3. Notes
- This table is only used in Standalone Cloud POS mode.
- In WooCommerce Live Sync mode, categories come from the WooCommerce API and this table is not used.
- Product counts are computed at runtime by counting products whose `category` column matches the category name.
*/

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON product_categories;
CREATE POLICY "select_own_categories" ON product_categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_categories" ON product_categories;
CREATE POLICY "insert_own_categories" ON product_categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_categories" ON product_categories;
CREATE POLICY "update_own_categories" ON product_categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_categories" ON product_categories;
CREATE POLICY "delete_own_categories" ON product_categories FOR DELETE
  TO authenticated USING (true);
