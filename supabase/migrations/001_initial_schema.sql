-- ============================================================
-- C3 Cafe Coffee Chat Admin — Initial Schema
-- ============================================================

-- Each year (e.g. "2024–2025") is an independent container for
-- its own roster, pairing history, and requests.
CREATE TABLE public.years (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label      TEXT NOT NULL,                         -- "2024–2025"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cohorts: which semester a member joined the club.
-- Global — "Fall 24" is a permanent identity that spans all years.
CREATE TABLE public.cohorts (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,                  -- "Fall 24", "Spring 25"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members: scoped to a year. Re-added from scratch each year.
-- is_active = temporarily out (personal reasons, busy, etc.)
-- is_deleted = soft delete; preserves pairing history display.
CREATE TABLE public.members (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id    UUID NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  cohort_id  UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Requests: pre-assigned pairs the social chair locks in before
-- running the algorithm. Cleared after each generation round.
CREATE TABLE public.requests (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id     UUID NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  member1_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  member2_id  UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate request pairs within a year
  CONSTRAINT unique_request_pair CHECK (member1_id <> member2_id)
);

-- Pairing weeks: one row per week of coffee chats, scoped to a year.
CREATE TABLE public.pairing_weeks (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id     UUID NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (year_id, week_number)
);

-- Pairings: supports groups of 2 or 3.
-- is_manual = true when this pair came from a pre-assignment request.
CREATE TABLE public.pairings (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id    UUID NOT NULL REFERENCES public.pairing_weeks(id) ON DELETE CASCADE,
  member1_id UUID NOT NULL REFERENCES public.members(id),
  member2_id UUID REFERENCES public.members(id),
  member3_id UUID REFERENCES public.members(id),
  is_manual  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_members_year_id     ON public.members(year_id);
CREATE INDEX idx_members_is_deleted  ON public.members(is_deleted);
CREATE INDEX idx_members_is_active   ON public.members(is_active);
CREATE INDEX idx_requests_year_id    ON public.requests(year_id);
CREATE INDEX idx_pairing_weeks_year  ON public.pairing_weeks(year_id);
CREATE INDEX idx_pairings_week_id    ON public.pairings(week_id);
CREATE INDEX idx_pairings_member1    ON public.pairings(member1_id);
CREATE INDEX idx_pairings_member2    ON public.pairings(member2_id);

-- ── Auto-update timestamps ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Row Level Security ───────────────────────────────────────
-- Auth-gated: only authenticated users can read/write.
-- The demo uses Supabase Auth with a demo account.
ALTER TABLE public.years         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairings      ENABLE ROW LEVEL SECURITY;

-- Authenticated users (social chairs) can do everything
CREATE POLICY "Authenticated full access: years"
  ON public.years FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access: cohorts"
  ON public.cohorts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access: members"
  ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access: requests"
  ON public.requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access: pairing_weeks"
  ON public.pairing_weeks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access: pairings"
  ON public.pairings FOR ALL TO authenticated USING (true) WITH CHECK (true);
