
ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS direction VARCHAR(10) NOT NULL DEFAULT 'OUTBOUND';

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS language_code VARCHAR(20);

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS template_params TEXT;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT';

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS agent_read BOOLEAN NOT NULL DEFAULT TRUE;


CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction
    ON whatsapp_messages(direction);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign_id
    ON whatsapp_messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_type
    ON whatsapp_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_agent_read
    ON whatsapp_messages(agent_read);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_message_id
    ON whatsapp_messages(whatsapp_message_id);
