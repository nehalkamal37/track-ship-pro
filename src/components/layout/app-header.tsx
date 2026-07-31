import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  "at-risk": "At-Risk Shipments",
  merchants: "Merchants",
  activity: "Activity Log",
  settings: "Settings",
  new: "Create",
};

function useCrumbs() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: LABELS[segment] ?? segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
    isLast: index === segments.length - 1,
  }));
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const crumbs = useCrumbs();
  const [term, setTerm] = useState("");

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate({ to: "/shipments", search: { search: term.trim() || undefined, page: 1 } });
  };

  const initials = (user?.name ?? "TF")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="shrink-0" />
      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <div className="hidden min-w-0 sm:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">TrackFlow</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="max-w-[180px] truncate">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href as "/dashboard"}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <form onSubmit={onSearch} role="search" className="ml-auto flex min-w-0 items-center">
        <label htmlFor="global-search" className="sr-only">
          Search shipments
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="global-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search tracking number or recipient"
            className="h-9 w-40 pl-8 sm:w-72"
          />
        </div>
      </form>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        className="relative shrink-0"
        onClick={() => toast.info("3 shipments need review", { description: "Open At-Risk Shipments for details." })}
      >
        <Bell className="size-4" aria-hidden="true" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" aria-hidden="true" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open user menu">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <span className="block truncate text-sm font-medium">{user?.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
            <span className="mt-1 inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-strong">
              {user?.role}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <User className="size-4" aria-hidden="true" />
              Profile & settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
