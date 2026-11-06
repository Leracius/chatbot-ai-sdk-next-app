BEGIN;
-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS PARA ASISTENTE DE VENTAS (WEB + WHATSAPP)
-- Copia y pega este contenido en el "SQL Editor" de tu proyecto en Supabase
-- ==============================================================================

-- 1. Tabla de Conversaciones (Identifica a cada usuario por teléfono o sesión)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,               -- Número de WhatsApp (ej: 54911...@s.whatsapp.net) o ID de sesión web
    channel TEXT NOT NULL DEFAULT 'whatsapp',      -- 'whatsapp' o 'web'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Preserve existing session history while separating channels.
UPDATE public.conversations SET session_id=channel || ':' || session_id
WHERE session_id NOT LIKE channel || ':%';

-- Índice para búsquedas ultra rápidas por session_id (teléfono)
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations (session_id);

-- 2. Tabla de Mensajes (Historial conversacional)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para consultar rápidamente los mensajes de una conversación ordenados por fecha
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id, created_at ASC);

-- 3. Trigger para actualizar automáticamente 'updated_at' en la conversación cuando hay nuevo mensaje
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS tr_update_conversation_timestamp ON public.messages;
CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Backend-only access: browser roles have no grants and no policies.
DROP POLICY IF EXISTS "Permitir acceso completo a backend" ON public.conversations;
DROP POLICY IF EXISTS "Permitir acceso completo a backend mensajes" ON public.messages;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS handoff boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.products (
 sku text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '',
 price numeric(12,2) NOT NULL CHECK(price>=0), currency text NOT NULL DEFAULT 'ARS',
 stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid UNIQUE NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','won','lost')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.webhook_events (
 id text PRIMARY KEY, sender text NOT NULL, status text NOT NULL CHECK(status IN ('processing','sending','sent','paused','review')),
 reply text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.rate_limits (
 key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL
);
CREATE OR REPLACE FUNCTION public.consume_rate_limit(bucket_key text, maximum integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE hits integer;
BEGIN
 INSERT INTO public.rate_limits AS r(key,window_start,count) VALUES(bucket_key,date_trunc('minute',now()),1)
 ON CONFLICT(key) DO UPDATE SET
 count=CASE WHEN r.window_start=date_trunc('minute',now()) THEN r.count+1 ELSE 1 END,
 window_start=date_trunc('minute',now()) RETURNING count INTO hits;
 RETURN hits<=maximum;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text,integer) TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversations,public.messages,public.products,public.leads,public.webhook_events,public.rate_limits FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.conversations,public.messages,public.products,public.leads,public.webhook_events,public.rate_limits TO service_role;

-- Short exclusive leases serialize turns across web workers (not an in-memory mutex).
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS lock_token uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS locked_until timestamptz;
CREATE OR REPLACE FUNCTION public.claim_conversation(target uuid, token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 UPDATE public.conversations SET lock_token=token,locked_until=now()+interval '90 seconds'
 WHERE id=target AND (locked_until IS NULL OR locked_until<now());
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_conversation(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_conversation(uuid,uuid) TO service_role;

COMMIT;
