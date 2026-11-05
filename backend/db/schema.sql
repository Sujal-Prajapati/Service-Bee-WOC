-- =====================================================================
-- ServiceBee – PostgreSQL schema
-- Safe to run more than once (everything is IF NOT EXISTS / OR REPLACE).
-- Apply with:  npm run db:init
-- Requires PostgreSQL 13+ (uses the built-in gen_random_uuid()).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- companies  (service providers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    phone         TEXT        NOT NULL,
    hash          TEXT        NOT NULL,          -- PBKDF2 password hash (hex)
    salt          TEXT        NOT NULL,          -- per-user salt (hex)
    address       TEXT,
    refresh_token TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- consumers  (customers who book services)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumers (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    phone         TEXT        NOT NULL,
    hash          TEXT        NOT NULL,
    salt          TEXT        NOT NULL,
    address       TEXT,
    refresh_token TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- services  (offered by a company)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title        TEXT          NOT NULL,
    category     TEXT          NOT NULL,
    description  TEXT          NOT NULL,
    price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    location     TEXT,
    image        TEXT,
    is_available BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT services_company_title_key UNIQUE (company_id, title)
);

-- ---------------------------------------------------------------------
-- requests  (a consumer asking a company to perform a service)
--
-- service_id is nullable on purpose: when a company deletes a service the
-- historical requests are kept and simply lose the link (ON DELETE SET NULL).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id           UUID        NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    company_id            UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id            UUID        REFERENCES services(id) ON DELETE SET NULL,
    status                TEXT        NOT NULL DEFAULT 'pending',
    description           TEXT,
    expected_date         TIMESTAMPTZ,
    address               TEXT        NOT NULL,
    pincode               INTEGER     NOT NULL CHECK (pincode > 0),
    technician_name       TEXT,
    technician_phone      TEXT,
    technician_role       TEXT,
    company_expected_date TIMESTAMPTZ,
    consumer_note         TEXT,
    company_note          TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT requests_status_check
        CHECK (status IN ('pending', 'inProgress', 'rejected', 'resolved', 'cancelled'))
);

-- ---------------------------------------------------------------------
-- reviews  (one review per request)
--
-- service_id / request_id are nullable so a review survives if its service
-- is deleted or the consumer deletes the original request.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID        NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id  UUID        REFERENCES services(id) ON DELETE SET NULL,
    request_id  UUID        UNIQUE REFERENCES requests(id) ON DELETE SET NULL,
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- notifications  (addressed to either a consumer or a company)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id    UUID        NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    company_id     UUID        REFERENCES companies(id) ON DELETE CASCADE,
    recipient_type TEXT        NOT NULL,
    request_id     UUID        NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    title          TEXT,
    message        TEXT,
    is_read        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notifications_recipient_type_check
        CHECK (recipient_type IN ('consumer', 'company'))
);

-- ---------------------------------------------------------------------
-- Indexes for the access patterns the API actually uses
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_services_company          ON services (company_id);

CREATE INDEX IF NOT EXISTS idx_requests_company_created  ON requests (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_consumer_created ON requests (consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_service          ON requests (service_id);

CREATE INDEX IF NOT EXISTS idx_reviews_company_created   ON reviews (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service           ON reviews (service_id);

CREATE INDEX IF NOT EXISTS idx_notifications_company     ON notifications (company_id, recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_consumer    ON notifications (consumer_id, recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_request     ON notifications (request_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_companies_updated_at     ON companies;
CREATE TRIGGER trg_companies_updated_at     BEFORE UPDATE ON companies     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_consumers_updated_at     ON consumers;
CREATE TRIGGER trg_consumers_updated_at     BEFORE UPDATE ON consumers     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at      ON services;
CREATE TRIGGER trg_services_updated_at      BEFORE UPDATE ON services      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at      ON requests;
CREATE TRIGGER trg_requests_updated_at      BEFORE UPDATE ON requests      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated_at       ON reviews;
CREATE TRIGGER trg_reviews_updated_at       BEFORE UPDATE ON reviews       FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
