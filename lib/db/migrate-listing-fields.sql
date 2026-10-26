ALTER TABLE properties ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude real;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude real;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pets_allowed boolean NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video text;
