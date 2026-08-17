"use client";

import { LogOut, Settings2, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { StaffRoleBadge } from "@/components/status-badges";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  adminAccountInitials,
  useAdminAccountIdentity,
} from "@/lib/admin-account";
import { ADMIN_ACCOUNT_COPY } from "@/lib/authoring-copy";

/**
 * Header account menu. Identity remains browser-local until Admin has real
 * sign-in.
 */
export function AccountMenu() {
  const { identity } = useAdminAccountIdentity();
  const initials = adminAccountInitials(identity.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip open={labelOpen && !menuOpen} onOpenChange={setLabelOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={ADMIN_ACCOUNT_COPY.label}
            >
              <Avatar className="size-7.5">
                <AvatarImage src={ADMIN_ACCOUNT_COPY.avatarSrc} alt="" />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{ADMIN_ACCOUNT_COPY.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="min-w-60"
        side="bottom"
        align="end"
        sideOffset={4}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-3 px-1.5 py-1.5">
          <Avatar size="lg" className="size-12 shrink-0">
            <AvatarImage src={ADMIN_ACCOUNT_COPY.avatarSrc} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
            <AvatarBadge aria-hidden="true" />
          </Avatar>
          <span className="flex min-w-0 flex-col text-left">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {identity.name}
              </span>
              <StaffRoleBadge
                role={ADMIN_ACCOUNT_COPY.role}
                size="sm"
                className="shrink-0"
              />
            </span>
            <span className="type-meta truncate">{identity.email}</span>
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" prefetch>
            <UserRound aria-hidden="true" />
            {ADMIN_ACCOUNT_COPY.label}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" prefetch>
            <Settings2 aria-hidden="true" />
            {ADMIN_ACCOUNT_COPY.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => toast.info(ADMIN_ACCOUNT_COPY.signOutPlaceholder)}
        >
          <LogOut aria-hidden="true" />
          {ADMIN_ACCOUNT_COPY.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
