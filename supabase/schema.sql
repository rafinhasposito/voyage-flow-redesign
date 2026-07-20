


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."experience_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."experience_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE public.admin_users.user_id = auth.uid()
      AND public.admin_users.is_active = true
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Verifica se o usuário autenticado atual possui o papel administrativo. Retorna TRUE somente se auth.uid() estiver em public.admin_users com is_active = true. SECURITY DEFINER com search_path vazio: necessário para bypassar o RLS de admin_users sem criar recursão. Não aceita parâmetros externos. Não consulta user_metadata. Usar em policies RLS como: USING (public.is_admin()) TO authenticated.';



CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trip_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trip_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Registra os usuários com papel administrativo no Voyage Flow MVP. A presença ativa nesta tabela (is_active = true) é a única fonte de verdade sobre o papel de admin. Nenhuma credencial, senha ou e-mail é armazenado aqui. O primeiro administrador deve ser inserido manualmente via Supabase SQL Editor após criação do usuário em auth.users pelo painel de Authentication. RLS HABILITADO SEM POLICIES: toda operação via API (anon/authenticated) é bloqueada por padrão. Administração somente pelo SQL Editor (superuser).';



COMMENT ON COLUMN "public"."admin_users"."user_id" IS 'UUID do usuário em auth.users. Referência com CASCADE.';



COMMENT ON COLUMN "public"."admin_users"."created_at" IS 'Timestamp de quando o registro foi criado.';



COMMENT ON COLUMN "public"."admin_users"."created_by" IS 'UUID do admin que promoveu este usuário. NULL no bootstrap.';



COMMENT ON COLUMN "public"."admin_users"."is_active" IS 'Somente TRUE concede privilégios administrativos via is_admin().';



COMMENT ON COLUMN "public"."admin_users"."notes" IS 'Campo livre para anotações operacionais. Não afeta permissões.';



CREATE TABLE IF NOT EXISTS "public"."destinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description_short" "text",
    "country" "text" NOT NULL,
    "timezone" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "language" "text" DEFAULT 'en'::"text",
    "cover_image_url" "text",
    "location_lat" numeric,
    "location_lng" numeric,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "country_code" "text",
    CONSTRAINT "chk_destinations_country_code_format" CHECK ((("country_code" IS NULL) OR ("country_code" ~ '^[A-Z]{2}$'::"text")))
);


ALTER TABLE "public"."destinations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engine_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "weights" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."engine_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experience_personas" (
    "experience_id" "uuid" NOT NULL,
    "persona_id" "uuid" NOT NULL
);


