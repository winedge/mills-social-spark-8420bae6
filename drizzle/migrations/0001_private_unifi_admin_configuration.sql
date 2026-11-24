CREATE TABLE public.wifi_unifi_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  console_id text NOT NULL DEFAULT '',
  site_id text NOT NULL DEFAULT '',
  session_minutes integer NOT NULL DEFAULT 240 CHECK (session_minutes BETWEEN 15 AND 1440),
  api_key_encrypted text NOT NULL DEFAULT '',
  last_test_at timestamptz,
  last_test_ok boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.wifi_unifi_config FROM anon, authenticated;
GRANT ALL ON public.wifi_unifi_config TO service_role;
ALTER TABLE public.wifi_unifi_config ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.wifi_unifi_config IS 'Server-only UniFi configuration. Authenticated admin server functions validate roles before using privileged access. API keys are encrypted; never expose ciphertext or plaintext to clients.';