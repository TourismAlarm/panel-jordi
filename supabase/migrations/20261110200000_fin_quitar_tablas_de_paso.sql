-- Tablas de paso de la migración de Control-Financiero (octubre). Todo lo que guardaban está en fin_*:
-- comprobado el 10-11-2026, ninguna fila de mig_tx, mig_acct, mig_cat ni mig_loan falta en su tabla fin_ correspondiente.
drop table public.mig_tx, public.mig_acct, public.mig_cat, public.mig_loan;
