/**
 * Authoring labels and option wording mirror the viewer Dev panel. Admin field
 * descriptions and hints are intentionally written for the authoring surface;
 * sync only copy that represents the same concept in both UIs. References:
 * - apps/tour-viewer/src/constants/devPanel.ts
 * - apps/tour-viewer/src/constants/devHotspot.ts
 * - apps/tour-viewer/src/constants/devUrlFlags.ts
 * - apps/tour-viewer/src/components/dev/DevPanelExperienceSection.tsx
 */

export const AUTHORING_SURFACE = {
  overview: {
    label: "Overview",
    description:
      "Visual index of the local catalog — every client and tour with its baked scene thumbnail, branding, and size. Pick a tour here to jump straight into its settings, scenes, and namings.",
  },
  tours: {
    label: "Tours",
    description:
      "All tours in the catalog. Create a new tour under a client (with a first scene), open one in the viewer, copy its public link, or edit title, visibility, experience, and branding. Delete permanently removes tour JSON and assets.",
  },
  clients: {
    label: "Clients",
    description:
      "Catalog clients shared across tours — display name, contact, and branding (logo, color, fonts). Tours can inherit this branding or override it. Create clients here first, then add tours on the Tours tab.",
  },
  clientDetails: {
    label: "Details",
    description:
      "Review this client, then Edit to change contact or shared branding.",
  },
  clientTours: {
    label: "Tours",
    description: "All tours in the catalog for this client.",
  },
  details: {
    label: "Details",
    description:
      "Review this tour, then Edit to change details, experience, or branding.",
  },
  scenes: {
    label: "Scenes",
    description:
      "Build and organize every scene on this tour. Add new panoramas or viewpoints, edit titles and visibility, and reorder the Explore tour list. Group Up/Down changes list order only — not the nav-graph floor links visitors follow in the viewer.",
  },
  edit: {
    label: "Layout",
    openLabel: "Open layout",
    description:
      "Panorama layout — pick a scene, place and move hotspots in the live viewer, and set the opening camera. Everyday authoring happens here; Details and Scenes stay for catalog metadata and list management.",
  },
  scene: {
    label: "Scene",
    description:
      "Work on the place you are viewing right now. Set the landing camera and thumbnail, replace panorama or viewpoint media, and manage hotspots (nav links, naming pins, info, place overview) that sit in this scene.",
  },
  namings: {
    label: "Namings",
    description:
      "Tour-level naming opportunity catalog — the “what” (name, price, status, donor, body, and video). Create and edit entries here, then place them on a scene under Scene → Hotspots. Deleting a catalog entry also removes its hotspot placements.",
  },
  debug: {
    label: "Debug",
    description:
      "Local QA tools for this page. Toggle preserved URL flags without a reload, and open Tour Guide / chat / frozen UI fixtures to verify chrome and layouts while you author.",
  },
} as const;

/**
 * In-page iframe split heading. Header Preview and kebab Open preview still
 * open a new tab — same word, different destination.
 */
export const PREVIEW_PANE_COPY = {
  title: "Preview",
} as const;

export const CATALOG_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public (home gallery)" },
  { value: "unlisted", label: "Unlisted (direct link only)" },
  { value: "internal", label: "Internal (hidden from routing)" },
] as const;

export const SCENE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public (Explore)" },
  {
    value: "unlisted",
    label: "Unlisted (link only — hidden from Explore & nav)",
  },
  { value: "internal", label: "Internal (?dev=1 only)" },
] as const;

export const NAMING_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "sold", label: "Sold" },
  { value: "reserved", label: "Reserved" },
  { value: "soon", label: "Coming" },
] as const;

export const NAMING_DONOR_KIND_OPTIONS = [
  { value: "organization", label: "Organization" },
  { value: "person", label: "Person" },
] as const;

export const INFO_DISPLAY_OPTIONS = [
  { value: "anchored", label: "Anchored panel on panorama" },
  { value: "modal", label: "Modal overlay" },
] as const;

export const HOTSPOT_SECTION = {
  panorama: {
    title: "Hotspots",
    description:
      "Placements on this scene — nav, naming (where), info, and place overview. Naming business fields live on the naming opportunity.",
    emptyMessage: "No hotspots on this scene yet.",
    addButtonLabel: "Add hotspot",
  },
  model3d: {
    title: "Hotspots",
    description:
      "All placements on the 3D model — nav, naming (where), and info. Optional home viewpoint is for authoring; pins still appear in every view. Naming business fields live on the naming opportunity.",
    emptyMessage: "No hotspots on this model yet.",
    addButtonLabel: "Add hotspot",
  },
} as const;

