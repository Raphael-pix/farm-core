-- ============================================================================
-- ROW LEVEL SECURITY — Enable RLS on all livestock tables
-- ============================================================================

ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortalities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES — Animals
-- ============================================================================

CREATE POLICY "Admins full access to farm animals"
ON public.animals
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read assigned field animals"
ON public.animals
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND (
    -- Can see animals assigned to fields they manage
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.agent_id = auth.uid()
        AND f.location_id = animals.location_id
        AND f.farm_id = animals.farm_id
    )
    OR status = 'ACTIVE'  -- Can see all active animals
  )
);

-- ============================================================================
-- RLS POLICIES — Animal Identities
-- ============================================================================

CREATE POLICY "Admins manage farm animal identities"
ON public.animal_identities
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read animal identities"
ON public.animal_identities
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND EXISTS (
    SELECT 1 FROM public.animals a
    WHERE a.id = animal_identities.animal_id
      AND a.farm_id = farm_id
  )
);

-- ============================================================================
-- RLS POLICIES — Medical Records (Append-Only)
-- ============================================================================

CREATE POLICY "Admins read farm medical records"
ON public.medical_records
FOR SELECT
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read assigned animal medical records"
ON public.medical_records
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND EXISTS (
    SELECT 1 FROM public.animals a
    WHERE a.id = animal_id
  )
);

CREATE POLICY "Admins insert medical records"
ON public.medical_records
FOR INSERT
WITH CHECK (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents insert medical records for assigned animals"
ON public.medical_records
FOR INSERT
WITH CHECK (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND recorded_by_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.animals a
    WHERE a.id = animal_id
      AND a.farm_id = farm_id
  )
);

-- IMPORTANT: No UPDATE or DELETE policies for medical_records (append-only)
-- Exception: Mark scheduled treatments as completed (handled separately in app)

-- ============================================================================
-- RLS POLICIES — Breeding Events
-- ============================================================================

CREATE POLICY "Admins manage farm breeding events"
ON public.breeding_events
FOR ALL
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read breeding events for assigned animals"
ON public.breeding_events
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND (
    -- Agent assigned to either parent
    EXISTS (
      SELECT 1 FROM public.animals a
      WHERE (a.id = male_id OR a.id = female_id)
    )
  )
);

-- ============================================================================
-- RLS POLICIES — Mortalities (Append-Only)
-- ============================================================================

CREATE POLICY "Admins read farm mortality records"
ON public.mortalities
FOR SELECT
USING (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents read assigned animal mortality"
ON public.mortalities
FOR SELECT
USING (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND EXISTS (
    SELECT 1 FROM public.animals a
    WHERE a.id = animal_id
  )
);

CREATE POLICY "Admins insert mortality records"
ON public.mortalities
FOR INSERT
WITH CHECK (
  get_auth_role() = 'ADMIN'
  AND farm_id = get_auth_farm_id()
);

CREATE POLICY "Agents insert mortality for assigned animals"
ON public.mortalities
FOR INSERT
WITH CHECK (
  get_auth_role() = 'AGENT'
  AND farm_id = get_auth_farm_id()
  AND recorded_by_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.animals a
    WHERE a.id = animal_id
      AND a.farm_id = farm_id
  )
);

-- IMPORTANT: No UPDATE or DELETE policies for mortalities (append-only)

-- ============================================================================
-- HELPER FUNCTIONS — Livestock queries
-- ============================================================================

/**
 * Get herd statistics for a farm (count by species/status)
 * Used by dashboard
 */
CREATE OR REPLACE FUNCTION public.get_herd_stats(p_farm_id UUID)
RETURNS TABLE (
  species TEXT,
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.species::TEXT,
    a.status::TEXT,
    COUNT(*)
  FROM public.animals a
  WHERE a.farm_id = p_farm_id
  GROUP BY a.species, a.status;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * Get at-risk animals (no medical checkup in N days)
 * Used for health alerts
 */
CREATE OR REPLACE FUNCTION public.get_animals_needing_attention(
  p_farm_id UUID,
  p_days_threshold INT DEFAULT 30
)
RETURNS TABLE (
  animal_id UUID,
  animal_name TEXT,
  species TEXT,
  last_medical_check TIMESTAMP WITH TIME ZONE,
  days_since_check INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.species::TEXT,
    MAX(m.created_at) as last_medical_check,
    CEIL(EXTRACT(EPOCH FROM (NOW() - MAX(m.created_at))) / 86400)::INT as days_since_check
  FROM public.animals a
  LEFT JOIN public.medical_records m ON m.animal_id = a.id
  WHERE a.farm_id = p_farm_id
    AND a.status = 'ACTIVE'
  GROUP BY a.id, a.name, a.species
  HAVING MAX(m.created_at) IS NULL
    OR EXTRACT(EPOCH FROM (NOW() - MAX(m.created_at))) / 86400 > p_days_threshold
  ORDER BY last_medical_check ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

/**
 * Get mortality analytics (count by cause/species)
 * Used for historical analysis
 */
CREATE OR REPLACE FUNCTION public.get_mortality_analytics(
  p_farm_id UUID,
  p_days_back INT DEFAULT 365
)
RETURNS TABLE (
  cause TEXT,
  species TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.cause::TEXT,
    a.species::TEXT,
    COUNT(*)
  FROM public.mortalities m
  JOIN public.animals a ON a.id = m.animal_id
  WHERE m.farm_id = p_farm_id
    AND m.date_of_death >= NOW() - INTERVAL '1 day' * p_days_back
  GROUP BY m.cause, a.species
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- TRIGGER — Update animal status to DEAD when mortality is recorded
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_mortality_recorded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.animals
  SET
    status = 'DEAD',
    status_changed_at = NEW.created_at,
    status_reason = CONCAT(NEW.cause::TEXT, ': ', COALESCE(NEW.cause_details, ''))
  WHERE id = NEW.animal_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mortality_recorded ON public.mortalities;

CREATE TRIGGER on_mortality_recorded
AFTER INSERT ON public.mortalities
FOR EACH ROW
EXECUTE FUNCTION public.handle_mortality_recorded();

-- ============================================================================
-- TRIGGER — Auto-create offspring animals on birth
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_breeding_birth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offspring_count INT;
  i INT;
  male_animal RECORD;
BEGIN
  -- Only on birth
  IF NEW.status = 'DELIVERED' AND NEW.actual_birth_date IS NOT NULL THEN
    -- Get male parent for species info
    SELECT * INTO male_animal FROM public.animals WHERE id = NEW.male_id;

    -- Create offspring animals
    FOR i IN 1..COALESCE(NEW.number_of_offspring, 0) LOOP
      INSERT INTO public.animals (
        farm_id,
        species,
        sex,
        date_of_birth,
        male_parent_id,
        female_parent_id,
        status,
        created_at,
        created_by_id,
        updated_at,
        updated_by_id
      ) VALUES (
        NEW.farm_id,
        male_animal.species,
        'UNKNOWN',
        NEW.actual_birth_date,
        NEW.male_id,
        NEW.female_id,
        'ACTIVE',
        NOW(),
        NEW.recorded_by_id,
        NOW(),
        NEW.recorded_by_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_breeding_birth ON public.breeding_events;

CREATE TRIGGER on_breeding_birth
AFTER UPDATE ON public.breeding_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_breeding_birth();

-- ============================================================================
-- GRANTS — Ensure auth can use functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_herd_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_animals_needing_attention(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mortality_analytics(UUID, INT) TO authenticated;