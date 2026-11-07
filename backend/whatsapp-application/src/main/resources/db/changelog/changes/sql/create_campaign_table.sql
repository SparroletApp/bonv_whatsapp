CREATE TABLE campaigns (
                           id BIGSERIAL PRIMARY KEY,

                           name VARCHAR(200) NOT NULL,

                           template_id BIGINT NOT NULL,

                           template_name VARCHAR(150) NOT NULL,

                           category_ids VARCHAR(500),

                           variable_mapping TEXT,

                           status VARCHAR(30) NOT NULL DEFAULT 'RUNNING',

                           total_count INTEGER NOT NULL DEFAULT 0,

                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           started_at TIMESTAMP,

                           completed_at TIMESTAMP
);