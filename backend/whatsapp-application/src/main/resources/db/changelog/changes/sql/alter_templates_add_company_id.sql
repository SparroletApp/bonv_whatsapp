ALTER TABLE whatsapp_templates
    ADD COLUMN company_id BIGINT;

ALTER TABLE whatsapp_templates
    ADD CONSTRAINT fk_whatsapp_templates_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);

CREATE INDEX idx_whatsapp_templates_company_id
    ON whatsapp_templates(company_id);
