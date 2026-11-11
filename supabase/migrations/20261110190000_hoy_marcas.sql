-- Lo que Jordi tacha a mano en «Tus cosas de hoy»: { "texto de la cosa": true|false }. Antes solo vivía en su móvil.
-- Los bots no la escriben: sus upserts del resumen no tocan esta columna, así que las marcas sobreviven si Antonio reescribe el resumen.
alter table public.resumenes_diarios add column marcas jsonb not null default '{}' check (jsonb_typeof(marcas) = 'object');
