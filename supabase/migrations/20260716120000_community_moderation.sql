-- Allow a community member to be banned (kept as a row so they cannot rejoin).
alter table "public"."community_members" drop constraint "community_members_status_check";

alter table "public"."community_members" add constraint "community_members_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'banned'::text]))) not valid;

alter table "public"."community_members" validate constraint "community_members_status_check";
