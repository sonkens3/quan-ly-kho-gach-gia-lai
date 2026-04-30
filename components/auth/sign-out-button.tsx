"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { localSessionKey } from "@/lib/local/free-mode";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    window.localStorage.removeItem(localSessionKey);
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleSignOut}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Đăng xuất
    </Button>
  );
}