ALTER TABLE "public"."experience_personas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experience_tags" (
    "experience_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."experience_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experiences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "destination_id" "uuid" NOT NULL,
    "partner_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "base_cost" numeric(10,2) NOT NULL,
    "duration_minutes" integer,
    "location_lat" numeric,
    "location_lng" numeric,
    "address" "text",
    "neighborhood" "text",
    "booking_url" "text",
    "video_embed_url" "text",
    "exclusivity_level" "text",
    "reservation_required" boolean DEFAULT false,
    "dress_code" "text",
    "energy_level" "text",
    "indoor_outdoor" "text",
    "weather_suitability" "text",
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "personas" "text"[] DEFAULT '{}'::"text"[],
    "climate" "text"[] DEFAULT '{}'::"text"[],
    "ideal_companion" "text"[] DEFAULT '{}'::"text"[],
    "status" "public"."experience_status" DEFAULT 'draft'::"public"."experience_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_must_see" boolean DEFAULT false,
    "rating" numeric(3,1),
    "reviews_count" integer,
    "type" "text" DEFAULT 'attraction'::"text",
    "check_in_time" time without time zone,
    "check_out_time" time without time zone,
    "intelligence_metadata" "jsonb",
    "min_duration_minutes" integer,
    "ideal_duration_minutes" integer,
    "max_duration_minutes" integer,
    "buffer_before_minutes" integer,
    "buffer_after_minutes" integer,
    "typical_queue_minutes" integer,
    "booking_deadline_hours" integer,
    "booking_time_mode" "text",
    "meal_periods" "text"[],
    "source_url" "text",
    "verified_at" timestamp with time zone,
    "min_age" integer,
    "adult_only" boolean,
    "family_with_children_allowed" boolean,
    "requires_companion" boolean,
    "minimum_group_size" integer,
    "maximum_group_size" integer,
    "wheelchair_accessible" boolean,
    "stairs_required" boolean,
    "accessibility_notes" "text",
    "restrictions_provenance" "jsonb",
    CONSTRAINT "chk_experiences_booking_time_mode" CHECK ((("booking_time_mode" IS NULL) OR ("booking_time_mode" = ANY (ARRAY['open'::"text", 'time_window'::"text", 'fixed_time'::"text", 'scheduled_session'::"text", 'walk_in'::"text"])))),
    CONSTRAINT "chk_experiences_duration_logic" CHECK (((("min_duration_minutes" IS NULL) OR ("ideal_duration_minutes" IS NULL) OR ("min_duration_minutes" <= "ideal_duration_minutes")) AND (("ideal_duration_minutes" IS NULL) OR ("max_duration_minutes" IS NULL) OR ("ideal_duration_minutes" <= "max_duration_minutes")) AND (("min_duration_minutes" IS NULL) OR ("max_duration_minutes" IS NULL) OR ("min_duration_minutes" <= "max_duration_minutes")))),
    CONSTRAINT "chk_experiences_duration_positive" CHECK (((("min_duration_minutes" IS NULL) OR ("min_duration_minutes" >= 0)) AND (("ideal_duration_minutes" IS NULL) OR ("ideal_duration_minutes" >= 0)) AND (("max_duration_minutes" IS NULL) OR ("max_duration_minutes" >= 0)) AND (("buffer_before_minutes" IS NULL) OR ("buffer_before_minutes" >= 0)) AND (("buffer_after_minutes" IS NULL) OR ("buffer_after_minutes" >= 0)) AND (("typical_queue_minutes" IS NULL) OR ("typical_queue_minutes" >= 0)) AND (("booking_deadline_hours" IS NULL) OR ("booking_deadline_hours" >= 0)))),
    CONSTRAINT "chk_experiences_group_size_logic" CHECK ((("maximum_group_size" IS NULL) OR ("minimum_group_size" IS NULL) OR ("maximum_group_size" >= "minimum_group_size"))),
    CONSTRAINT "chk_experiences_intelligence_metadata_is_object" CHECK ((("intelligence_metadata" IS NULL) OR ("jsonb_typeof"("intelligence_metadata") = 'object'::"text"))),
    CONSTRAINT "chk_experiences_max_group_size" CHECK (("maximum_group_size" >= 1)),
    CONSTRAINT "chk_experiences_meal_periods" CHECK ((("meal_periods" IS NULL) OR ("meal_periods" <@ ARRAY['breakfast'::"text", 'brunch'::"text", 'lunch'::"text", 'afternoon_tea'::"text", 'snack'::"text", 'dinner'::"text", 'late_night'::"text"]))),
    CONSTRAINT "chk_experiences_min_age_positive" CHECK (("min_age" >= 0)),
    CONSTRAINT "chk_experiences_min_group_size" CHECK (("minimum_group_size" >= 1)),
    CONSTRAINT "chk_experiences_restrictions_provenance_object" CHECK ((("restrictions_provenance" IS NULL) OR ("jsonb_typeof"("restrictions_provenance") = 'object'::"text")))
);


ALTER TABLE "public"."experiences" OWNER TO "postgres";


COMMENT ON COLUMN "public"."experiences"."intelligence_metadata" IS 'Armazena metadados estruturados de inteligência. short_description permanece reservado ao texto editorial legado.';



