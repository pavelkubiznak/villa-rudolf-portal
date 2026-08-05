-- ═══════════════════════════════════════════════════════════════════════════════
-- Villa Rudolf guest portal — schéma Supabase
-- Projekt: fpknbrzbqpalguajskut (sdílený multi-app, EU London) — vše s prefixem vr_.
-- Poslední ověření proti živé DB: 2026-07-05
--
-- ⚠️ TENTO SOUBOR NENÍ ÚPLNÝ. V živé databázi navíc existují funkce, jejichž definice
--    tady chybí (byly vytvořené přímo ve Studiu, nikdy se nezapsaly do repa):
--
--      • vr_create_booking(p_secret, p_booking_ref, p_token_hash, p_first, p_last,
--                          p_lang, p_arrival, p_departure, p_adults, p_children, p_expires)
--        volá n8n workflow „VR – nový host"      → viz docs/n8n-booking-ingest.md
--      • vr_purge_expired(p_secret)
--        volá /opt/vr-portal/purge-expired.sh na Hetzneru (denní úklid, >30 dní po odjezdu)
--
--    Obě autorizují ingest secretem (p_secret). Secret v repu NENÍ a nikdy být nesmí.
--
--    DOPLNIT PŘED PSANÍM JAKÉKOLI MIGRACE — jinak se píše naslepo. Export z SQL editoru:
--
--      select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig,
--             pg_get_functiondef(p.oid) as def
--        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--       where n.nspname = 'public' and p.proname like 'vr%'
--       order by 1;
--
--    ⚠️ Pokud je secret v těle funkce natvrdo, PŘED commitem ho nahraď zástupným textem —
--       tohle repo je veřejné.
--
-- Poznámky:
--   • pgcrypto je na Supabase ve schématu extensions -> extensions.digest(...)
--   • raw token hosta = 32 hex znaků (128 bit); v DB je jen sha256 hash
--   • expires_at = departure + 30 dní
--   • Plánované změny (ical_uidh, vr_list_stays) zatím NEJSOU nasazené —
--     viz docs/modul-kontaktu.md, bod 3. Do tohoto souboru patří až po nasazení.
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.vr_bookings (
  id           uuid primary key default gen_random_uuid(),
  booking_ref  text unique,
  token_hash   text not null unique,
  first_name   text,
  last_name    text,
  lang         text default 'de',
  arrival      date not null,
  departure    date not null,
  adults       int  default 2,
  children     int[] default '{}',
  notes        text,
  created_at   timestamptz default now(),
  expires_at   timestamptz
);

alter table public.vr_bookings enable row level security;

create or replace function public.vr_verify_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'name', json_build_object('first', b.first_name, 'last', b.last_name),
    'lang', b.lang,
    'arrival', b.arrival,
    'departure', b.departure,
    'party', json_build_object('adults', b.adults, 'children', b.children),
    'notes', b.notes
  )
  from public.vr_bookings b
  where b.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and (b.expires_at is null or b.expires_at > now())
  limit 1;
$$;

create or replace function public.vr_update_party(p_token text, p_adults int, p_children int[])
returns json
language sql
security definer
set search_path = public
as $$
  update public.vr_bookings b
     set adults = coalesce(least(greatest(p_adults,1),30), b.adults),
         children = case when p_children is null then b.children
                         when array_length(p_children,1) > 20 then b.children
                         else (select coalesce(array_agg(least(greatest(a,0),17)), '{}') from unnest(p_children) a)
                    end
   where b.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and (b.expires_at is null or b.expires_at > now())
  returning json_build_object('ok', true);
$$;

revoke all on function public.vr_verify_token(text) from public;
revoke all on function public.vr_update_party(text, int, int[]) from public;
grant execute on function public.vr_verify_token(text) to anon;
grant execute on function public.vr_update_party(text, int, int[]) to anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- OBSAH TOHOTO SOUBORU
--   tabulka   vr_bookings
--   funkce    vr_verify_token(text)              [anon]
--             vr_update_party(text, int, int[])  [anon]
--
-- CHYBÍ (existuje živě, definice nutno exportovat — viz hlavička)
--   funkce    vr_create_booking(...)             [anon + ingest secret]
--             vr_purge_expired(text)             [anon + ingest secret]
-- ═══════════════════════════════════════════════════════════════════════════════
