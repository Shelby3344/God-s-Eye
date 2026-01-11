# Edge Function: get-stats

Retorna estatísticas de usuários do projeto Supabase de forma segura.

## Deploy

1. Instale o Supabase CLI:
```bash
npm install -g supabase
```

2. Faça login:
```bash
supabase login
```

3. Link com seu projeto:
```bash
supabase link --project-ref SEU_PROJECT_REF
```

4. Deploy da função:
```bash
supabase functions deploy get-stats
```

## Uso

A função estará disponível em:
```
https://SEU_PROJECT_REF.supabase.co/functions/v1/get-stats
```

## Resposta

```json
{
  "total": 150,
  "active": 89,
  "new": 12,
  "timestamp": "2025-01-11T..."
}
```

- `total`: Total de usuários cadastrados
- `active`: Usuários que logaram nos últimos 30 dias
- `new`: Usuários criados nos últimos 7 dias
