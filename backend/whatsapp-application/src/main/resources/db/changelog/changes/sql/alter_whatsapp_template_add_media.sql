ALTER TABLE whatsapp_templates ADD COLUMN header_type VARCHAR(20) NOT NULL DEFAULT 'NONE';
ALTER TABLE whatsapp_templates ADD COLUMN header_media_handle VARCHAR(512);
ALTER TABLE whatsapp_templates ADD COLUMN header_media_url TEXT;
UPDATE whatsapp_templates SET header_type = 'TEXT' WHERE header_text IS NOT NULL;