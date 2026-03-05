"use client";

import { signOut } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 px-3 py-2 text-sm text-seb-gray hover:text-seb-red transition-colors rounded-lg hover:bg-seb-red-light"
    >
      <LogOut className="h-4 w-4" />
      <span>Déconnexion</span>
    </button>
  );
}
