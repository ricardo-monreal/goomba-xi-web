-- Goomba XI website database (goomba_web). Game data stays in xidb; this holds only
-- what the website itself needs.

-- Sign-in sessions for the website and the launcher. Only a SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  CHAR(64)     NOT NULL PRIMARY KEY,
  accid       INT UNSIGNED NOT NULL,
  kind        ENUM('web', 'launcher') NOT NULL DEFAULT 'web',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  ip          VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent  VARCHAR(255) NOT NULL DEFAULT '',
  KEY idx_accid (accid),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Password reset links (single use, 1 hour).
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  CHAR(64)     NOT NULL PRIMARY KEY,
  accid       INT UNSIGNED NOT NULL,
  expires_at  DATETIME     NOT NULL,
  KEY idx_accid (accid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Failed sign-ins, for throttling password guessing per account and per IP.
CREATE TABLE IF NOT EXISTS login_failures (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  login      VARCHAR(16)  NOT NULL,
  ip         VARCHAR(45)  NOT NULL,
  failed_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login (login, failed_at),
  KEY idx_ip (ip, failed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Per-character privacy choices made on the character's Settings tab.
CREATE TABLE IF NOT EXISTS char_privacy (
  charid       INT UNSIGNED NOT NULL PRIMARY KEY,
  hide_profile TINYINT(1)   NOT NULL DEFAULT 0, -- not listed, profile shows only the name
  hide_jobs    TINYINT(1)   NOT NULL DEFAULT 0, -- shown as ANON in lists and on the profile
  hide_online  TINYINT(1)   NOT NULL DEFAULT 0, -- never shown as online
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Linkshell pages, written by the linkshell holder.
CREATE TABLE IF NOT EXISTS linkshell_profiles (
  linkshellid  INT UNSIGNED NOT NULL PRIMARY KEY,
  description  VARCHAR(600) NOT NULL DEFAULT '',
  tags         VARCHAR(200) NOT NULL DEFAULT '', -- comma separated
  recruiting   TINYINT(1)   NOT NULL DEFAULT 0,
  updated_by   INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dressing room presets.
CREATE TABLE IF NOT EXISTS dressing_presets (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  accid       INT UNSIGNED NOT NULL,
  charid      INT UNSIGNED NOT NULL,
  name        VARCHAR(40)  NOT NULL,
  job         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  items       JSON         NOT NULL, -- { "<equipslotid>": itemid }
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_char (charid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- In-game item names and descriptions (from the client DATs; see scripts/import-items.mjs).
-- Items missing here fall back to item_basic.name, prettified.
CREATE TABLE IF NOT EXISTS item_text (
  itemid       SMALLINT UNSIGNED NOT NULL PRIMARY KEY,
  name         VARCHAR(64)  NOT NULL,
  description  TEXT         NOT NULL,
  has_icon     TINYINT(1)   NOT NULL DEFAULT 0,
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Rules the account agreed to at registration.
CREATE TABLE IF NOT EXISTS account_meta (
  accid          INT UNSIGNED NOT NULL PRIMARY KEY,
  rules_version  VARCHAR(20)  NOT NULL DEFAULT '',
  agreed_at      DATETIME     NULL,
  created_ip     VARCHAR(45)  NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
