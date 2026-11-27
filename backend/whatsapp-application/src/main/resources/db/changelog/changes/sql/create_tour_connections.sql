
CREATE TABLE IF NOT EXISTS tour_connections (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL UNIQUE,
    company_name VARCHAR(255),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_tour_connections_company_id
    ON tour_connections(company_id);
