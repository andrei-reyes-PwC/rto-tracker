CREATE TABLE roles (
    code VARCHAR(50) NOT NULL,
    protected_role BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (code)
);

CREATE TABLE user_roles (
    user_email VARCHAR(254) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_email, role_code),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_email)
        REFERENCES users (email) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_code)
        REFERENCES roles (code) ON DELETE RESTRICT
);

INSERT INTO roles (code, protected_role) VALUES
    ('USER', FALSE),
    ('ADMIN', FALSE),
    ('SUPER_ADMIN', TRUE);

INSERT INTO user_roles (user_email, role_code)
SELECT email, 'USER' FROM users;
