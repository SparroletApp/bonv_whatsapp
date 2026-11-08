ALTER TABLE contacts
    ADD COLUMN broadcast_id BIGINT NULL;

ALTER TABLE contacts
    ADD CONSTRAINT fk_contact_broadcast
        FOREIGN KEY (broadcast_id)
            REFERENCES broadcasts(id);