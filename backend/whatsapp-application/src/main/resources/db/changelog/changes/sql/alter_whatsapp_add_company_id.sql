

ALTER TABLE whatsapp_messages
    ADD COLUMN company_id BIGINT;
ALTER TABLE whatsapp_messages
    ADD CONSTRAINT fk_whatsapp_messages_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);

CREATE INDEX idx_whatsapp_messages_company_id
    ON whatsapp_messages(company_id);
