ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS header_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS header_media_url VARCHAR(1000);