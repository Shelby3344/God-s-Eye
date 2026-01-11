// Edge Function para retornar estatísticas do projeto
// Inclui: usuários + pageviews

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // ========== USUÁRIOS ==========
    let userStats = { total: 0, active: 0, new: 0 }
    
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      
      if (!error && users) {
        userStats.total = users.length
        userStats.active = users.filter(u => 
          u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
        ).length
        userStats.new = users.filter(u => 
          u.created_at && new Date(u.created_at) > sevenDaysAgo
        ).length
      }
    } catch (e) {
      console.error('Error fetching users:', e)
    }

    // ========== PAGEVIEWS ==========
    let pageviewStats = { total: 0, today: 0, week: 0, month: 0, uniqueVisitors: 0 }
    
    try {
      // Total de pageviews
      const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
      
      pageviewStats.total = totalViews || 0

      // Pageviews hoje
      const { count: todayViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString())
      
      pageviewStats.today = todayViews || 0

      // Pageviews últimos 7 dias
      const { count: weekViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
      
      pageviewStats.week = weekViews || 0

      // Pageviews últimos 30 dias
      const { count: monthViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      pageviewStats.month = monthViews || 0

      // Visitantes únicos (baseado em user_agent nos últimos 30 dias)
      const { data: uniqueData } = await supabase
        .from('page_views')
        .select('user_agent')
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (uniqueData) {
        const uniqueAgents = new Set(uniqueData.map(d => d.user_agent))
        pageviewStats.uniqueVisitors = uniqueAgents.size
      }

    } catch (e) {
      console.error('Error fetching pageviews:', e)
    }

    return new Response(
      JSON.stringify({
        // Usuários
        total: userStats.total,
        active: userStats.active,
        new: userStats.new,
        // Pageviews
        pageviews: pageviewStats.total,
        pageviewsToday: pageviewStats.today,
        pageviewsWeek: pageviewStats.week,
        pageviewsMonth: pageviewStats.month,
        visitors: pageviewStats.uniqueVisitors,
        // Meta
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
