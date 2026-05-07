# Codex Run Log

## 2026-05-07 11:11 BST

- Branch: `feature/supabase-schema-rls-foundation`
- Files changed: `supabase/seed.sql` plus supporting run/fix logs.
- Errors: the seed had no asset insert block, so `assets` remained empty after manual execution in Supabase SQL Editor.
- Fixes attempted: added deterministic asset upserts keyed by `station_id + asset_code` and ordered inserts after station/location/type seed rows.
- Tests run: `npm run lint`, `npm run build`.
- Verification SQL to rerun in Supabase SQL Editor:
  ```sql
  select name from organisations;
  select name from stations;
  select name from station_locations order by name;
  select name from asset_types order by name;
  select a.name, sl.name as location_name, at.name as asset_type_name
  from assets a
  join station_locations sl on sl.id = a.station_location_id
  join asset_types at on at.id = a.asset_type_id
  order by sl.name, a.name;
  ```
- Next recommended step: rerun `supabase/seed.sql` in Supabase SQL Editor and confirm the nine expected assets are present.
