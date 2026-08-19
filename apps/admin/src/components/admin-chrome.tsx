'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AdminDebugMenu } from '@/components/admin-debug-menu';
import {
  AdminGuideDock,
  AdminGuideTrigger,
} from '@/components/admin-guide-panel';
import { AccountMenu } from '@/components/account-menu';
import { BrandedAvatar, PersonAvatar } from '@/components/branded-avatar';
import {
  BreadcrumbProvider,
  renderNavIcon,
  useAdminBreadcrumbs,
  type CrumbPeers,
} from '@/components/admin-breadcrumbs';
import { AppSidebar } from '@/components/app-sidebar';
import { ChartMotionGate } from '@/components/chart-motion-gate';
import {
  NavigationPendingProvider,
  NavigationProgress,
} from '@/components/navigation-progress';
import { PeerSwitcher } from '@/components/peer-switcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAdminAccentBoot } from '@/lib/admin-accent-store';
import { useShowAdminDebug } from '@/lib/admin-debug';
import { breadcrumbMediaLabelClass, cn } from '@/lib/utils';

function CrumbLabel({
  href,
  label,
  image,
  fallbackImage,
  imageFit = 'contain',
  shape,
  pathname,
}: {
  href?: string;
  label: string;
  image?: string;
  fallbackImage?: string;
  imageFit?: 'cover' | 'contain';
  shape?: 'circle';
  pathname: string;
}) {
  const personMark = shape === 'circle';
  const icon =
    image || personMark ? null : renderNavIcon(href, label, pathname);

  return (
    <span className={breadcrumbMediaLabelClass}>
      {personMark ?
        <PersonAvatar src={image} label={label} size='xs' />
      : image ?
        <BrandedAvatar
          src={image}
          fallbackSrc={fallbackImage}
          label={label}
          size='xs'
          fit={imageFit}
          loading='eager'
          className='h-5 w-7 shrink-0'
        />
      : icon}
      <span className='min-w-0 truncate underline-offset-4 transition-colors duration-200 group-hover:text-primary group-hover:underline'>
        {label}
      </span>
    </span>
  );
}

function CrumbSwitch({
  peers,
  current = false,
  fallbackImage,
  href,
}: {
  peers: CrumbPeers;
  current?: boolean;
  fallbackImage?: string;
  href?: string;
}) {
  return (
    <PeerSwitcher
      variant='crumb'
      current={current}
      label={peers.label}
      value={peers.value}
      options={peers.options}
      hrefTemplate={peers.hrefTemplate}
      imageFit={peers.imageFit}
      shape={peers.shape}
      fallbackImage={fallbackImage}
      href={href}
    />
  );
}

function AdminHeader() {
  const {
    currentPage,
    currentImage,
    currentFallbackImage,
    currentPeers,
    parents,
  } = useAdminBreadcrumbs();
  const pathname = usePathname();
  const debugMenu = useShowAdminDebug();

  return (
    <header className='sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75'>
      <SidebarTrigger className='-ml-1' />
      {/* Full-height rule — no height class, so the primitive's stretch spans the
          header and meets its bottom border. `mr-2` pays back the trigger's inner
          padding, keeping the optical gap even on both sides of the rule. */}
      <Separator orientation='vertical' className='mr-2' />
      <Breadcrumb className='min-w-0 flex-1'>
        <BreadcrumbList className='flex-nowrap'>
          {parents.map((parent, index) => {
            const sectionOnly = !parent.image && !parent.peers;
            const hideOnMobile = sectionOnly && index > 0;

            return (
              <Fragment key={parent.href ?? parent.label}>
                <BreadcrumbItem
                  className={cn(
                    hideOnMobile && 'hidden md:inline-flex',
                    sectionOnly ? 'shrink-0' : 'min-w-0 max-w-[min(14rem,42%)]',
                  )}
                >
                  {parent.peers && parent.peers.options.length > 1 ?
                    <CrumbSwitch
                      peers={parent.peers}
                      fallbackImage={parent.fallbackImage ?? parent.image}
                      href={parent.href}
                    />
                  : parent.href ?
                    <BreadcrumbLink asChild className='group'>
                      <Link
                        href={parent.href}
                        className='min-w-0'
                        title={parent.label}
                      >
                        <CrumbLabel
                          href={parent.href}
                          label={parent.label}
                          image={parent.image}
                          fallbackImage={parent.fallbackImage}
                          imageFit={parent.peers?.imageFit}
                          shape={parent.peers?.shape}
                          pathname={pathname}
                        />
                      </Link>
                    </BreadcrumbLink>
                  : <CrumbLabel
                      href={parent.href}
                      label={parent.label}
                      image={parent.image}
                      fallbackImage={parent.fallbackImage}
                      imageFit={parent.peers?.imageFit}
                      shape={parent.peers?.shape}
                      pathname={pathname}
                    />
                  }
                </BreadcrumbItem>
                <BreadcrumbSeparator
                  className={cn('shrink-0', hideOnMobile && 'hidden md:block')}
                />
              </Fragment>
            );
          })}
          <BreadcrumbItem className='min-w-0 flex-1'>
            {currentPeers && currentPeers.options.length > 1 ?
              <CrumbSwitch
                peers={currentPeers}
                current
                fallbackImage={currentFallbackImage ?? currentImage}
              />
            : <BreadcrumbPage className='min-w-0'>
                <CrumbLabel
                  label={currentPage}
                  image={currentImage}
                  fallbackImage={currentFallbackImage}
                  imageFit={currentPeers?.imageFit}
                  shape={currentPeers?.shape}
                  pathname={pathname}
                />
              </BreadcrumbPage>
            }
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {debugMenu.enabled ?
        <AdminDebugMenu />
      : null}
      <AdminGuideTrigger />
      <AccountMenu />
    </header>
  );
}

/** Persistent chrome — stays mounted across in-app navigations. */
export function AdminChrome({ children }: { children: ReactNode }) {
  useAdminAccentBoot();

  return (
    <BreadcrumbProvider>
      <NavigationPendingProvider>
        <SidebarProvider>
          <ChartMotionGate />
          <NavigationProgress />
          <AppSidebar />
          <SidebarInset className='h-svh min-h-0 overflow-hidden'>
            <AdminHeader />
            <div className='flex min-h-0 min-w-0 flex-1 overflow-hidden'>
              {/* The page scrolls here, not on <html>, so it needs the thin bar. */}
              <div className='ishare-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-auto [scrollbar-gutter:stable]'>
                {children}
              </div>
              <AdminGuideDock />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </NavigationPendingProvider>
    </BreadcrumbProvider>
  );
}
