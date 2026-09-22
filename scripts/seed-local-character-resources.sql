-- Local development seed only. Do not run against production.
--
-- The extractor emits product-level values under resources_at_start.resources
-- and resource_changes.resource. `raw_slots`/`unmapped_slots` are deliberately
-- not represented here. Rows not yet observed in v027 are retained as explicit
-- provisional mappings so local imports can exercise the full mapper.
--
-- Install resources use extractor_key = 'install': their start value comes from
-- resources_at_start.install.active and their effect changes use resource = 'install'.

BEGIN;

WITH resource_seed (
    character_name,
    object_key,
    name,
    kind,
    spend_behavior,
    starts_with,
    resets_each_round,
    min_status,
    max_status,
    extractor_source,
    extractor_key,
    sort_order
) AS (
    VALUES
        -- Confirmed by the v027 bundle.
        ('Ryu', 'ryu_denjin_charge', 'Denjin Charge', 'stock', 'consumed', 0, false, 0, 1, 'named', 'denjin', 10),
        ('Kimberly', 'kimberly_spray_cans', 'Spray Cans', 'stock', 'consumed', 0, false, 0, 2, 'named', 'cans', 10),
        ('Kimberly', 'kimberly_install', 'Install', 'state', 'maintained', 0, false, 0, NULL, 'install', 'install', 20),
        ('C.Viper', 'viper_install', 'Install', 'state', 'maintained', 0, false, 0, NULL, 'install', 'install', 10),

        -- Extractor mappings known from resources.map; gameplay defaults are provisional.
        ('Manon', 'manon_medals', 'Medals', 'scaler', 'maintained', 0, false, 0, 5, 'named', 'medal_level', 10),
        ('Blanka', 'blanka_blanka_chan', 'Blanka-chan', 'stock', 'consumed', 3, true, 0, 3, 'named', 'stock', 10),
        ('Blanka', 'blanka_blanka_install', 'Blanka Install', 'state', 'maintained', 0, false, 0, NULL, 'install', 'install', 20),
        ('Ed', 'ed_stock', 'Stock', 'stock', 'consumed', 0, true, 0, NULL, 'named', 'stock', 10),
        ('Ed', 'ed_install', 'Install', 'state', 'maintained', 0, false, 0, NULL, 'install', 'install', 20),
        ('Juri', 'juri_fuha', 'Fuha', 'stock', 'consumed', 0, false, 0, 3, 'named', 'fuhajin_stock', 10),
        ('Lily', 'lily_wind_charge', 'Wind Charge', 'stock', 'consumed', 0, true, 0, 3, 'named', 'charge', 10),
        ('Jamie', 'jamie_drinks', 'Drinks', 'scaler', 'maintained', 0, true, 0, 4, 'named', 'drink_level', 10),
        ('Akuma', 'akuma_flame_stock', 'Flame Stock', 'stock', 'consumed', 0, true, 0, NULL, 'named', 'flame_stock', 10),
        ('Mai', 'mai_fire_fans', 'Fire Fans', 'stock', 'consumed', 0, false, 0, 5, 'named', 'stock', 10)
)
INSERT INTO sf6.character_object (
    character_id,
    character_name,
    object_key,
    name,
    status_type,
    max_status,
    can_be_consumed,
    can_be_added_relative,
    can_be_added_absolute,
    kind,
    spend_behavior,
    starts_with,
    resets_each_round,
    min_status,
    extractor_key,
    extractor_source,
    sort_order
)
SELECT
    character.id,
    character.name,
    resource_seed.object_key,
    resource_seed.name,
    CASE WHEN resource_seed.kind = 'state' THEN 'boolean' ELSE 'integer' END,
    resource_seed.max_status,
    resource_seed.spend_behavior = 'consumed',
    true,
    false,
    resource_seed.kind,
    resource_seed.spend_behavior,
    resource_seed.starts_with,
    resource_seed.resets_each_round,
    resource_seed.min_status,
    resource_seed.extractor_key,
    resource_seed.extractor_source,
    resource_seed.sort_order
FROM resource_seed
JOIN sf6.character AS character ON character.name = resource_seed.character_name
ON CONFLICT (object_key) DO UPDATE SET
    character_id = EXCLUDED.character_id,
    character_name = EXCLUDED.character_name,
    name = EXCLUDED.name,
    status_type = EXCLUDED.status_type,
    max_status = EXCLUDED.max_status,
    can_be_consumed = EXCLUDED.can_be_consumed,
    can_be_added_relative = EXCLUDED.can_be_added_relative,
    can_be_added_absolute = EXCLUDED.can_be_added_absolute,
    kind = EXCLUDED.kind,
    spend_behavior = EXCLUDED.spend_behavior,
    starts_with = EXCLUDED.starts_with,
    resets_each_round = EXCLUDED.resets_each_round,
    min_status = EXCLUDED.min_status,
    extractor_key = EXCLUDED.extractor_key,
    extractor_source = EXCLUDED.extractor_source,
    sort_order = EXCLUDED.sort_order;

-- Fails the transaction rather than silently accepting a missing local character.
DO $$
DECLARE
    expected_count integer := 14;
    configured_count integer;
BEGIN
    SELECT count(*)
    INTO configured_count
    FROM sf6.character_object
    WHERE object_key IN (
        'ryu_denjin_charge', 'kimberly_spray_cans', 'kimberly_install', 'viper_install',
        'manon_medals', 'blanka_blanka_chan', 'blanka_blanka_install', 'ed_stock', 'ed_install',
        'juri_fuha', 'lily_wind_charge', 'jamie_drinks', 'akuma_flame_stock', 'mai_fire_fans'
    );

    IF configured_count <> expected_count THEN
        RAISE EXCEPTION 'Expected % resource definitions, found %.', expected_count, configured_count;
    END IF;
END $$;

COMMIT;

SELECT
    character.name AS character,
    resource.name,
    resource.kind,
    resource.extractor_source,
    resource.extractor_key
FROM sf6.character_object AS resource
JOIN sf6.character AS character ON character.id = resource.character_id
WHERE resource.extractor_key IS NOT NULL
ORDER BY character.name, resource.sort_order, resource.name;
