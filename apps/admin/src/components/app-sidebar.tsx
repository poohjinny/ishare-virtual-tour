'use client';

import { useState } from 'react';

import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  MapPinned,
  Users,
  type LucideIcon,
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarResizeHandle,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  CLIENTS_PATH,
  TOURS_PATH,
  USERS_PATH,
  clientPath,
  tourPath,
} from '@/lib/admin-routes';
import { adminClientCatalog, adminTourCatalog } from '@/lib/tour-catalog';

const OVERVIEW_PATH = '/overview';

/** The rail lists a catalog, not a database: past this it links out instead. */
const CATALOG_PREVIEW_LIMIT = 12;

interface CatalogEntry {
  id: string;
  name: string;
  href: string;
}

interface CatalogSection {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Leading sub-item: the catalog page itself, above its entities. */
  allLabel: string;
  entries: CatalogEntry[];
}

function byName(a: CatalogEntry, b: CatalogEntry) {
  return a.name.localeCompare(b.name);
}

/**
 * Both groups read the same catalog the tour and client tables render, so the
 * rail cannot list an entity the pages do not have.
 */
const CATALOG_SECTIONS: CatalogSection[] = [
  {
    label: 'Tours',
    icon: MapPinned,
    href: TOURS_PATH,
    allLabel: 'All tours',
    entries: adminTourCatalog
      .map((tour) => ({
        id: tour.id,
        name: tour.name,
        href: tourPath(tour.id),
      }))
      .sort(byName),
  },
  {
    label: 'Clients',
    icon: Building2,
    href: CLIENTS_PATH,
    allLabel: 'All clients',
    entries: adminClientCatalog
      .map((client) => ({
        id: client.id,
        name: client.name,
        href: clientPath(client.id),
      }))
      .sort(byName),
  },
];

/** The route is that destination or lives beneath it. */
function isUnder(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <SidebarMenuButton asChild isActive={active} tooltip={label}>
      <Link href={href} prefetch aria-current={active ? 'page' : undefined}>
        <Icon aria-hidden='true' className='icon-inline' />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

/**
 * A catalog and the entities inside it: the row is the fold itself — it opens
 * and closes the group and never navigates. The catalog page is the fold's
 * first item, followed by its entities. The fold hides with the labels in the
 * collapsed icon rail, where the row expands the rail instead.
 */
function CatalogNav({
  pathname,
  section,
}: {
  pathname: string;
  section: CatalogSection;
}) {
  const { state: railState, setOpen: setRailOpen, isMobile } = useSidebar();
  const Icon = section.icon;
  const onCatalogPage = pathname === section.href;
  const inSection = isUnder(pathname, section.href);
  const [open, setOpen] = useState(inSection);
  const [wasInSection, setWasInSection] = useState(inSection);

  // Landing inside a tour or client opens its group so the rail shows where the
  // user is; leaving again leaves their own toggle alone.
  if (wasInSection !== inSection) {
    setWasInSection(inSection);
    if (inSection) setOpen(true);
  }

  const preview = section.entries.slice(0, CATALOG_PREVIEW_LIMIT);

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.label}
            // The row is a control, not a destination: it only thickens while
            // its own fold is open. The accent wash stays the current page's,
            // and here that page is an item inside the fold.
            className='group-data-[state=open]/menu-item:font-medium'
            onClick={(event) => {
              // The fold is hidden in the icon rail, so toggling there would be
              // a dead click: open the rail on this group instead. Preventing
              // default is how Radix's trigger skips its own toggle.
              if (railState === 'collapsed' && !isMobile) {
                event.preventDefault();
                setRailOpen(true);
                setOpen(true);
              }
            }}
          >
            <Icon aria-hidden='true' className='icon-inline' />
            <span>{section.label}</span>
            {/* Idle it is a quiet inline mark like the row's own icon; open, it
                is the one accent on a row that never fills. It fades rather
                than hides in the icon rail so it leaves on the collapse beat;
                the row's own overflow clips what is left of it. */}
            <ChevronRight
              aria-hidden='true'
              className='icon-inline ml-auto transition-[transform,color,opacity] duration-200 ease-out motion-reduce:transition-none group-data-[collapsible=icon]:opacity-0 group-data-[state=open]/menu-item:rotate-90 group-data-[state=open]/menu-item:text-sidebar-primary'
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='admin-sidebar-fold overflow-hidden'>
          <SidebarMenuSub>
            {/* The catalog page leads its own fold, so the row above it can
                stay a pure toggle. */}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={onCatalogPage}>
                <Link
                  href={section.href}
                  prefetch
                  aria-current={onCatalogPage ? 'page' : undefined}
                >
                  <span>{section.allLabel}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {preview.map((entry) => {
              const active = isUnder(pathname, entry.href);

              return (
                <SidebarMenuSubItem key={entry.id}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      href={entry.href}
                      prefetch
                      title={entry.name}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span>{entry.name}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center gap-1.5'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size='lg'
                tooltip='iShare Virtual Tour'
                className='py-1.5'
                asChild
              >
                <Link href={OVERVIEW_PATH} prefetch>
                  {/* shadcn's brand mark pattern: a rounded square that centers
                      the logo. Outline only — any fill read as a tinted chip
                      behind the transparent PNG. The tile fills the collapsed
                      rail, since `size='lg'` drops the button padding there. */}
                  <div className='flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border group-data-[collapsible=icon]:size-8'>
                    <Image
                      src='/brand/symbol_ishare.png'
                      alt=''
                      width={36}
                      height={36}
                      className='size-7 object-contain group-data-[collapsible=icon]:size-6.5'
                      aria-hidden='true'
                    />
                  </div>
                  {/* Shrinks with the rail like the Account footer does —
                      `min-w-0` lets it narrow, `whitespace-nowrap` stops it
                      reflowing on the way, and the fade covers the last
                      pixels rather than snapping the lockup off. */}
                  <div className='grid min-w-0 gap-0.5 text-left leading-tight whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none group-data-[collapsible=icon]:opacity-0'>
                    <span className='type-brand'>iShare Virtual Tour</span>
                    <span className='text-xs text-muted-foreground'>Admin</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* The home row leads the rail straight off the brand lockup, so it
            takes no label of its own. */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink
                  href={OVERVIEW_PATH}
                  label='Overview'
                  icon={LayoutDashboard}
                  active={isUnder(pathname, OVERVIEW_PATH)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Catalog</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CATALOG_SECTIONS.map((section) => (
                <CatalogNav
                  key={section.label}
                  pathname={pathname}
                  section={section}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* Local Admin treats every current identity as Master. Gate
                    this row by role when authentication lands. */}
                <NavLink
                  href={USERS_PATH}
                  label='Users'
                  icon={Users}
                  active={isUnder(pathname, USERS_PATH)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarResizeHandle />
    </Sidebar>
  );
}
