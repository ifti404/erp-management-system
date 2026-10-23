-- Adds the opt-in, 30-day remembered-device sign-in.
-- Existing ERP records are untouched. Run this once before starting the updated backend.
CREATE TABLE IF NOT EXISTS remembered_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_remembered_sessions_token_hash (token_hash),
    KEY idx_remembered_sessions_user_id (user_id),
    KEY idx_remembered_sessions_expires_at (expires_at),
    CONSTRAINT fk_remembered_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
