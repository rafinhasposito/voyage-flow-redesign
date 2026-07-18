-- Migration to add policies and accessibility fields to experiences table

ALTER TABLE public.experiences
ADD COLUMN min_age integer null,
ADD COLUMN adult_only boolean null,
ADD COLUMN family_with_children_allowed boolean null,
ADD COLUMN requires_companion boolean null,
ADD COLUMN minimum_group_size integer null,
ADD COLUMN maximum_group_size integer null,
ADD COLUMN wheelchair_accessible boolean null,
ADD COLUMN stairs_required boolean null,
ADD COLUMN accessibility_notes text null,
ADD COLUMN restrictions_provenance jsonb null;

-- Add check constraints with named identifiers for safer maintenance
ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_min_age_positive
CHECK (min_age >= 0);

ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_min_group_size
CHECK (minimum_group_size >= 1);

ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_max_group_size
CHECK (maximum_group_size >= 1);

ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_group_size_logic
CHECK (
  (maximum_group_size IS NULL OR minimum_group_size IS NULL)
  OR (maximum_group_size >= minimum_group_size)
);

ALTER TABLE public.experiences
ADD CONSTRAINT chk_experiences_restrictions_provenance_object
CHECK (
  restrictions_provenance IS NULL
  OR jsonb_typeof(restrictions_provenance) = 'object'
);
