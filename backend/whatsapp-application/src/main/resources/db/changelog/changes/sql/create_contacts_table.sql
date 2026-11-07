CREATE TABLE contacts (
                          id BIGSERIAL PRIMARY KEY,
                          name VARCHAR(150) NOT NULL,
                          phone VARCHAR(20) NOT NULL,
                          email VARCHAR(150),
                          category_id BIGINT NOT NULL,

                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_contact_category
                              FOREIGN KEY (category_id)
                                  REFERENCES categories(id)
                                  ON DELETE RESTRICT
);