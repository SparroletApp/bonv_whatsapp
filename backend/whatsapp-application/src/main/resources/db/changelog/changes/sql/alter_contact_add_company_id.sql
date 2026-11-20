
ALTER TABLE contacts
    ADD COLUMN company_id BIGINT;


ALTER TABLE contacts
    ADD CONSTRAINT fk_contact_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);
