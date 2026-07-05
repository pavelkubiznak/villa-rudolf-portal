-- Villa Rudolf guest portal — NASAZENÉ schéma (2026-07-05)
-- Projekt: fpknbrzbqpalguajskut (sdílený multi-app, EU London) — tabulky s vr_ prefixem.
-- Pozn.: pgcrypto je na Supabase ve schématu extensions -> extensions.digest(...).
-- Vzor insertu hosta (n8n): raw token = 32 hex znaků (128 bit, openssl rand -hex 16);
--   ukládá se jen sha256 hash. expires_at = departure + 30 dní.
-- Villa Rudolf guest portal — schéma s vr_ prefixem (sdílený projekt fpknbrzbqpalguajskut)
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
