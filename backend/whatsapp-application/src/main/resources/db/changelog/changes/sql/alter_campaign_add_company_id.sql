ALTER TABLE campaigns
    ADD COLUMN company_id BIGINT;

ALTER TABLE campaigns
    ADD CONSTRAINT fk_campaign_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);