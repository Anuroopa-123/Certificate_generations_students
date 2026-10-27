-- Raventiq Technologies Certificate System Schema
-- SuperAdmin: Anu (Co-Founder & Chief Technology Officer (CTO))
-- Admin: Dinesh (Co-Founder & Chief Business Officer (CBO))

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin')),
    designation VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    signature_title VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    verification_token VARCHAR(128) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(150),
    program_name VARCHAR(200) NOT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'valid',
    pdf_path TEXT,
    issued_by BIGINT NOT NULL REFERENCES users(id),
    download_count INT NOT NULL DEFAULT 0,
    max_downloads INT NOT NULL DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS download_logs (
    id BIGSERIAL PRIMARY KEY,
    certificate_id BIGINT NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS download_reset_requests (
    id BIGSERIAL PRIMARY KEY,
    certificate_id BIGINT NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(150),
    certificate_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cert_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_cert_token ON certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
