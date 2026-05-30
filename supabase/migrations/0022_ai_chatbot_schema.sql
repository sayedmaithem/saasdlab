-- Create ai_chat_sessions table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    lab_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, lab_id)
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    lab_id UUID NOT NULL,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id, lab_id),
    FOREIGN KEY (session_id, lab_id) REFERENCES ai_chat_sessions(id, lab_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for ai_chat_sessions
CREATE POLICY "Users can view their own chat sessions"
    ON ai_chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON ai_chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON ai_chat_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
    ON ai_chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for ai_chat_messages
CREATE POLICY "Users can view messages of their sessions"
    ON ai_chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.lab_id = ai_chat_messages.lab_id
            AND ai_chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON ai_chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.lab_id = ai_chat_messages.lab_id
            AND ai_chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in their sessions"
    ON ai_chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.lab_id = ai_chat_messages.lab_id
            AND ai_chat_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.lab_id = ai_chat_messages.lab_id
            AND ai_chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their sessions"
    ON ai_chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.lab_id = ai_chat_messages.lab_id
            AND ai_chat_sessions.user_id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp on ai_chat_sessions
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ai_chat_sessions_updated_at ON ai_chat_sessions;
CREATE TRIGGER set_ai_chat_sessions_updated_at
BEFORE UPDATE ON ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_ai_chat_sessions_updated_at();
