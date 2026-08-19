"use client";

import {
  Building2,
  HandHeart,
  LayoutDashboard,
  MapPin,
  MapPinned,
  PencilRuler,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  adminClientCrumbPeers,
  adminTourCatalog,
  getAdminClient,
  getAdminTour,
} from "@/lib/tour-catalog";
import { clientLogoUrl } from "@/lib/admin-media";

export interface CrumbPeers {
  value: string;
  options: Array<{
    value: string;
    label: string;
    image?: string;
    fallbackImage?: string;
  }>;
  hrefTemplate: string;
  label: string;
  imageFit?: "cover" | "contain";
  /** Person identity — circular avatar, including the no-photo fallback. */
  shape?: "circle";
}

export interface AdminCrumb {
  href?: string;
  label: string;
  image?: string;
  fallbackImage?: string;
  peers?: CrumbPeers;
}

export interface BreadcrumbState {
  currentPage: string;
  currentImage?: string;
  currentFallbackImage?: string;
  currentPeers?: CrumbPeers;
  parents: AdminCrumb[];
}

const BreadcrumbContext = createContext<{
  crumbs: BreadcrumbState;
  setCrumbs: (next: BreadcrumbState | null) => void;
}>({
  crumbs: { currentPage: "Admin", parents: [] },
  setCrumbs: () => undefined,
});

function tourCrumbPeers(tourId: string, hrefTemplate: string) {
  return {
    value: tourId,
    label: "Switch tour",
    hrefTemplate,
    imageFit: "cover" as const,
    options: adminTourCatalog.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  };
}

