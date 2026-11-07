
CREATE TABLE IF NOT EXISTS whatsapp_messages (
                                                 id BIGSERIAL PRIMARY KEY,

                                                 recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,

    message TEXT,
    template_name VARCHAR(150),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    whatsapp_message_id VARCHAR(255),

    error_message TEXT,

    sent_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status
    ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone
    ON whatsapp_messages(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at
    ON whatsapp_messages(created_at);
