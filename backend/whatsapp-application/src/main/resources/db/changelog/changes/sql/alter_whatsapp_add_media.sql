ALTER TABLE whatsapp_messages
    ADD COLUMN media_id  VARCHAR(255) NULL,
    ADD COLUMN mime_type VARCHAR(100) NULL;