CREATE TABLE IF NOT EXISTS "public"."itinerary_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "day_number" integer NOT NULL,
    "date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."itinerary_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operating_hour_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "experience_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "period_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "opens_at" time without time zone,
    "closes_at" time without time zone,
    "last_entry_at" time without time zone,
    "is_24_hours" boolean DEFAULT false NOT NULL,
    "spans_next_day" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "reason" "text",
    "source_url" "text",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_exceptions_24_hours" CHECK ((("is_24_hours" = false) OR (("opens_at" IS NULL) AND ("closes_at" IS NULL) AND ("last_entry_at" IS NULL) AND ("spans_next_day" = false)))),
    CONSTRAINT "chk_exceptions_closed_no_times" CHECK ((("status" <> 'closed'::"text") OR (("opens_at" IS NULL) AND ("closes_at" IS NULL) AND ("last_entry_at" IS NULL) AND ("is_24_hours" = false) AND ("spans_next_day" = false)))),
    CONSTRAINT "chk_exceptions_dates" CHECK (("start_date" <= "end_date")),
    CONSTRAINT "chk_exceptions_last_entry" CHECK ((("last_entry_at" IS NULL) OR ("status" <> 'closed'::"text"))),
    CONSTRAINT "chk_exceptions_modified_requires_times" CHECK ((("status" = 'closed'::"text") OR ("is_24_hours" = true) OR (("opens_at" IS NOT NULL) AND ("closes_at" IS NOT NULL)))),
    CONSTRAINT "chk_exceptions_period_type" CHECK (("period_type" = ANY (ARRAY['general'::"text", 'kitchen'::"text", 'service'::"text"]))),
    CONSTRAINT "chk_exceptions_sort_order" CHECK (("sort_order" >= 0)),
    CONSTRAINT "chk_exceptions_spans_next_day" CHECK ((("spans_next_day" = false) OR (("status" <> 'closed'::"text") AND ("is_24_hours" = false) AND ("opens_at" IS NOT NULL) AND ("closes_at" IS NOT NULL)))),
    CONSTRAINT "chk_exceptions_status" CHECK (("status" = ANY (ARRAY['closed'::"text", 'modified_hours'::"text", 'special_opening'::"text"])))
);


ALTER TABLE "public"."operating_hour_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operating_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "experience_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "period_type" "text" NOT NULL,
    "opens_at" time without time zone,
    "closes_at" time without time zone,
    "last_entry_at" time without time zone,
    "is_closed" boolean DEFAULT false NOT NULL,
    "is_24_hours" boolean DEFAULT false NOT NULL,
    "spans_next_day" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "valid_from" "date",
    "valid_to" "date",
    "source_url" "text",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_operating_hours_24_no_times" CHECK ((("is_24_hours" = false) OR (("opens_at" IS NULL) AND ("closes_at" IS NULL) AND ("last_entry_at" IS NULL) AND ("spans_next_day" = false)))),
    CONSTRAINT "chk_operating_hours_closed_no_times" CHECK ((("is_closed" = false) OR (("opens_at" IS NULL) AND ("closes_at" IS NULL) AND ("last_entry_at" IS NULL) AND ("spans_next_day" = false)))),
    CONSTRAINT "chk_operating_hours_day_of_week" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "chk_operating_hours_is_closed_is_24_hours" CHECK ((NOT (("is_closed" = true) AND ("is_24_hours" = true)))),
    CONSTRAINT "chk_operating_hours_last_entry_not_closed" CHECK ((("last_entry_at" IS NULL) OR ("is_closed" = false))),
    CONSTRAINT "chk_operating_hours_normal_requires_times" CHECK ((("is_closed" = true) OR ("is_24_hours" = true) OR (("opens_at" IS NOT NULL) AND ("closes_at" IS NOT NULL)))),
    CONSTRAINT "chk_operating_hours_period_type" CHECK (("period_type" = ANY (ARRAY['general'::"text", 'kitchen'::"text", 'service'::"text"]))),
    CONSTRAINT "chk_operating_hours_sort_order" CHECK (("sort_order" >= 0)),
    CONSTRAINT "chk_operating_hours_spans_next_day" CHECK ((("spans_next_day" = false) OR (("is_closed" = false) AND ("is_24_hours" = false) AND ("opens_at" IS NOT NULL) AND ("closes_at" IS NOT NULL)))),
    CONSTRAINT "chk_operating_hours_validity" CHECK ((("valid_from" IS NULL) OR ("valid_to" IS NULL) OR ("valid_from" <= "valid_to")))
);