/** Hotspot create / edit fields — mirrors Dev scene tab placeholders. */
export const HOTSPOT_FORM_COPY = {
  targetSection: "Type & target",
  targetSectionDescription:
    "Hotspot kind, visitor-facing label, and linked destination.",
  contentSection: "Content",
  contentSectionDescription: "Copy and display behavior for information pins.",
  placementSection: "Placement",
  placementSectionDescription:
    "Coordinates that place the marker in the viewer.",
  idDescription: "Stable identifier used by scene data and links.",
  typeDescription: "Determines what the hotspot opens or navigates to.",
  labelDescription: "Short label shown beside the hotspot marker.",
  labelPlaceholder: "e.g. Main Entrance",
  titleDescription: "Heading shown in the information panel.",
  titlePlaceholder: "e.g. Welcome Desk",
  bodyDescription: "Supporting copy shown in the information panel.",
  bodyPlaceholder: "Leave empty to use the hotspot title",
  displayDescription: "Chooses how the information panel opens.",
  targetSceneDescription: "Scene visitors enter when they select this hotspot.",
  targetScenePlaceholder: "Select a scene",
  namingDescription: "Opportunity represented by this placement.",
  namingPlaceholder: "Select an opportunity",
  positionDescription: "Marker coordinates on the panorama or 3D model.",
} as const;

export const NAMING_CATALOG_SECTION = {
  title: "Add naming",
  description:
    "Create a naming opportunity, then place it from Scene → Hotspots.",
  emptyMessage:
    "No naming opportunities yet. Add one, then place under Scene → Hotspots.",
  addButtonLabel: "Add naming",
  createButtonLabel: "Create naming",
  manageTitle: "Naming list",
  manageDescription:
    "Naming opportunities for this tour — status, price, donor, and copy. Place pins from Layout or Scene → Hotspots.",
} as const;

export const EXPERIENCE_COPY = {
  sectionTitle: "Experience",
  sectionDescription: "Scene transitions and immersive background audio.",
  transitionEffect: "Scene transition",
  transitionEffectDescription: "Visual effect used between scenes.",
  transitionSpeed: "Transition speed",
  transitionSpeedDescription: "Duration of the scene transition.",
  transitionSpeedPlaceholder: "500ms",
  immersiveMode: "Immersive background (BGM)",
  immersiveModeDescription:
    "Selects the background audio source for this tour.",
  immersiveModes: [
    { value: "platform", label: "Platform default playlist" },
    { value: "manifest", label: "Playlist manifest JSON" },
    { value: "audio", label: "Single audio track" },
    { value: "playlist", label: "Inline playlist" },
  ] as const,
  platformDescription: "Uses the platform immersive playlist manifest.",
  audioLabel: "Audio path or URL",
  audioPlaceholder: "/assets/…/ambient.mp3",
  audioDescription: "One looping track for this tour.",
  playlistLabel: "Playlist tracks",
  playlistPlaceholder: "One track URL/path per line",
  playlistDescription: "Plays the listed tracks as the tour background.",
  manifestLabel: "Playlist manifest path",
  manifestPlaceholder: "/assets/brand/immersive-playlist-tour.json",
  manifestDescription: "Accepts a JSON playlist manifest path or URL.",
  volumeLabel: "Volume (0–1)",
  volumePlaceholder: "0.28",
  volumeDescription: "0 is silent; 1 is full volume.",
} as const;

