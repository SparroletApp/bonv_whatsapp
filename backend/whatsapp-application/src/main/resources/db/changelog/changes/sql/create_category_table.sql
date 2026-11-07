CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,
                            category_name VARCHAR(150) NOT NULL UNIQUE,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);