ALTER TABLE "public"."operating_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "avatar_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transit_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "destination_id" "uuid" NOT NULL,
    "origin_experience_id" "uuid",
    "destination_experience_id" "uuid",
    "origin_zone" "text",
    "destination_zone" "text",
    "title" "text" NOT NULL,
    "modality" "text" NOT NULL,
    "description" "text",
    "duration_min_minutes" integer,
    "duration_avg_minutes" integer,
    "duration_max_minutes" integer,
    "price_min" numeric,
    "price_max" numeric,
    "currency" "text",
    "frequency_minutes" integer,
    "operation_notes" "text",
    "transfers_required" integer DEFAULT 0 NOT NULL,
    "luggage_suitability" "text",
    "accessibility" "text"[],
    "booking_required" boolean DEFAULT false NOT NULL,
    "booking_url" "text",
    "instructions" "text",
    "source_url" "text",
    "verified_at" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_transit_accessibility" CHECK ((("accessibility" IS NULL) OR ("accessibility" <@ ARRAY['wheelchair'::"text", 'stroller'::"text", 'step_free'::"text", 'elevator'::"text", 'assistance_available'::"text"]))),
    CONSTRAINT "chk_transit_currency_format" CHECK ((("currency" IS NULL) OR ("currency" ~ '^[A-Z]{3}$'::"text"))),
    CONSTRAINT "chk_transit_different_endpoints" CHECK ((("origin_experience_id" IS NULL) OR ("destination_experience_id" IS NULL) OR ("origin_experience_id" <> "destination_experience_id"))),
    CONSTRAINT "chk_transit_durations_logic" CHECK (((("duration_min_minutes" IS NULL) OR ("duration_avg_minutes" IS NULL) OR ("duration_min_minutes" <= "duration_avg_minutes")) AND (("duration_avg_minutes" IS NULL) OR ("duration_max_minutes" IS NULL) OR ("duration_avg_minutes" <= "duration_max_minutes")) AND (("duration_min_minutes" IS NULL) OR ("duration_max_minutes" IS NULL) OR ("duration_min_minutes" <= "duration_max_minutes")))),
    CONSTRAINT "chk_transit_durations_positive" CHECK (((("duration_min_minutes" IS NULL) OR ("duration_min_minutes" >= 0)) AND (("duration_avg_minutes" IS NULL) OR ("duration_avg_minutes" >= 0)) AND (("duration_max_minutes" IS NULL) OR ("duration_max_minutes" >= 0)))),
    CONSTRAINT "chk_transit_frequency" CHECK ((("frequency_minutes" IS NULL) OR ("frequency_minutes" > 0))),
    CONSTRAINT "chk_transit_luggage" CHECK ((("luggage_suitability" IS NULL) OR ("luggage_suitability" = ANY (ARRAY['poor'::"text", 'limited'::"text", 'suitable'::"text", 'excellent'::"text"])))),
    CONSTRAINT "chk_transit_modality" CHECK (("modality" = ANY (ARRAY['walking'::"text", 'subway'::"text", 'train'::"text", 'bus'::"text", 'ferry'::"text", 'taxi'::"text", 'rideshare'::"text", 'private_transfer'::"text", 'shuttle'::"text", 'rental_car'::"text", 'mixed'::"text"]))),
    CONSTRAINT "chk_transit_prices_logic" CHECK ((("price_min" IS NULL) OR ("price_max" IS NULL) OR ("price_min" <= "price_max"))),
    CONSTRAINT "chk_transit_prices_positive" CHECK (((("price_min" IS NULL) OR ("price_min" >= (0)::numeric)) AND (("price_max" IS NULL) OR ("price_max" >= (0)::numeric)))),
    CONSTRAINT "chk_transit_requires_destination" CHECK ((("destination_experience_id" IS NOT NULL) OR (("destination_zone" IS NOT NULL) AND (TRIM(BOTH FROM "destination_zone") <> ''::"text")))),
    CONSTRAINT "chk_transit_requires_origin" CHECK ((("origin_experience_id" IS NOT NULL) OR (("origin_zone" IS NOT NULL) AND (TRIM(BOTH FROM "origin_zone") <> ''::"text")))),
    CONSTRAINT "chk_transit_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "chk_transit_transfers" CHECK (("transfers_required" >= 0)),
    CONSTRAINT "chk_transit_zone_destination_not_empty" CHECK ((("destination_zone" IS NULL) OR (TRIM(BOTH FROM "destination_zone") <> ''::"text"))),
    CONSTRAINT "chk_transit_zone_origin_not_empty" CHECK ((("origin_zone" IS NULL) OR (TRIM(BOTH FROM "origin_zone") <> ''::"text")))
);


