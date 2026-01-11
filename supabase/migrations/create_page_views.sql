-- Rode este SQL no Supabase Dashboard > SQL Editor de cada projeto
-- (RevalidaFlow, CardFlowBR, DeepEyes)

-- Tabela de pageviews
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

-- Habilitar RLS (Row Level Security)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT de qualquer um (anônimo)
CREATE POLICY "Allow anonymous inserts" ON page_views
    FOR INSERT TO anon
    WITH CHECK (true);

-- Política para permitir SELECT apenas via service_role (Edge Functions)
CREATE POLICY "Allow service role select" ON page_views
    FOR SELECT TO service_role
    USING (true);
