-- ListingWIN: Skapa RPC-funktion get_workspace_members_with_email
-- Kör detta i Supabase SQL Editor: https://supabase.com/dashboard/project/rjbqvbnzxxltnwoqfstb/sql
--
-- Funktionen hämtar alla workspace-medlemmar med e-post, roll och namn
-- från auth.users.raw_user_meta_data (first_name, last_name sätts vid registrering).

CREATE OR REPLACE FUNCTION public.get_workspace_members_with_email(p_workspace_id uuid)
RETURNS TABLE(
  user_id    uuid,
  email      text,
  role       text,
  first_name text,
  last_name  text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wm.user_id,
    u.email::text,
    wm.role,
    (u.raw_user_meta_data->>'first_name')::text AS first_name,
    (u.raw_user_meta_data->>'last_name')::text  AS last_name
  FROM workspace_members wm
  JOIN auth.users u ON u.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id;
$$;

-- Ge anon/authenticated åtkomst till funktionen
GRANT EXECUTE ON FUNCTION public.get_workspace_members_with_email(uuid) TO anon, authenticated;