export const BRANDING_COPY = {
  sectionTitle: "Branding",
  sectionDescription:
    "Choose whether this tour inherits client branding or overrides logo, color, and fonts for this tour only.",
  modes: [
    { value: "client", label: "Use client branding (shared)" },
    { value: "custom", label: "Custom branding for this tour only" },
  ] as const,
  modeClientHint:
    "Inherits shared branding from the Client tab. Switch to custom to override on this tour only.",
  modeCustomHint: "Stored on this tour JSON only — overrides the client brand.",
  primaryColor: "Primary color",
  primaryColorPlaceholder: "#007b8b",
  primaryColorDescription: "Used in viewer chrome and branded controls.",
  brandFont: "Brand font",
  brandFontDescription:
    "Used for branded viewer text — pick a font, or name any Google Font.",
  brandFontDefault: "Platform default",
  brandFontGoogle: "Google font…",
  brandFontGoogleSelected: "Google font",
  brandFontNameLabel: "Google font name",
  brandFontPlaceholder: "e.g. Nunito",
  brandFontCustomHint:
    "Loaded from fonts.googleapis.com at weights 400 and 600.",
  brandFontChecking: "Checking Google Fonts…",
  brandFontInvalid:
    "No Google Font with that name. Check the spelling (e.g. Open Sans).",
  brandFontBrowse: "Browse Google Fonts",
  brandFontPreview: "Font preview",
  brandFontPreviewText: "The quick brown fox jumps over the lazy dog.",
  fontFamily: "Font family (CSS stack)",
  fontFamilyPlaceholder: "'Montserrat', Arial, sans-serif",
  fontFamilyDescription: "Family name followed by browser-safe fallbacks.",
  fontSource: "Google Fonts URL",
  fontSourcePlaceholder: "https://fonts.googleapis.com/css2?family=…",
  fontSourceDescription: "Stylesheet that loads the selected family.",
  fontSourceHint: "Use an HTTPS URL from fonts.googleapis.com.",
  logoUpload: "Logo",
  logoUploadDescription: "PNG or SVG shown in viewer chrome and admin.",
  faviconUpload: "Favicon (optional)",
  faviconUploadDescription: "Tab icon for the public tour.",
} as const;

export const TOUR_FORM_COPY = {
  addTitle: "Add tour",
  addDescription:
    "Create a new tour under a catalog client (with a first scene).",
  manageTitle: "Tour list",
  detailsSection: "Details",
  detailsSectionDescription:
    "Catalog title, summary, visibility, and Tour Guide.",
  clientSection: "Client",
  clientSectionDescription:
    "Tours belong to a catalog client. Create clients first if needed.",
  clientDescription: "Catalog client that owns and brands this tour.",
  clientPlaceholder: "Select a client",
  tourTitle: "Tour title",
  tourTitlePlaceholder: "e.g. Main Campus",
  tourTitleDescription: "Primary tour name shown in admin and the viewer.",
  tourSummary: "Tour summary (optional)",
  tourSummaryPlaceholder: "e.g. Explore our facilities and programs",
  tourSummaryDescription: "Shown on the home gallery card.",
  catalogVisibility: "Catalog visibility",
  categoryDescription: "Groups the tour in catalog filters and reporting.",
  catalogVisibilityDescription:
    "Controls where the tour appears and how visitors can open it.",
  askGuide: "Enable Ask Tour Guide",
  askGuideDescription: "Shows the Tour Guide button in the public viewer.",
  firstSceneSection: "First scene",
  firstSceneSectionDescription:
    "Opening panorama visitors land on when the tour starts.",
  firstSceneTitle: "First scene title",
  firstSceneTitlePlaceholder: "e.g. Overview",
  firstSceneTitleDescription: "Name of the opening scene visitors enter first.",
  firstPanorama: "First panorama",
  firstPanoramaDescription: "Equirectangular image for the first scene.",
  createButton: "Create tour",
  clientManageDescription:
    "Every tour this client owns. Open a tour to edit its scenes, hotspots, and namings.",
} as const;

