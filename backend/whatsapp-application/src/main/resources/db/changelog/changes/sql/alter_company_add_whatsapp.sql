ALTER TABLE companies
ADD COLUMN mail_username VARCHAR(255),
ADD COLUMN mail_password VARCHAR(500),
ADD COLUMN whatsapp_access_token TEXT,
ADD COLUMN whatsapp_api_version VARCHAR(50),
ADD COLUMN whatsapp_app_id VARCHAR(100),
ADD COLUMN whatsapp_business_account_id VARCHAR(100),
ADD COLUMN whatsapp_phone_number_id VARCHAR(100),
ADD COLUMN whatsapp_verify_token VARCHAR(500),
ADD COLUMN whatsapp_app_secret VARCHAR(500);