ALTER TABLE "public"."transit_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_experiences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_id" "uuid" NOT NULL,
    "experience_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "is_fixed_appointment" boolean DEFAULT false,
    "reservation_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_experiences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "hotel_name" "text",
    "hotel_lat" double precision,
    "hotel_lng" double precision,
    "companionship" "text",
    "pace" "text",
    "budget_level" "text",
    "status" "text" DEFAULT 'planning'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


ALTER TABLE ONLY "public"."destinations"
    ADD CONSTRAINT "destinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."destinations"
    ADD CONSTRAINT "destinations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."engine_configs"
    ADD CONSTRAINT "engine_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experience_personas"
    ADD CONSTRAINT "experience_personas_pkey" PRIMARY KEY ("experience_id", "persona_id");



ALTER TABLE ONLY "public"."experience_tags"
    ADD CONSTRAINT "experience_tags_pkey" PRIMARY KEY ("experience_id", "tag_id");



ALTER TABLE ONLY "public"."experiences"
    ADD CONSTRAINT "experiences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itinerary_days"
    ADD CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."itinerary_days"
    ADD CONSTRAINT "itinerary_days_trip_id_day_number_key" UNIQUE ("trip_id", "day_number");



ALTER TABLE ONLY "public"."operating_hour_exceptions"
    ADD CONSTRAINT "operating_hour_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operating_hours"
    ADD CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "pk_admin_users" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transit_options"
    ADD CONSTRAINT "transit_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_experiences"
    ADD CONSTRAINT "trip_experiences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_exceptions_dates" ON "public"."operating_hour_exceptions" USING "btree" ("experience_id", "start_date", "end_date");



CREATE INDEX "idx_exceptions_experience_id" ON "public"."operating_hour_exceptions" USING "btree" ("experience_id");



CREATE INDEX "idx_exceptions_status" ON "public"."operating_hour_exceptions" USING "btree" ("status");



CREATE INDEX "idx_operating_hours_experience_day" ON "public"."operating_hours" USING "btree" ("experience_id", "day_of_week");



CREATE INDEX "idx_operating_hours_experience_id" ON "public"."operating_hours" USING "btree" ("experience_id");



CREATE INDEX "idx_operating_hours_validity" ON "public"."operating_hours" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_transit_options_dest_exp" ON "public"."transit_options" USING "btree" ("destination_experience_id");



CREATE INDEX "idx_transit_options_destination" ON "public"."transit_options" USING "btree" ("destination_id");



CREATE INDEX "idx_transit_options_origin_exp" ON "public"."transit_options" USING "btree" ("origin_experience_id");



CREATE OR REPLACE TRIGGER "update_engine_configs_modtime" BEFORE UPDATE ON "public"."engine_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_experiences_modtime" BEFORE UPDATE ON "public"."experiences" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_operating_hour_exceptions_modtime" BEFORE UPDATE ON "public"."operating_hour_exceptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_operating_hours_modtime" BEFORE UPDATE ON "public"."operating_hours" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_transit_options_modtime" BEFORE UPDATE ON "public"."transit_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_trips_timestamp" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."update_trip_updated_at"();