function crumbsFromPath(pathname: string): BreadcrumbState {
  if (pathname === "/" || pathname === "") {
    return { currentPage: "Overview", parents: [] };
  }
  if (pathname === "/overview") {
    return { currentPage: "Overview", parents: [] };
  }
  if (pathname === "/tours") {
    return { currentPage: "Tours", parents: [] };
  }
  if (pathname === "/clients") {
    return { currentPage: "Clients", parents: [] };
  }
  if (pathname === "/settings") {
    return { currentPage: "Settings", parents: [] };
  }
  if (pathname === "/users") {
    return { currentPage: "Users", parents: [] };
  }

  const clientTours = pathname.match(/^\/clients\/([^/]+)\/tours$/);
  if (clientTours) {
    const client = getAdminClient(clientTours[1]);
    return {
      currentPage: "Tours",
      parents: [
        { href: "/clients", label: "Clients" },
        {
          href: `/clients/${clientTours[1]}`,
          label: client?.name ?? clientTours[1],
          image: client ? clientLogoUrl(client.id) : undefined,
          peers: adminClientCrumbPeers(clientTours[1], "/clients/{id}/tours"),
        },
      ],
    };
  }

  const clientMatch = pathname.match(/^\/clients\/([^/]+)$/);
  if (clientMatch) {
    const client = getAdminClient(clientMatch[1]);
    return {
      currentPage: client?.name ?? clientMatch[1],
      currentImage: client ? clientLogoUrl(client.id) : undefined,
      currentPeers: adminClientCrumbPeers(clientMatch[1]),
      parents: [{ href: "/clients", label: "Clients" }],
    };
  }

  const sceneDetail = pathname.match(/^\/tours\/([^/]+)\/scenes\/([^/]+)$/);
  if (sceneDetail) {
    const tour = getAdminTour(sceneDetail[1]);
    return {
      currentPage: sceneDetail[2],
      parents: [
        { href: "/tours", label: "Tours" },
        {
          href: `/tours/${sceneDetail[1]}`,
          label: tour?.name ?? sceneDetail[1],
          peers: tourCrumbPeers(sceneDetail[1], "/tours/{id}/scenes"),
        },
        { href: `/tours/${sceneDetail[1]}/scenes`, label: "Scenes" },
      ],
    };
  }

  const scenes = pathname.match(/^\/tours\/([^/]+)\/scenes$/);
  if (scenes) {
    const tour = getAdminTour(scenes[1]);
    return {
      currentPage: "Scenes",
      parents: [
        { href: "/tours", label: "Tours" },
        {
          href: `/tours/${scenes[1]}`,
          label: tour?.name ?? scenes[1],
          peers: tourCrumbPeers(scenes[1], "/tours/{id}/scenes"),
        },
      ],
    };
  }

  const namings = pathname.match(/^\/tours\/([^/]+)\/namings$/);
  if (namings) {
    const tour = getAdminTour(namings[1]);
    return {
      currentPage: "Namings",
      parents: [
        { href: "/tours", label: "Tours" },
        {
          href: `/tours/${namings[1]}`,
          label: tour?.name ?? namings[1],
          peers: tourCrumbPeers(namings[1], "/tours/{id}/namings"),
        },
      ],
    };
  }

  const tour = pathname.match(/^\/tours\/([^/]+)$/);
  if (tour) {
    const item = getAdminTour(tour[1]);
    return {
      currentPage: item?.name ?? tour[1],
      currentPeers: tourCrumbPeers(tour[1], "/tours/{id}"),
      parents: [{ href: "/tours", label: "Tours" }],
    };
  }

  return { currentPage: "Admin", parents: [] };
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fallback = useMemo(() => crumbsFromPath(pathname), [pathname]);
  const [override, setOverride] = useState<{
    path: string;
    crumbs: BreadcrumbState;
  } | null>(null);

  const crumbs = override?.path === pathname ? override.crumbs : fallback;
  const setCrumbs = useCallback(
    (next: BreadcrumbState | null) => {
      setOverride(next ? { path: pathname, crumbs: next } : null);
    },
    [pathname],
  );

  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useAdminBreadcrumbs() {
  return useContext(BreadcrumbContext).crumbs;
}

/** Icon for a top-nav crumb — same marks as the page title / sidebar. */
export function renderNavIcon(
  href: string | undefined,
  label: string,
  pathname?: string,
): ReactNode {
  const path = href ?? pathname ?? "";
  const iconProps = {
    "aria-hidden": true,
    className:
      "icon-inline shrink-0 transition-colors duration-200 group-hover:text-primary",
  };

  if (label === "Overview" || path === "/overview") {
    return createElement(LayoutDashboard, iconProps);
  }
  if (label === "Tours" || path === "/tours") {
    return createElement(MapPinned, iconProps);
  }
  if (
    label === "Clients" ||
    path === "/clients" ||
    /^\/clients\/[^/]+$/.test(path)
  ) {
    return createElement(Building2, iconProps);
  }
  if (/^\/clients\/[^/]+\/tours$/.test(path)) {
    return createElement(MapPinned, iconProps);
  }
  if (label === "Settings" || path === "/settings") {
    return createElement(Settings2, iconProps);
  }
  if (label === "Account" || path === "/account") {
    return createElement(UserRound, iconProps);
  }
  if (label === "Users" || path === "/users") {
    return createElement(Users, iconProps);
  }
  if (
    label === "Scenes" ||
    /\/scenes$/.test(path) ||
    /\/scenes\/[^/]+$/.test(path)
  ) {
    return createElement(MapPin, iconProps);
  }
  if (label === "Namings" || /\/namings$/.test(path)) {
    return createElement(HandHeart, iconProps);
  }
  if (label === "Layout" || /\/edit$/.test(path)) {
    return createElement(PencilRuler, iconProps);
  }
  return null;
}

export function BreadcrumbSetter({
  currentPage,
  currentImage,
  currentFallbackImage,
  currentPeers,
  parents = [],
}: BreadcrumbState) {
  const { setCrumbs } = useContext(BreadcrumbContext);

  const parentsKey = JSON.stringify(parents);
  const peersKey = JSON.stringify(currentPeers);

  useLayoutEffect(() => {
    setCrumbs({
      currentPage,
      currentImage,
      currentFallbackImage,
      currentPeers,
      parents,
    });
  }, [
    currentPage,
    currentImage,
    currentFallbackImage,
    currentPeers,
    peersKey,
    parents,
    parentsKey,
    setCrumbs,
  ]);

  return null;
}
