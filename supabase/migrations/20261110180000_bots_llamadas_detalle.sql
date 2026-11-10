-- Por qué se rechazó una llamada de un bot (400, 403, 404, 409, 422): el mismo motivo que se le devolvió.
-- Sirve para que Antonio vea sus fallos repetidos al leer el arnés y para diagnosticar sin adivinar.
alter table public.bots_llamadas add column detalle text check (detalle is null or char_length(detalle) <= 500);
