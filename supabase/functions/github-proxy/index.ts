// Edge Function para proxy seguro das chamadas GitHub
// O token fica no servidor, nunca exposto no frontend
//
// DEPLOY:
// 1. npx supabase link --project-ref SEU_PROJECT_REF
// 2. npx supabase secrets set GITHUB_TOKEN=ghp_seu_token_aqui
// 3. npx supabase functions deploy github-proxy --no-verify-jwt

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GITHUB_API = 'https://api.github.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    const url = new URL(req.url)
    const endpoint = url.searchParams.get('endpoint')
    
    if (!endpoint) {
      throw new Error('Missing endpoint parameter')
    }

    // Validar que o endpoint é seguro (só permite endpoints do GitHub API)
    if (!endpoint.startsWith('/users/') && 
        !endpoint.startsWith('/repos/') && 
        !endpoint.startsWith('/user/') &&
        !endpoint.startsWith('/user?')) {
      throw new Error('Invalid endpoint')
    }

    const githubResponse = await fetch(`${GITHUB_API}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevDash-App'
      }
    })

    const data = await githubResponse.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: githubResponse.status 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
