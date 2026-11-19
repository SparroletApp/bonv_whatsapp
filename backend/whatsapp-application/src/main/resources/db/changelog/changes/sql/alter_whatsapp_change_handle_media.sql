ALTER TABLE whatsapp_templates
ALTER COLUMN header_media_handle TYPE TEXT;

ALTER TABLE whatsapp_templates
    ADD COLUMN IF NOT EXISTS header_media_object_key VARCHAR(500);

UPDATE whatsapp_templates
SET header_media_object_key = SUBSTRING(header_media_url FROM 'template-media/.*'),
    header_media_url = 'https://YOUR-APP-BASE-URL/public/template-media/'
        || SUBSTRING(header_media_url FROM 'template-media/(.*)')
WHERE header_media_url LIKE '%template-media/%';