export const SCENE_FORM_COPY = {
  addTitle: "Add scene",
  addPanoramaDescription:
    "Upload a panorama and optional place-overview hotspot.",
  addModel3dDescription: "Creates a new viewpoint on the shared 3D model.",
  manageTitle: "Scene list",
  manageDescription:
    "Every scene on this tour, with Explore list order. Reorder, duplicate, or delete here — Up/Down changes list order only, not nav-graph floor links.",
  basicsSection: "Basics",
  basicsSectionDescription: "Scene title, description, and catalog visibility.",
  mediaSection: "Media",
  mediaSectionDescription:
    "Panorama, supporting videos, and optional place overview.",
  titlePlaceholder: "e.g. Main Entrance",
  titleDescription: "Scene name shown in Explore and navigation.",
  visibilityDescription:
    "Controls whether the scene appears in Explore and visitor navigation.",
  descriptionPlaceholder: "e.g. Welcome to the main entrance",
  descriptionDescription:
    "Shown in place overview and Explore; used as the naming fallback.",
  previewVideo: "Preview video URL",
  previewVideoPlaceholder: "Synthesia / YouTube preview URL",
  previewVideoDescription: "Short clip shown before entering the scene.",
  bodyVideo: "Body video URL",
  bodyVideoPlaceholder: "YouTube / Vimeo body video URL",
  bodyVideoDescription: "Opens from the place overview or scene body.",
  createPlaceOverview: "Create place overview hotspot",
  createPlaceOverviewDescription:
    "Adds an Overview hotspot on this scene when it is created.",
  createPlaceOverviewHint:
    "Off by default — add Overview later under Hotspots if needed.",
  setAsFirstScene: "Set as first scene",
  setAsFirstSceneDescription: "Makes this scene the tour landing scene.",
  setAsFirstSceneHint: "Landing scene when the tour opens.",
  applyDefaultView: "Apply default view",
  applyDefaultViewDescription:
    "Opening camera for this scene when visitors arrive.",
  applyDefaultViewHint:
    "Look around in the preview, then apply the current camera as this scene’s opening view.",
  replacePanorama: "Replace panorama",
  replacePanoramaDescription: "New equirectangular image for this scene.",
  replacePanoramaHint: "Replaces the current panorama asset for this scene.",
  panoramaFileDescription: "Equirectangular image for this scene.",
  duplicateCloneNaming: "Clone naming opportunities",
  duplicateLinkParent: "Link under same parent",
  duplicateIncludeChildren: "Include child places",
  createButton: "Create scene",
  saveButton: "Save scene",
} as const;

export const CLIENT_FORM_COPY = {
  addTitle: "Add client",
  manageTitle: "Client list",
  description:
    "Catalog clients shared across tours — display name, contact, and branding (logo, color, fonts).",
  identity: "Identity",
  identityDescription: "Catalog name, stable id, and public website.",
  contact: "Contact",
  contactDescription: "Public email, address, phone, and fax details.",
  sharedBranding: "Shared branding",
  sharedBrandingDescription:
    "Logo, favicon, color, and font inherited by client-branded tours.",
  clientName: "Client name",
  clientNamePlaceholder: "Foundation",
  clientNameDescription: "Display name used across admin and client branding.",
  clientNameCreateDescription:
    "Creates a catalog client only — add tours afterward from Tours.",
  clientId: "Client id (optional)",
  clientIdPlaceholder: "e.g. examplefoundation",
  clientIdDescription:
    "Leave empty to derive it from the website hostname without its TLD.",
  website: "Website",
  websitePlaceholder: "https://example.org",
  websiteDescription:
    "Used to suggest contact and branding from the public site.",
  email: "Email",
  emailPlaceholder: "info@example.org",
  emailDescription: "Primary public contact email for the client.",
  emailEmpty: "Not available",
  phone: "Phone",
  phonePlaceholder: "e.g. (416) 555-0100",
  phoneDescription: "Primary public contact number.",
  phoneLabel: "Phone label",
  phoneLabelPlaceholder: "e.g. Main line",
  phoneLabelDescription: "Short name displayed with the phone number.",
  fax: "Fax",
  faxPlaceholder: "e.g. (416) 555-0101",
  faxDescription: "Public fax number, when available.",
  faxLabel: "Fax label",
  faxLabelPlaceholder: "e.g. Fax",
  faxLabelDescription: "Short name displayed with the fax number.",
  address: "Address",
  addressPlaceholder: "Street, City, Region",
  addressDescription: "Mailing or primary location shown for the client.",
  suggestContact: "Suggest contact from website",
  suggestBranding: "Suggest branding from website",
  createButton: "Create client",
  saveButton: "Save client",
} as const;

export const NAMING_FORM_COPY = {
  basicsSection: "Basics",
  basicsSectionDescription: "Name, price, status, and catalog visibility.",
  contentSection: "Content",
  contentSectionDescription: "Body copy and video for the naming card.",
  donorSection: "Donor",
  donorSectionDescription: "Recognition details when the opportunity is sold.",
  placementsSection: "Placements",
  nameOptional: "Name (optional)",
  namePlaceholder: "Uses scene title when empty",
  nameDescription: "Public name of this naming opportunity.",
  hostSceneDescription: "Scene used for fallback title, copy, and media.",
  priceDescription: "Displayed fundraising amount for the opportunity.",
  statusDescription: "Current sales state shown in the naming catalog.",
  visibilityDescription: "Controls whether visitors can see the opportunity.",
  pricePlaceholder: "e.g. 75000",
  bodyDescription: "Main recognition copy shown on the naming card.",
  bodyPlaceholder: "Uses scene description when empty",
  bodyHint: "Supports **bold** and *italic*.",
  videoUrl: "Video URL",
  videoUrlPlaceholder: "Uses scene preview video when empty",
  videoUrlDescription: "Video opened from the naming card.",
  donorName: "Donor name",
  donorNamePlaceholder: "Jane Smith",
  donorNameDescription:
    "Recognized donor displayed after the opportunity is sold.",
  donorKind: "Donor kind",
  donorKindDescription:
    "Whether the recognized donor is a person or organization.",
  donorAffiliation: "Donor affiliation",
  donorAffiliationPlaceholder: "e.g. ABC Foundation",
  donorAffiliationDescription:
    "Organization or relationship shown with the donor.",
  donorWebsite: "Donor website",
  donorWebsitePlaceholder: "https://example.org",
  donorWebsiteDescription: "Link opened from the donor recognition.",
  duplicateIncludePlacements: "Include placements",
  duplicateIncludePlacementsDescription:
    "Copies the scene hotspots that place this opportunity.",
  duplicateResetAsOpen: "Reset as open (clear donor)",
  duplicateResetAsOpenDescription:
    "Creates the copy as available and removes donor details.",
} as const;

export const DEBUG_FLAG_TOGGLES = [
  {
    key: "notFoundTest",
    label: "Not-found screen",
    hint: "Force tour not-found (404) screen",
    group: "url",
  },
  {
    key: "loadErrorTest",
    label: "Load-error overlay",
    hint: "Force load-error overlay (panorama + 3D)",
    group: "url",
  },
  {
    key: "disableNavPreview",
    label: "Disable nav preview",
    hint: "Disable nav hotspot mini viewer",
    group: "url",
  },
  {
    key: "skipLanding",
    label: "Skip landing",
    hint: "Skip landing zoom — start at defaultView",
    group: "url",
  },
  {
    key: "splashHold",
    label: "Splash hold",
    hint: "Hold load splash longer",
    group: "url",
  },
  {
    key: "firstVisitHint",
    label: "First-visit hint",
    hint: "Show look-around coach pill in embed/dev",
    group: "url",
  },
  {
    key: "askGuide",
    label: "Show Tour Guide",
    hint: "Force on (`1`) or off (`0`). When unset, uses the tour’s Enable Ask Tour Guide setting",
    group: "guide",
  },
  {
    key: "guideMock",
    label: "Mock replies",
    hint: "Chat with scripted mock replies + short think delay — no OpenAI tokens",
    group: "guide",
  },
  {
    key: "guideUiTest",
    label: "Frozen UI preview",
    hint: "Markdown sample, scroll fixtures, thinking, FAB bubble, notice + error with Retry (no chat / no API)",
    group: "guide",
  },
] as const;

/**
 * Local Account identity and session copy. Name, email, and phone are the
 * defaults until a browser-local profile is saved; swap the local source for
 * the session user once auth lands.
 */
export const ADMIN_ACCOUNT_COPY = {
  label: "Account",
  name: "William Petruck",
  email: "wpetruck@fundingmatters.com",
  phone: "+1 (416) 555-0142",
  role: "Master",
  avatarSrc: "/brand/account-avatar.webp",
  description:
    "Personal identity and session information for this Admin environment.",
  identityStatus: "Local identity",
  identityDescription:
    "Edit how your development identity appears throughout this browser.",
  form: {
    emptyName: "Unnamed author",
    name: {
      label: "Display name",
      description: "Shown in the Admin account menu and local authoring UI.",
      placeholder: "e.g. William Petruck",
      maxLength: 80,
    },
    email: {
      label: "Email",
      description:
        "Display-only contact information until sign-in is connected.",
      placeholder: "name@example.org",
      maxLength: 254,
    },
    phone: {
      label: "Phone",
      description:
        "Display-only contact number until sign-in is connected.",
      placeholder: "e.g. +1 (416) 555-0142",
      maxLength: 32,
    },
    roleLabel: "Role",
    persistenceHint:
      "Name, email, and phone are saved only in this browser. They do not create or update an authenticated account.",
    save: "Save identity",
    success: "Local identity saved in this browser.",
    error: "Local identity could not be saved.",
  },
  accessTitle: "Access and session",
  accessDescription:
    "Admin currently runs without sign-in or a persisted user account.",
  accessStatus: "Authentication unavailable",
  accessDetail:
    "This local authoring identity is not an authenticated session. Passwords and account-level actions remain unavailable until sign-in is connected.",
  preferencesDetail:
    "Theme and workspace preferences are managed separately in Settings.",
  openSettings: "Open Settings",
  settings: "Settings",
  signOut: "Sign out",
  signOutPlaceholder: "Sign out is a preview — Admin has no sign-in yet.",
} as const;

