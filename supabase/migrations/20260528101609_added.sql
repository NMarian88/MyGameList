
  create table "public"."communities" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text not null,
    "is_private" boolean not null default false,
    "created_by" text not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."community_members" (
    "id" uuid not null default gen_random_uuid(),
    "community_id" uuid not null,
    "user_id" text not null,
    "role" text not null default 'member'::text,
    "status" text not null default 'active'::text,
    "joined_at" timestamp with time zone not null default now()
      );



  create table "public"."thread_comments" (
    "id" uuid not null default gen_random_uuid(),
    "thread_id" uuid not null,
    "user_id" text not null,
    "content" text not null,
    "parent_comment_id" uuid,
    "author_name" text not null,
    "author_image" text,
    "upvotes" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."threads" (
    "id" uuid not null default gen_random_uuid(),
    "community_id" uuid not null,
    "user_id" text not null,
    "title" text not null,
    "content" text not null,
    "author_name" text not null,
    "author_image" text,
    "upvotes" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX communities_name_key ON public.communities USING btree (name);

CREATE UNIQUE INDEX communities_pkey ON public.communities USING btree (id);

CREATE UNIQUE INDEX communities_slug_key ON public.communities USING btree (slug);

CREATE UNIQUE INDEX community_members_community_id_user_id_key ON public.community_members USING btree (community_id, user_id);

CREATE UNIQUE INDEX community_members_pkey ON public.community_members USING btree (id);

CREATE UNIQUE INDEX thread_comments_pkey ON public.thread_comments USING btree (id);

CREATE UNIQUE INDEX threads_pkey ON public.threads USING btree (id);

alter table "public"."communities" add constraint "communities_pkey" PRIMARY KEY using index "communities_pkey";

alter table "public"."community_members" add constraint "community_members_pkey" PRIMARY KEY using index "community_members_pkey";

alter table "public"."thread_comments" add constraint "thread_comments_pkey" PRIMARY KEY using index "thread_comments_pkey";

alter table "public"."threads" add constraint "threads_pkey" PRIMARY KEY using index "threads_pkey";

alter table "public"."communities" add constraint "communities_name_key" UNIQUE using index "communities_name_key";

alter table "public"."communities" add constraint "communities_slug_key" UNIQUE using index "communities_slug_key";

alter table "public"."community_members" add constraint "community_members_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE not valid;

alter table "public"."community_members" validate constraint "community_members_community_id_fkey";

alter table "public"."community_members" add constraint "community_members_community_id_user_id_key" UNIQUE using index "community_members_community_id_user_id_key";

alter table "public"."community_members" add constraint "community_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'moderator'::text, 'member'::text]))) not valid;

alter table "public"."community_members" validate constraint "community_members_role_check";

alter table "public"."community_members" add constraint "community_members_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text]))) not valid;

alter table "public"."community_members" validate constraint "community_members_status_check";

alter table "public"."thread_comments" add constraint "thread_comments_parent_comment_id_fkey" FOREIGN KEY (parent_comment_id) REFERENCES public.thread_comments(id) ON DELETE CASCADE not valid;

alter table "public"."thread_comments" validate constraint "thread_comments_parent_comment_id_fkey";

alter table "public"."thread_comments" add constraint "thread_comments_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE not valid;

alter table "public"."thread_comments" validate constraint "thread_comments_thread_id_fkey";

alter table "public"."threads" add constraint "threads_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE not valid;

alter table "public"."threads" validate constraint "threads_community_id_fkey";

grant delete on table "public"."communities" to "anon";

grant insert on table "public"."communities" to "anon";

grant references on table "public"."communities" to "anon";

grant select on table "public"."communities" to "anon";

grant trigger on table "public"."communities" to "anon";

grant truncate on table "public"."communities" to "anon";

grant update on table "public"."communities" to "anon";

grant delete on table "public"."communities" to "authenticated";

grant insert on table "public"."communities" to "authenticated";

grant references on table "public"."communities" to "authenticated";

grant select on table "public"."communities" to "authenticated";

grant trigger on table "public"."communities" to "authenticated";

grant truncate on table "public"."communities" to "authenticated";

grant update on table "public"."communities" to "authenticated";

grant delete on table "public"."communities" to "service_role";

grant insert on table "public"."communities" to "service_role";

grant references on table "public"."communities" to "service_role";

grant select on table "public"."communities" to "service_role";

grant trigger on table "public"."communities" to "service_role";

grant truncate on table "public"."communities" to "service_role";

grant update on table "public"."communities" to "service_role";

grant delete on table "public"."community_members" to "anon";

grant insert on table "public"."community_members" to "anon";

grant references on table "public"."community_members" to "anon";

grant select on table "public"."community_members" to "anon";

grant trigger on table "public"."community_members" to "anon";

grant truncate on table "public"."community_members" to "anon";

grant update on table "public"."community_members" to "anon";

grant delete on table "public"."community_members" to "authenticated";

grant insert on table "public"."community_members" to "authenticated";

grant references on table "public"."community_members" to "authenticated";

grant select on table "public"."community_members" to "authenticated";

grant trigger on table "public"."community_members" to "authenticated";

grant truncate on table "public"."community_members" to "authenticated";

grant update on table "public"."community_members" to "authenticated";

grant delete on table "public"."community_members" to "service_role";

grant insert on table "public"."community_members" to "service_role";

grant references on table "public"."community_members" to "service_role";

grant select on table "public"."community_members" to "service_role";

grant trigger on table "public"."community_members" to "service_role";

grant truncate on table "public"."community_members" to "service_role";

grant update on table "public"."community_members" to "service_role";

grant delete on table "public"."thread_comments" to "anon";

grant insert on table "public"."thread_comments" to "anon";

grant references on table "public"."thread_comments" to "anon";

grant select on table "public"."thread_comments" to "anon";

grant trigger on table "public"."thread_comments" to "anon";

grant truncate on table "public"."thread_comments" to "anon";

grant update on table "public"."thread_comments" to "anon";

grant delete on table "public"."thread_comments" to "authenticated";

grant insert on table "public"."thread_comments" to "authenticated";

grant references on table "public"."thread_comments" to "authenticated";

grant select on table "public"."thread_comments" to "authenticated";

grant trigger on table "public"."thread_comments" to "authenticated";

grant truncate on table "public"."thread_comments" to "authenticated";

grant update on table "public"."thread_comments" to "authenticated";

grant delete on table "public"."thread_comments" to "service_role";

grant insert on table "public"."thread_comments" to "service_role";

grant references on table "public"."thread_comments" to "service_role";

grant select on table "public"."thread_comments" to "service_role";

grant trigger on table "public"."thread_comments" to "service_role";

grant truncate on table "public"."thread_comments" to "service_role";

grant update on table "public"."thread_comments" to "service_role";

grant delete on table "public"."threads" to "anon";

grant insert on table "public"."threads" to "anon";

grant references on table "public"."threads" to "anon";

grant select on table "public"."threads" to "anon";

grant trigger on table "public"."threads" to "anon";

grant truncate on table "public"."threads" to "anon";

grant update on table "public"."threads" to "anon";

grant delete on table "public"."threads" to "authenticated";

grant insert on table "public"."threads" to "authenticated";

grant references on table "public"."threads" to "authenticated";

grant select on table "public"."threads" to "authenticated";

grant trigger on table "public"."threads" to "authenticated";

grant truncate on table "public"."threads" to "authenticated";

grant update on table "public"."threads" to "authenticated";

grant delete on table "public"."threads" to "service_role";

grant insert on table "public"."threads" to "service_role";

grant references on table "public"."threads" to "service_role";

grant select on table "public"."threads" to "service_role";

grant trigger on table "public"."threads" to "service_role";

grant truncate on table "public"."threads" to "service_role";

grant update on table "public"."threads" to "service_role";


