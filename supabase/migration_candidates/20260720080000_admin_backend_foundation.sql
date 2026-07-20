-- Migration: ADMIN-2 Backend Foundation
-- Descrição: Tabelas base para suportar a infraestrutura B2B (Admin)
-- Não contém permissão pública de escrita, e respeita a RLS rigorosamente.

-- =========================================================================
-- 1. CONFIGURAÇÕES GLOBAIS DO SISTEMA E ENGINE (Bloco 1)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- 'engine_rules', 'ia_concierge', 'feature_flags'
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  environment text DEFAULT 'production' NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_read_public" ON public.system_settings;
CREATE POLICY "system_settings_read_public" ON public.system_settings
  FOR SELECT TO authenticated, anon USING (is_public = true);

DROP POLICY IF EXISTS "system_settings_read_admin" ON public.system_settings;
CREATE POLICY "system_settings_read_admin" ON public.system_settings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "system_settings_write_admin" ON public.system_settings;
CREATE POLICY "system_settings_write_admin" ON public.system_settings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- =========================================================================
-- 2. PARCEIROS E AFILIADOS (Bloco 2)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- 'ota', 'direct', 'affiliate_network'
  status text DEFAULT 'active' NOT NULL,
  contact_info jsonb,
  domain text,
  logo_url text,
  notes text,
  started_at date,
  external_reference text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL, -- 'getyourguide', 'civitatis', 'booking'
  identifier text NOT NULL, -- partner_id da OTA
  base_url text,
  commission_model text DEFAULT 'percentage', -- 'percentage', 'fixed'
  commission_value numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  markup numeric(10, 2) DEFAULT 0.00,
  status text DEFAULT 'active',
  valid_until timestamp with time zone,
  tracking_parameters jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid REFERENCES public.experiences(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  original_url text NOT NULL,
  affiliate_url text NOT NULL,
  status text DEFAULT 'active',
  priority integer DEFAULT 1,
  data_source text DEFAULT 'manual',
  last_validated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/escrever contratos e afiliados B2B. O consumer lê via edge function ou RLS restrito.
DROP POLICY IF EXISTS "partners_read_admin" ON public.partners;
CREATE POLICY "partners_read_admin" ON public.partners FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "partners_write_admin" ON public.partners;
CREATE POLICY "partners_write_admin" ON public.partners FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "affiliate_programs_read_admin" ON public.affiliate_programs;
CREATE POLICY "affiliate_programs_read_admin" ON public.affiliate_programs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "affiliate_programs_write_admin" ON public.affiliate_programs;
CREATE POLICY "affiliate_programs_write_admin" ON public.affiliate_programs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
-- Link é público para montar roteiros
DROP POLICY IF EXISTS "affiliate_links_read_all" ON public.affiliate_links;
CREATE POLICY "affiliate_links_read_all" ON public.affiliate_links FOR SELECT TO authenticated, anon USING (status = 'active');
DROP POLICY IF EXISTS "affiliate_links_write_admin" ON public.affiliate_links;
CREATE POLICY "affiliate_links_write_admin" ON public.affiliate_links FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- =========================================================================
-- 3. PERFIS B2C (Bloco 5)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  last_name text,
  avatar_url text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_self" ON public.profiles;
CREATE POLICY "profiles_read_self" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_read_admin" ON public.profiles;
CREATE POLICY "profiles_read_admin" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- =========================================================================
-- 4. VENDAS, PEDIDOS E RECEITA (Bloco 3)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable para checkout guest
  total_gross numeric(10, 2) NOT NULL,
  total_discount numeric(10, 2) DEFAULT 0.00,
  total_net numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'refunded'
  idempotency_key text UNIQUE,
  origin text, -- 'web', 'app', 'referral'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  experience_id uuid REFERENCES public.experiences(id) ON DELETE SET NULL,
  affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  gross_price numeric(10, 2) NOT NULL,
  commission_expected numeric(10, 2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL, -- 'stripe', 'mercadopago'
  external_transaction_id text UNIQUE,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  provider_fee numeric(10, 2) DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admins leem tudo
DROP POLICY IF EXISTS "orders_read_admin" ON public.orders;
CREATE POLICY "orders_read_admin" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "order_items_read_admin" ON public.order_items;
CREATE POLICY "order_items_read_admin" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "payments_read_admin" ON public.payments;
CREATE POLICY "payments_read_admin" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
-- Consumers leem o proprio
DROP POLICY IF EXISTS "orders_read_self" ON public.orders;
CREATE POLICY "orders_read_self" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- 5. ANALYTICS E TRACKING (Bloco 4)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  anonymous_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text,
  properties jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL, -- 'web', 'ios', 'android'
  environment text DEFAULT 'production',
  schema_version integer DEFAULT 1,
  occurred_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Escrita de eventos B2C ocorrerá via Edge Function para evitar SPAM anônimo.
-- O Admin tem acesso total via RLS.
DROP POLICY IF EXISTS "analytics_read_admin" ON public.analytics_events;
CREATE POLICY "analytics_read_admin" ON public.analytics_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
