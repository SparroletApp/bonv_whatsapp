ALTER TABLE users
    ADD COLUMN company_id BIGINT NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
            REFERENCES companies(id);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(30);

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT;