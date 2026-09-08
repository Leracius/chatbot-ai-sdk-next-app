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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_conversation_timestamp ON public.messages;
CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- 4. Habilitar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para permitir al servicio backend leer y escribir con Service Role o Anon Key
CREATE POLICY "Permitir acceso completo a backend" ON public.conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a backend mensajes" ON public.messages
    FOR ALL USING (true) WITH CHECK (true);
