import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
};

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean | null;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, is_active")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || user.email || "Người dùng",
    phone: profile?.phone ?? null,
    role: isUserRole(profile?.role) ? profile.role : "partner",
    isActive: profile?.is_active ?? false,
  };
}