/**
 * Header Admin Guide — authoring assistant shell. Mock replies only until
 * tools / product Q&A land. Not the viewer Tour Guide.
 * Overview: docs/engineering/ADMIN_GUIDE.md
 */
export const ADMIN_GUIDE_COPY = {
  label: "Guide",
  title: "Admin Guide",
  description: "Authoring help and product Q&A",
  placeholder: "Ask about tours, clients, or how something works…",
  listeningPlaceholder: "Listening…",
  send: "Send",
  voice: "Voice input",
  voiceStop: "Stop listening",
  voiceUnsupported: "Voice input unavailable in this browser",
  close: "Hide Guide",
  open: "Show Guide",
  reset: "Reset conversation",
  resize: "Resize Guide panel",
  emptyHint: "Try one of these, or ask your own question.",
  stop: "Stop generating",
  scrollToBottom: "Scroll to bottom",
  thinkingPhrases: [
    "Thinking…",
    "Looking that up…",
    "Checking the catalog…",
  ] as const,
  welcome:
    "Hi — I’m the Admin Guide. I can help with authoring tasks and product questions once I’m wired up. For now, send a message to see the chat layout.",
  mockReply:
    "Got it. Live answers and CRUD helpers aren’t connected yet — this is the panel shell so we can grow the assistant next. Try asking about creating a tour, editing a tour, visibility, or client branding.",
} as const;

/**
 * Admin chrome Debug — not the viewer preview Debug menu.
 * Viewer URL flags / viewport / Tour Guide stay on the preview card.
 */
export const ADMIN_DEBUG_COPY = {
  label: "Debug",
  description:
    "Admin chrome fixtures. Viewer flags stay on the preview Debug menu.",
  /** Section labels in the Debug dropdown. */
  chromeGroup: "Chrome",
  guide: { group: "Admin Guide", label: "Scenarios" },
  toasts: {
    label: "Toasts",
    off: { label: "Off", hint: "Dismiss the debug toast" },
    success: {
      label: "Success",
      hint: "Form save result — no CTA",
      sample: "Tour saved to local JSON.",
    },
    error: {
      label: "Error",
      hint: "Form failure with Retry",
      sample: "Tour save failed.",
      action: "Retry",
    },
    loading: {
      label: "Loading",
      hint: "Stays until Cancel, Off, or another toast",
      sample: "Saving…",
      action: "Cancel",
    },
    resolve: {
      label: "Resolve loading",
      hint: "Turn the loading toast into success — no CTA",
      sample: "Tour saved to local JSON.",
    },
    reject: {
      label: "Reject loading",
      hint: "Turn the loading toast into error with Retry",
      sample: "Tour save failed.",
      action: "Retry",
    },
  },
  preview: {
    label: "Preview",
    pauseIframe: {
      label: "Pause preview iframe",
      hint: "Unload the viewer and prevent it from loading while you work on Admin chrome",
    },
    forceSkeleton: {
      label: "Image skeletons",
      hint: "Hide media and hold the viewer shimmer so you can check the fixture",
    },
    paused:
      "Preview paused. Turn off Pause preview iframe in Admin Debug.",
  },
  navigation: {
    label: "Navigation",
    forceProgress: {
      label: "Route progress",
      hint: "Replays full runs on a loop — trickle, arrive at 100%, fade — without navigating",
    },
  },
  chrome: {
    label: "Show Debug menu",
    hint: "Places Admin Debug on the breadcrumb header (toasts, preview, route progress).",
    cardTitle: "Debug",
    cardDescription:
      "Admin chrome fixtures. Viewer flags stay on the preview Debug menu.",
  },
} as const;

export const DEBUG_VIEWPORT_COPY = {
  off: {
    label: "Off",
    hint: "Live stage in the main window (no device / embed frame)",
  },
  device: {
    label: "Device mode",
    hint: "Device presets / Responsive — layout, rem, and breakpoint QA (no embed delivery)",
  },
  embed: {
    label: "Embed mode",
    hint: "Host iframe harness — embed=1 chrome, Messages log, copy URL / iframe HTML",
  },
} as const;
