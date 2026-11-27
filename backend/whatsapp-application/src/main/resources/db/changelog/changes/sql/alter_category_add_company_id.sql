ALTER TABLE categories
    ADD COLUMN company_id BIGINT;

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);
