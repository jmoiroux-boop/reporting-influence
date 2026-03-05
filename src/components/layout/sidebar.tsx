"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Upload, History, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: Upload, adminOnly: true },
  { name: "Historique", href: "/history", icon: History },
];

interface SidebarProps {
  isAdmin: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-seb-red">
            <span className="text-white font-bold text-sm">SEB</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">
              Influence
            </h1>
            <p className="text-xs text-seb-gray">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-seb-red-light text-seb-red"
                  : "text-seb-gray hover:bg-seb-cream hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3 px-3">
          <BarChart3 className="h-4 w-4 text-seb-gray-light" />
          <span className="text-xs text-seb-gray-light">Groupe SEB</span>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
