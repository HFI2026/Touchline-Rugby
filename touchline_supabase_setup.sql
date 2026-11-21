-- TOUCHLINE PRIVATE FOUR-USER LIVE BETA
-- Requires a dedicated Supabase project. Execute in its SQL Editor.
-- Public publishable frontend key only; NEVER expose secret/service_role keys.
create extension if not exists pgcrypto;

create table if not exists public.touchline_workspaces (
 id uuid primary key default gen_random_uuid(),
 club_name text not null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 document jsonb not null,
 version bigint not null default 1 check(version>0),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create table if not exists public.touchline_members (
 workspace_id uuid not null references public.touchline_workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','editor','viewer')),
 created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
create table if not exists public.touchline_invites (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.touchline_workspaces(id) on delete cascade,
 code_hash text not null unique,
 role text not null check (role in ('editor','viewer')),
 created_by uuid not null references auth.users(id),
 expires_at timestamptz not null default now()+interval '5 days',
 redeemed_by uuid references auth.users(id),
 redeemed_at timestamptz
);
create table if not exists public.touchline_updates (
 workspace_id uuid primary key references public.touchline_workspaces(id) on delete cascade,
 version bigint not null,
 updated_at timestamptz not null default now()
);
create index if not exists tl_member_by_user on public.touchline_members(user_id);
create index if not exists tl_invites_by_workspace on public.touchline_invites(workspace_id);

alter table public.touchline_workspaces enable row level security;
alter table public.touchline_members enable row level security;
alter table public.touchline_invites enable row level security;
alter table public.touchline_updates enable row level security;
revoke all on public.touchline_workspaces,public.touchline_members,
 public.touchline_invites,public.touchline_updates from public,anon,authenticated;
grant select on public.touchline_workspaces,public.touchline_members,public.touchline_updates to authenticated;

create or replace function public.touchline_is_member(_workspace uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select (select auth.uid()) is not null and exists (
  select 1 from public.touchline_members m
  where m.workspace_id=_workspace and m.user_id=(select auth.uid())
 );
$$;
revoke all on function public.touchline_is_member(uuid) from public,anon,authenticated;
grant execute on function public.touchline_is_member(uuid) to authenticated;

drop policy if exists touchline_workspace_member_select on public.touchline_workspaces;
create policy touchline_workspace_member_select on public.touchline_workspaces
for select to authenticated using (public.touchline_is_member(id));
drop policy if exists touchline_member_self_select on public.touchline_members;
create policy touchline_member_self_select on public.touchline_members
for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists touchline_updates_member_select on public.touchline_updates;
create policy touchline_updates_member_select on public.touchline_updates
for select to authenticated using (public.touchline_is_member(workspace_id));
-- Clients have no direct insert/update/delete permissions. Writes use checked RPCs.

create or replace function public.touchline_create_workspace(_club text,_document jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare _id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if length(trim(coalesce(_club,''))) not between 2 and 120 then raise exception 'Enter a valid club name'; end if;
 if jsonb_typeof(_document)<>'object' or pg_column_size(_document)>5000000 then raise exception 'Invalid or oversized team document'; end if;
 insert into public.touchline_workspaces(club_name,owner_id,document,updated_by)
 values(trim(_club),auth.uid(),_document,auth.uid()) returning id into _id;
 insert into public.touchline_members(workspace_id,user_id,role) values(_id,auth.uid(),'owner');
 return _id;
end;$$;
revoke all on function public.touchline_create_workspace(text,jsonb) from public,anon,authenticated;
grant execute on function public.touchline_create_workspace(text,jsonb) to authenticated;

create or replace function public.touchline_issue_invite(_workspace uuid,_role text default 'editor')
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare _code text;_count integer;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if _role not in ('editor','viewer') then raise exception 'Invalid invitation role'; end if;
 perform 1 from public.touchline_workspaces where id=_workspace and owner_id=auth.uid() for update;
 if not found then raise exception 'Only the administrator can invite people'; end if;
 select count(*) into _count from public.touchline_members where workspace_id=_workspace;
 if _count>=4 then raise exception 'Maximum of four testers reached'; end if;
 _code=encode(extensions.gen_random_bytes(18),'hex');
 insert into public.touchline_invites(workspace_id,code_hash,role,created_by)
 values(_workspace,encode(extensions.digest(_code,'sha256'),'hex'),_role,auth.uid());
 return _code;
end;$$;
revoke all on function public.touchline_issue_invite(uuid,text) from public,anon,authenticated;
grant execute on function public.touchline_issue_invite(uuid,text) to authenticated;

create or replace function public.touchline_join_workspace(_code text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare _invite public.touchline_invites%rowtype;_count integer;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if length(coalesce(_code,'')) not between 16 and 128 then raise exception 'Invalid invitation'; end if;
 select * into _invite from public.touchline_invites
 where code_hash=encode(extensions.digest(trim(_code),'sha256'),'hex') for update;
 if not found or _invite.redeemed_by is not null or _invite.expires_at<now() then
  raise exception 'Invitation expired or already used';
 end if;
 perform 1 from public.touchline_workspaces where id=_invite.workspace_id for update;
 if exists(select 1 from public.touchline_members where workspace_id=_invite.workspace_id and user_id=auth.uid()) then
  raise exception 'Already a team member';
 end if;
 select count(*) into _count from public.touchline_members where workspace_id=_invite.workspace_id;
 if _count>=4 then raise exception 'Maximum four testers reached'; end if;
 insert into public.touchline_members(workspace_id,user_id,role)
 values(_invite.workspace_id,auth.uid(),_invite.role);
 update public.touchline_invites
 set redeemed_by=auth.uid(),redeemed_at=now() where id=_invite.id;
 return _invite.workspace_id;
end;$$;
revoke all on function public.touchline_join_workspace(text) from public,anon,authenticated;
grant execute on function public.touchline_join_workspace(text) to authenticated;

create or replace function public.touchline_write_workspace(
 _workspace uuid,_expected_version bigint,_document jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare _version bigint;_role text;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select m.role into _role from public.touchline_members m
 where m.workspace_id=_workspace and m.user_id=auth.uid();
 if _role not in ('owner','editor') then raise exception 'View-only or unauthorised account'; end if;
 if jsonb_typeof(_document)<>'object' or pg_column_size(_document)>5000000 then
  raise exception 'Invalid or oversized team document'; end if;
 select version into _version from public.touchline_workspaces where id=_workspace for update;
 if not found then raise exception 'Team not found'; end if;
 if _version<>_expected_version then
  return jsonb_build_object('ok',false,'version',_version,'conflict',true);
 end if;
 update public.touchline_workspaces
 set document=_document,version=version+1,updated_at=now(),updated_by=auth.uid()
 where id=_workspace returning version into _version;
 return jsonb_build_object('ok',true,'version',_version,'conflict',false);
end;$$;
revoke all on function public.touchline_write_workspace(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.touchline_write_workspace(uuid,bigint,jsonb) to authenticated;

-- Realtime emits small version signals; children’s records stay in protected workspace rows.
create or replace function public.touchline_notify_update()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.touchline_updates(workspace_id,version,updated_at)
 values(new.id,new.version,new.updated_at)
 on conflict(workspace_id) do update
  set version=excluded.version,updated_at=excluded.updated_at;
 return new;
end;$$;
revoke all on function public.touchline_notify_update() from public,anon,authenticated;
drop trigger if exists touchline_workspace_update_signal on public.touchline_workspaces;
create trigger touchline_workspace_update_signal
 after insert or update of document on public.touchline_workspaces
 for each row execute function public.touchline_notify_update();

do $$begin
 if not exists(select 1 from pg_publication_tables
 where pubname='supabase_realtime' and schemaname='public' and tablename='touchline_updates') then
  alter publication supabase_realtime add table public.touchline_updates;
 end if;
end$$;
