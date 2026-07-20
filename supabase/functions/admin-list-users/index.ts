import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Lista restrita de origens para CORS B2B
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://admin.voyageflow.com' // Exemplo de domínio B2B em produção
]

serve(async (req) => {
  const origin = req.headers.get('Origin') || ''
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
    'Vary': 'Origin'
  }

  // Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Validar Token e obter Usuário do Request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Validar Role B2B na tabela `admin_users` (Não confiar em JWT claims do frontend)
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return new Response(JSON.stringify({ error: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Inicializar Cliente Service Role APENAS na Edge Function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Tratamento de Paginação e Busca Segura
    const url = new URL(req.url)
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10)
    const limitParam = parseInt(url.searchParams.get('limit') || '25', 10)
    let search = url.searchParams.get('search') || ''

    // Sanitizar e Limitar
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam)
    let limit = Math.max(1, isNaN(limitParam) ? 25 : limitParam)
    limit = Math.min(limit, 100) // Teto máximo rígido
    if (search.length > 50) {
      search = search.substring(0, 50) // Truncar busca maliciosa ou longa
    }

    // A busca real usaria filtros na API do Supabase Admin
    // Para fins do contrato, efetuamos a chamada paginada
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit
    })

    if (usersError) throw usersError

    // 5. DTO Estrito e Seguro
    const safeUsers = usersData.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
      // Excluímos explicitamente: app_metadata, user_metadata, identities, phone, hashes, tokens
    }))

    return new Response(JSON.stringify({ users: safeUsers, total: usersData.total }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    // Log interno apenas no servidor para auditoria, sem expor metadados
    console.error(`[admin-list-users] Internal Error: ${error.message || 'Unknown'}`)
    
    // Retorno Genérico para a Web
    return new Response(JSON.stringify({ error: "Não foi possível consultar os usuários." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0] }
    })
  }
})
