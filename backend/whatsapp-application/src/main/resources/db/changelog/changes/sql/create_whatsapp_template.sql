
CREATE TABLE IF NOT EXISTS whatsapp_templates (
                                                  id BIGSERIAL PRIMARY KEY,

                                                  name VARCHAR(150) NOT NULL,

    language VARCHAR(20) NOT NULL,

    category VARCHAR(30) NOT NULL,

    header_text VARCHAR(255),

    body TEXT NOT NULL DEFAULT '',

    footer_text VARCHAR(255),

    buttons_json TEXT,

    variable_count INTEGER NOT NULL DEFAULT 0,

    meta_template_id VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    rejection_reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name
    ON whatsapp_templates(name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status
    ON whatsapp_templates(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category
    ON whatsapp_templates(category);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language
    ON whatsapp_templates(language);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_id
    ON whatsapp_templates(meta_template_id);