ALTER TABLE ONLY "public"."experience_personas"
    ADD CONSTRAINT "experience_personas_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."experience_tags"
    ADD CONSTRAINT "experience_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."experiences"
    ADD CONSTRAINT "experiences_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "fk_admin_users_created_by" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "fk_admin_users_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."itinerary_days"
    ADD CONSTRAINT "itinerary_days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operating_hour_exceptions"
    ADD CONSTRAINT "operating_hour_exceptions_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operating_hours"
    ADD CONSTRAINT "operating_hours_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transit_options"
    ADD CONSTRAINT "transit_options_destination_experience_id_fkey" FOREIGN KEY ("destination_experience_id") REFERENCES "public"."experiences"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transit_options"
    ADD CONSTRAINT "transit_options_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transit_options"
    ADD CONSTRAINT "transit_options_origin_experience_id_fkey" FOREIGN KEY ("origin_experience_id") REFERENCES "public"."experiences"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trip_experiences"
    ADD CONSTRAINT "trip_experiences_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."itinerary_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_experiences"
    ADD CONSTRAINT "trip_experiences_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own itinerary days" ON "public"."itinerary_days" USING ((EXISTS ( SELECT 1
   FROM "public"."trips"
  WHERE (("trips"."id" = "itinerary_days"."trip_id") AND ("trips"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own trip experiences" ON "public"."trip_experiences" USING ((EXISTS ( SELECT 1
   FROM ("public"."itinerary_days"
     JOIN "public"."trips" ON (("trips"."id" = "itinerary_days"."trip_id")))
  WHERE (("itinerary_days"."id" = "trip_experiences"."day_id") AND ("trips"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own trips" ON "public"."trips" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."destinations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "destinations_insert_admin" ON "public"."destinations" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "destinations_read_admin" ON "public"."destinations" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "destinations_read_public" ON "public"."destinations" FOR SELECT TO "authenticated", "anon" USING (("is_active" IS TRUE));



CREATE POLICY "destinations_update_admin" ON "public"."destinations" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."engine_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experience_personas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experience_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experiences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "experiences_insert_admin" ON "public"."experiences" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "experiences_read_admin" ON "public"."experiences" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "experiences_read_public" ON "public"."experiences" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"public"."experience_status"));



CREATE POLICY "experiences_update_admin" ON "public"."experiences" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."itinerary_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operating_hour_exceptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operating_hours" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_published_operating_hour_exceptions" ON "public"."operating_hour_exceptions" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."experiences"
  WHERE (("experiences"."id" = "operating_hour_exceptions"."experience_id") AND ("experiences"."status" = 'published'::"public"."experience_status")))));



CREATE POLICY "public_read_published_operating_hours" ON "public"."operating_hours" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."experiences"
  WHERE (("experiences"."id" = "operating_hours"."experience_id") AND ("experiences"."status" = 'published'::"public"."experience_status")))));



CREATE POLICY "public_read_published_transit_options" ON "public"."transit_options" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"text"));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transit_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_experiences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trip_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trip_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trip_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."destinations" TO "service_role";
GRANT SELECT ON TABLE "public"."destinations" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."destinations" TO "authenticated";



GRANT ALL ON TABLE "public"."engine_configs" TO "anon";
GRANT ALL ON TABLE "public"."engine_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."engine_configs" TO "service_role";



GRANT ALL ON TABLE "public"."experience_personas" TO "anon";
GRANT ALL ON TABLE "public"."experience_personas" TO "authenticated";
GRANT ALL ON TABLE "public"."experience_personas" TO "service_role";



GRANT ALL ON TABLE "public"."experience_tags" TO "anon";
GRANT ALL ON TABLE "public"."experience_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."experience_tags" TO "service_role";



GRANT ALL ON TABLE "public"."experiences" TO "service_role";
GRANT SELECT ON TABLE "public"."experiences" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."experiences" TO "authenticated";



GRANT ALL ON TABLE "public"."itinerary_days" TO "anon";
GRANT ALL ON TABLE "public"."itinerary_days" TO "authenticated";
GRANT ALL ON TABLE "public"."itinerary_days" TO "service_role";



GRANT ALL ON TABLE "public"."operating_hour_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."operating_hour_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."operating_hour_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."operating_hours" TO "anon";
GRANT ALL ON TABLE "public"."operating_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."operating_hours" TO "service_role";



GRANT ALL ON TABLE "public"."personas" TO "anon";
GRANT ALL ON TABLE "public"."personas" TO "authenticated";
GRANT ALL ON TABLE "public"."personas" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."transit_options" TO "anon";
GRANT ALL ON TABLE "public"."transit_options" TO "authenticated";
GRANT ALL ON TABLE "public"."transit_options" TO "service_role";



GRANT ALL ON TABLE "public"."trip_experiences" TO "anon";
GRANT ALL ON TABLE "public"."trip_experiences" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_experiences" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































