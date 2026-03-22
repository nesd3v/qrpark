
-- Support conversations table
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can create their own conversations
CREATE POLICY "Users can create own conversations"
ON public.support_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS: Users can view their own conversations
CREATE POLICY "Users can view own conversations"
ON public.support_conversations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON public.support_conversations FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS: Users can insert messages in their own conversations
CREATE POLICY "Users can insert messages"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- RLS: Users can view messages in their own conversations
CREATE POLICY "Users can view messages"
ON public.support_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
