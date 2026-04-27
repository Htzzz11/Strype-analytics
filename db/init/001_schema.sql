USE strype_analytics;

CREATE TABLE countries (
    country_code  CHAR(2)       NOT NULL,
    country_name  VARCHAR(128)  NOT NULL,
    PRIMARY KEY (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
    user_id       CHAR(36)      NOT NULL,
    first_seen    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    country_code  CHAR(2)       NULL,
    PRIMARY KEY (user_id),
    KEY idx_users_country_code (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sessions (
    session_id          CHAR(36)      NOT NULL,
    user_id             CHAR(36)      NOT NULL,
    started_at          DATETIME(3)   NOT NULL,
    ended_at            DATETIME(3)   NULL,
    active_duration_ms  BIGINT        NULL,
    PRIMARY KEY (session_id),
    KEY idx_sessions_user_id (user_id),
    KEY idx_sessions_started_at (started_at),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE events (
    event_id     CHAR(36)      NOT NULL,
    session_id   CHAR(36)      NOT NULL,
    user_id      CHAR(36)      NOT NULL,
    record_time  DATETIME(3)   NOT NULL,
    event_type   VARCHAR(64)   NOT NULL,
    payload      JSON          NULL,
    PRIMARY KEY (event_id),
    KEY idx_events_session_id (session_id),
    KEY idx_events_user_id (user_id),
    KEY idx_events_record_time (record_time),
    KEY idx_events_event_type (event_type),
    CONSTRAINT fk_events_session
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
