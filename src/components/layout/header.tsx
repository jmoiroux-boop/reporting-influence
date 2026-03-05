import type { Profile } from "@/lib/types/database";
import { Shield, Eye } from "lucide-react";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Influence Marketing
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            profile.role === "admin"
              ? "bg-seb-red-light text-seb-red"
              : "bg-seb-cream-dark text-seb-gray"
          }`}
        >
          {profile.role === "admin" ? (
            <Shield className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          {profile.role === "admin" ? "Admin" : "Viewer"}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-seb-cream-dark flex items-center justify-center">
            <span className="text-xs font-medium text-seb-gray">
              {(profile.full_name || profile.email)
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {profile.full_name || profile.email}
            </p>
            {profile.full_name && (
              <p className="text-xs text-seb-gray">{profile.email}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
