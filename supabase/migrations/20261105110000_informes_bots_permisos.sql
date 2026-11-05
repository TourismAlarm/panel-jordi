-- Supabase da todos los permisos a service_role en cada tabla nueva: el grant de bots_vida no los quitaba.
-- Un informe se añade y se lee: ni el servidor lo cambia ni lo borra.
revoke update, delete, truncate on public.informes_bots from service_role;
