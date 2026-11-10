ALTER TABLE contacts
    ADD COLUMN category_ids BIGINT[] DEFAULT '{}';