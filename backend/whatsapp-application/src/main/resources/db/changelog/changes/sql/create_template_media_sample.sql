
CREATE TABLE IF NOT EXISTS template_media_sample (
                                                     meta_handle  TEXT         NOT NULL,
                                                     object_key   VARCHAR(255) NOT NULL,
    public_url   TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT pk_template_media_sample PRIMARY KEY (meta_handle)
    );

