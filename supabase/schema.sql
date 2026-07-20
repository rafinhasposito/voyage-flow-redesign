-- Create Enum Types
CREATE TYPE experience_status AS ENUM ('draft', 'published', 'archived');

-- Create Destinations table
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    currency TEXT NOT NULL,
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Personas table
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Experiences table
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    partner_id UUID, -- For future implementation
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    category TEXT NOT NULL,
    base_cost NUMERIC(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    location_lat NUMERIC,
    location_lng NUMERIC,
    address TEXT,
    neighborhood TEXT,
    booking_url TEXT,
    energy_level TEXT,
    indoor_outdoor TEXT,
    weather_suitability TEXT,
    media_urls TEXT[] DEFAULT '{}',
    status experience_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Experience-Tags junction table
CREATE TABLE experience_tags (
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (experience_id, tag_id)
);

-- Create Experience-Personas junction table
CREATE TABLE experience_personas (
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    PRIMARY KEY (experience_id, persona_id)
);

-- Create Engine Configs table
CREATE TABLE engine_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to experiences
CREATE TRIGGER update_experiences_modtime
    BEFORE UPDATE ON experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Attach trigger to engine_configs
CREATE TRIGGER update_engine_configs_modtime
    BEFORE UPDATE ON engine_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
