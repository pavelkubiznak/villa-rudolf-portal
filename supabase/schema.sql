-- Villa Rudolf guest portal — Supabase schéma (Fáze 1)
-- Spustit v Supabase → SQL Editor. Region projektu zvol EU (eu-central-1).
-- Princip: hostova data leží jen tady (GDPR), stránka čte přes token, RLS přímý select zakáže.
-- Katalog výletů zatím žije v data/trips.json (snadná editace, offline). Sem se dá přesunout později.

create extension if not exists pgcrypto;

-- ===== Rezervace / hosté =====
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  booking_ref  text unique,                 -- id rezervace z Booking.com (idempotentní upsert z n8n)
  token_hash   text not null unique,        -- sha256(token); raw token se NIKDY neukládá
  first_name   text,
  last_name    text,
  lang         text default 'de',           -- 'cs' | 'de' | 'en'
  arrival      date not null,
  departure    date not null,
  adults       int  default 2,
  children     int[] default '{}',          -- věky dětí; prázdné = neznáme (host doplní)
  notes        text,
  created_at   timestamptz default now(),
  expires_at   timestamptz                  -- typicky departure + 30 dní; po expiraci token neplatí
);

alter table public.bookings enable row level security;
-- žádná policy = anonymní/veřejný přímý SELECT je zakázán; přístup jen přes RPC níže.

-- ===== Čtení hostem přes token (capability) =====
create or replace function public.verify_token(p_token text)
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
  from public.bookings b
  where b.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and (b.expires_at is null or b.expires_at > now())
  limit 1;
$$;

-- ===== Doplnění věků hostem (one-tap formulář), jen vlastní záznam přes token =====
create or replace function public.update_party(p_token text, p_adults int, p_children int[])
returns json
language sql
security definer
set search_path = public
as $$
  update public.bookings b
     set adults = coalesce(p_adults, b.adults),
         children = coalesce(p_children, b.children)
   where b.token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and (b.expires_at is null or b.expires_at > now())
  returning json_build_object('ok', true);
$$;

revoke all on function public.verify_token(text) from public;
revoke all on function public.update_party(text, int, int[]) from public;
grant execute on function public.verify_token(text) to anon;
grant execute on function public.update_party(text, int, int[]) to anon;

-- ===== Jak n8n zakládá hosta (vzor; raw token vznikne v n8n, sem jde jen hash) =====
-- insert into public.bookings (booking_ref, token_hash, first_name, last_name, lang, arrival, departure, adults, children, expires_at)
-- values ('BDC-EXAMPLE-1', encode(digest('RAW_TOKEN','sha256'),'hex'), 'Max','Mustermann','de','2026-08-07','2026-08-13',2,'{8,10}', '2026-09-12')
-- on conflict (booking_ref) do update set arrival=excluded.arrival, departure=excluded.departure, adults=excluded.adults, children=excluded.children;

-- ===== Úklid po odjezdu (GDPR retence) — n8n cron 1×/den =====
-- delete from public.bookings where departure < now() - interval '30 days';
