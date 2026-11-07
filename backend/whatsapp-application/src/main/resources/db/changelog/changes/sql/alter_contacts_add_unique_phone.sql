ALTER TABLE contacts
    ADD CONSTRAINT uk_contacts_phone UNIQUE (phone);