'use client';

import { type FormEvent, useMemo, useState } from 'react';
import {
  AlignLeft,
  Building2,
  Eye,
  Gauge,
  Headphones,
  Info,
  MessageCircle,
  Palette,
  Repeat,
  Save,
  Sparkles,
  Tag,
  Type,
  View,
  Volume2,
  Link,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  AUTHORING_SHEET_BODY_CLASS,
  AUTHORING_SHEET_CLASS,
} from '@/components/create-panel-shell';
import { BrandFontField } from '@/components/brand-font-field';
import { ColorHexInput, ColorSwatch } from '@/components/color-swatch';
import {
  CheckboxField,
  CollapsibleFormSection,
  FormDescription,
  FormField,
  FormHint,
} from '@/components/form-field';
import { FileInput } from '@/components/file-input';
import { useHeaderEdit } from '@/components/header-edit';
import {
  FormCancelButton,
  InfoField,
  InfoFieldList,
  InfoLink,
  StickyFormActions,
} from '@/components/form-status';
import { PendingButton } from '@/components/pending-button';
import { InputGroup } from '@/components/input-group';
import { ViewerTypeBadge, VisibilityBadge } from '@/components/status-badges';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import { colorLabelClass } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  fileToBase64,
  updateLocalTour,
  type AdminTourUpdate,
} from '@/lib/admin-dev-api';
import {
  AUTHORING_SURFACE,
  BRANDING_COPY,
  CATALOG_VISIBILITY_OPTIONS,
  EXPERIENCE_COPY,
  TOUR_FORM_COPY,
} from '@/lib/authoring-copy';
import {
  clientFaviconUrls,
  clientLogoUrl,
  tourFaviconUrls,
  tourLogoUrl,
} from '@/lib/admin-media';
import { adminTourCategories } from '@/lib/tour-catalog';
import type {
  AdminBrandingMode,
  AdminImmersiveMode,
  AdminTourDetail,
  AdminTransitionEffect,
} from '@/lib/tour-detail';

function derivedLogoAlt(tour: AdminTourDetail): string {
  return (
    tour.clientBranding.logoAlt.trim() ||
    tour.clientName.trim() ||
    tour.title.trim()
  );
}

function toFormValues(tour: AdminTourDetail): AdminTourUpdate {
  return {
    tourTitle: tour.title,
    tourSummary: tour.summary,
    category: tour.category,
    visibility: tour.visibility,
    askGuideEnabled: tour.askGuideEnabled,
    productFullName: tour.productFullName,
    brandingMode: tour.brandingMode,
    primaryColor: tour.branding.primaryColor,
    logoAlt: derivedLogoAlt(tour),
    fontFamily: tour.branding.fontFamily,
    fontSourceUrl: tour.branding.fontSourceUrl,
    clearFontFamily: false,
    clearFontSourceUrl: false,
    transitionEffect: tour.transitionEffect,
    transitionSpeed: tour.transitionSpeed,
    immersiveMode: tour.immersiveMode,
    immersiveAudio: tour.immersiveAudio,
    immersivePlaylistText: tour.immersivePlaylistText,
    immersivePlaylistManifest: tour.immersivePlaylistManifest,
    immersiveVolume: tour.immersiveVolume,
  };
}

export function TourEditorPanel({
  canEdit,
  categories = adminTourCategories,
  tour,
  info = true,
  open: openProp,
  onOpenChange,
}: {
  canEdit: boolean;
  categories?: string[];
  tour: AdminTourDetail;
  /** Details tab shows the info card. Other workspace tabs keep the Edit sheet only. */
  info?: boolean;
  /** Controlled sheet — used by the Tours catalog Edit action. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const initialValues = useMemo(() => toFormValues(tour), [tour]);
  const [form, setForm] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const localEdit = useState(false);
  const headerEdit = useHeaderEdit();
  const editOpen = openProp ?? headerEdit?.open ?? localEdit[0];
  const setEditOpen = onOpenChange ?? headerEdit?.setOpen ?? localEdit[1];

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedValues) ||
    logoFile !== null ||
    faviconFile !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const logoFileBase64 =
        logoFile ? await fileToBase64(logoFile) : undefined;
      const faviconFileBase64 =
        faviconFile ? await fileToBase64(faviconFile) : undefined;
      await updateLocalTour(tour.id, {
        ...form,
        logoAlt: derivedLogoAlt(tour),
        logoFileBase64,
        faviconFileBase64,
      });
      setSavedValues({ ...form, logoAlt: derivedLogoAlt(tour) });
      setLogoFile(null);
      setFaviconFile(null);
      showFormSuccess('Tour saved to local JSON.');
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      showFormError(error, 'Tour save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const immersiveLabel =
    EXPERIENCE_COPY.immersiveModes.find(
      (option) => option.value === savedValues.immersiveMode,
    )?.label ?? savedValues.immersiveMode;
  const brandingLabel =
    BRANDING_COPY.modes.find(
      (option) => option.value === savedValues.brandingMode,
    )?.label ?? savedValues.brandingMode;

  // Custom branding keeps its own files under the tour; client mode shows what
  // the tour inherits, so the field always previews the asset in effect.
  const usesTourAssets = form.brandingMode === 'custom';
  const savedLogoUrl =
    usesTourAssets ?
      tour.branding.hasLogo ?
        tourLogoUrl(tour.clientId, tour.id)
      : undefined
    : clientLogoUrl(tour.clientId);
  const savedFaviconUrls =
    usesTourAssets ?
      tour.branding.hasFavicon ?
        tourFaviconUrls(tour.clientId, tour.id)
      : undefined
    : clientFaviconUrls(tour.clientId);

  return (
    <>
      {info ?
        <Card className='max-h-full min-h-0'>
          <CardHeader className='shrink-0'>
            <CardTitle>{AUTHORING_SURFACE.details.label}</CardTitle>
          </CardHeader>
          <CardContent className='ishare-scrollbar min-h-0 flex-1 overflow-y-auto'>
            <InfoFieldList layout='stack'>
              <InfoField icon={Type} label='Title'>
                {savedValues.tourTitle}
              </InfoField>
              <InfoField icon={Building2} label='Client'>
                <InfoLink href={`/clients/${tour.clientId}`}>
                  {tour.clientName}
                </InfoLink>
              </InfoField>
              <InfoField icon={Tag} label='Category'>
                {savedValues.category}
              </InfoField>
              <InfoField icon={Eye} label='Visibility'>
                <VisibilityBadge visibility={savedValues.visibility} />
              </InfoField>
              <InfoField icon={View} label='Viewer'>
                <ViewerTypeBadge viewerType={tour.viewerType} />
              </InfoField>
              <InfoField icon={MessageCircle} label='Tour Guide'>
                {savedValues.askGuideEnabled ? 'On' : 'Off'}
              </InfoField>
              <InfoField icon={AlignLeft} label='Summary'>
                {savedValues.tourSummary || '—'}
              </InfoField>
              <InfoField icon={Repeat} label='Transition'>
                {savedValues.transitionEffect}
              </InfoField>
              <InfoField icon={Headphones} label='Immersive'>
                {immersiveLabel}
              </InfoField>
              <InfoField icon={Palette} label='Branding'>
                <span className='flex flex-col gap-1'>
                  {brandingLabel}
                  <span className={colorLabelClass}>
                    {savedValues.primaryColor ?
                      <ColorSwatch color={savedValues.primaryColor} />
                    : null}
                    {savedValues.primaryColor || '—'}
                  </span>
                </span>
              </InfoField>
            </InfoFieldList>
          </CardContent>
        </Card>
      : null}

      <Sheet
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setForm(savedValues);
            setLogoFile(null);
            setFaviconFile(null);
          }
        }}
      >
        <SheetContent className={AUTHORING_SHEET_CLASS}>
          <SheetHeader>
            <SheetTitle>Edit tour</SheetTitle>
            <SheetDescription>
              {AUTHORING_SURFACE.tours.description}
            </SheetDescription>
          </SheetHeader>
          <div className={AUTHORING_SHEET_BODY_CLASS}>
            <form className='admin-form' onSubmit={handleSubmit}>
              <CollapsibleFormSection
                title={TOUR_FORM_COPY.detailsSection}
                icon={Info}
                description={TOUR_FORM_COPY.detailsSectionDescription}
                defaultOpen
              >
                {!canEdit ?
                  <FormHint>
                    Local editing is available in development only.
                  </FormHint>
                : null}

                <div className='grid gap-2'>
                  <Label htmlFor='tour-title'>{TOUR_FORM_COPY.tourTitle}</Label>
                  <FormDescription>
                    {TOUR_FORM_COPY.tourTitleDescription}
                  </FormDescription>
                  <InputGroup icon={Type}>
                    <Input
                      id='tour-title'
                      value={form.tourTitle}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tourTitle: event.target.value,
                        }))
                      }
                      placeholder={TOUR_FORM_COPY.tourTitlePlaceholder}
                      disabled={!canEdit}
                      required
                    />
                  </InputGroup>
                </div>

                <FormField
                  label={TOUR_FORM_COPY.tourSummary}
                  htmlFor='tour-summary'
                  description={TOUR_FORM_COPY.tourSummaryDescription}
                >
                  <Textarea
                    id='tour-summary'
                    value={form.tourSummary}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tourSummary: event.target.value,
                      }))
                    }
                    placeholder={TOUR_FORM_COPY.tourSummaryPlaceholder}
                    disabled={!canEdit}
                  />
                </FormField>

                <div className='grid gap-2 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-category'>Category</Label>
                    <FormDescription>
                      {TOUR_FORM_COPY.categoryDescription}
                    </FormDescription>
                    <InputGroup icon={Tag}>
                      <Select
                        value={form.category}
                        onValueChange={(category) =>
                          setForm((current) => ({ ...current, category }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger id='tour-category'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </InputGroup>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-visibility'>
                      {TOUR_FORM_COPY.catalogVisibility}
                    </Label>
                    <FormDescription>
                      {TOUR_FORM_COPY.catalogVisibilityDescription}
                    </FormDescription>
                    <InputGroup icon={Eye}>
                      <Select
                        value={form.visibility}
                        onValueChange={(visibility) =>
                          setForm((current) => ({
                            ...current,
                            visibility:
                              visibility as AdminTourUpdate['visibility'],
                          }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger id='tour-visibility'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATALOG_VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </InputGroup>
                  </div>
                </div>

                <CheckboxField
                  id='tour-ask-guide'
                  label={TOUR_FORM_COPY.askGuide}
                  description={TOUR_FORM_COPY.askGuideDescription}
                  checked={form.askGuideEnabled}
                  onCheckedChange={(askGuideEnabled) =>
                    setForm((current) => ({ ...current, askGuideEnabled }))
                  }
                  disabled={!canEdit}
                />
              </CollapsibleFormSection>

              <CollapsibleFormSection
                title={EXPERIENCE_COPY.sectionTitle}
                icon={Sparkles}
                description={EXPERIENCE_COPY.sectionDescription}
              >
                <div className='grid gap-2 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-transition-effect'>
                      {EXPERIENCE_COPY.transitionEffect}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.transitionEffectDescription}
                    </FormDescription>
                    <InputGroup icon={Repeat}>
                      <Select
                        value={form.transitionEffect}
                        onValueChange={(transitionEffect) =>
                          setForm((current) => ({
                            ...current,
                            transitionEffect:
                              transitionEffect as AdminTransitionEffect,
                          }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger id='tour-transition-effect'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='fade'>Fade</SelectItem>
                          <SelectItem value='black'>Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </InputGroup>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-transition-speed'>
                      {EXPERIENCE_COPY.transitionSpeed}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.transitionSpeedDescription}
                    </FormDescription>
                    <InputGroup icon={Gauge}>
                      <Input
                        id='tour-transition-speed'
                        value={form.transitionSpeed}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            transitionSpeed: event.target.value,
                          }))
                        }
                        placeholder={EXPERIENCE_COPY.transitionSpeedPlaceholder}
                        disabled={!canEdit}
                      />
                    </InputGroup>
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='tour-immersive-mode'>
                    {EXPERIENCE_COPY.immersiveMode}
                  </Label>
                  <FormDescription>
                    {EXPERIENCE_COPY.immersiveModeDescription}
                  </FormDescription>
                  <InputGroup icon={Sparkles}>
                    <Select
                      value={form.immersiveMode}
                      onValueChange={(immersiveMode) =>
                        setForm((current) => ({
                          ...current,
                          immersiveMode: immersiveMode as AdminImmersiveMode,
                        }))
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger id='tour-immersive-mode'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_COPY.immersiveModes.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputGroup>
                  {form.immersiveMode === 'platform' ?
                    <FormHint>{EXPERIENCE_COPY.platformDescription}</FormHint>
                  : null}
                </div>

                {form.immersiveMode === 'audio' ?
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-immersive-audio'>
                      {EXPERIENCE_COPY.audioLabel}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.audioDescription}
                    </FormDescription>
                    <InputGroup icon={Headphones}>
                      <Input
                        id='tour-immersive-audio'
                        value={form.immersiveAudio}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            immersiveAudio: event.target.value,
                          }))
                        }
                        placeholder={EXPERIENCE_COPY.audioPlaceholder}
                        disabled={!canEdit}
                      />
                    </InputGroup>
                  </div>
                : null}

                {form.immersiveMode === 'playlist' ?
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-immersive-playlist'>
                      {EXPERIENCE_COPY.playlistLabel}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.playlistDescription}
                    </FormDescription>
                    <Textarea
                      id='tour-immersive-playlist'
                      value={form.immersivePlaylistText}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          immersivePlaylistText: event.target.value,
                        }))
                      }
                      placeholder={EXPERIENCE_COPY.playlistPlaceholder}
                      disabled={!canEdit}
                    />
                  </div>
                : null}

                {form.immersiveMode === 'manifest' ?
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-immersive-manifest'>
                      {EXPERIENCE_COPY.manifestLabel}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.manifestDescription}
                    </FormDescription>
                    <InputGroup icon={Link}>
                      <Input
                        id='tour-immersive-manifest'
                        value={form.immersivePlaylistManifest}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            immersivePlaylistManifest: event.target.value,
                          }))
                        }
                        placeholder={EXPERIENCE_COPY.manifestPlaceholder}
                        disabled={!canEdit}
                      />
                    </InputGroup>
                  </div>
                : null}

                {form.immersiveMode !== 'platform' ?
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-immersive-volume'>
                      {EXPERIENCE_COPY.volumeLabel}
                    </Label>
                    <FormDescription>
                      {EXPERIENCE_COPY.volumeDescription}
                    </FormDescription>
                    <InputGroup icon={Volume2}>
                      <Input
                        id='tour-immersive-volume'
                        value={form.immersiveVolume}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            immersiveVolume: event.target.value,
                          }))
                        }
                        placeholder={EXPERIENCE_COPY.volumePlaceholder}
                        disabled={!canEdit}
                      />
                    </InputGroup>
                  </div>
                : null}
              </CollapsibleFormSection>

              <CollapsibleFormSection
                title={BRANDING_COPY.sectionTitle}
                icon={Palette}
                description={BRANDING_COPY.sectionDescription}
              >
                <div className='grid gap-2'>
                  <Label id='tour-branding-mode-label'>Branding mode</Label>
                  <FormDescription>
                    {form.brandingMode === 'client' ?
                      BRANDING_COPY.modeClientHint
                    : BRANDING_COPY.modeCustomHint}
                  </FormDescription>
                  <RadioGroup
                    aria-labelledby='tour-branding-mode-label'
                    value={form.brandingMode}
                    onValueChange={(brandingMode) => {
                      const mode = brandingMode as AdminBrandingMode;
                      setForm((current) => ({
                        ...current,
                        brandingMode: mode,
                        primaryColor:
                          mode === 'client' ?
                            tour.clientBranding.primaryColor
                          : current.primaryColor ||
                            tour.clientBranding.primaryColor,
                        logoAlt: derivedLogoAlt(tour),
                        fontFamily:
                          mode === 'client' ?
                            tour.clientBranding.fontFamily
                          : current.fontFamily,
                        fontSourceUrl:
                          mode === 'client' ?
                            tour.clientBranding.fontSourceUrl
                          : current.fontSourceUrl,
                        clearFontFamily:
                          mode === 'custom' && !current.fontFamily,
                        clearFontSourceUrl:
                          mode === 'custom' && !current.fontSourceUrl,
                      }));
                    }}
                    disabled={!canEdit}
                  >
                    {BRANDING_COPY.modes.map((option) => (
                      <label
                        key={option.value}
                        className='flex cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`tour-branding-mode-${option.value}`}
                        />
                        {option.label}
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='tour-primary-color'>
                    {BRANDING_COPY.primaryColor}
                  </Label>
                  <FormDescription>
                    {BRANDING_COPY.primaryColorDescription}
                  </FormDescription>
                  <ColorHexInput
                    id='tour-primary-color'
                    value={form.primaryColor}
                    onChange={(primaryColor) =>
                      setForm((current) => ({ ...current, primaryColor }))
                    }
                    placeholder={BRANDING_COPY.primaryColorPlaceholder}
                    disabled={!canEdit || form.brandingMode === 'client'}
                  />
                </div>

                <BrandFontField
                  key={form.brandingMode}
                  idPrefix='tour-brand-font'
                  fontFamily={form.fontFamily}
                  onChange={(fontFamily, fontSourceUrl) =>
                    setForm((current) => ({
                      ...current,
                      fontFamily,
                      fontSourceUrl,
                      clearFontFamily: fontFamily.trim() === '',
                      clearFontSourceUrl: fontSourceUrl.trim() === '',
                    }))
                  }
                  disabled={!canEdit || form.brandingMode === 'client'}
                />

                <div className='grid gap-2 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-logo-file'>
                      {BRANDING_COPY.logoUpload}
                    </Label>
                    <FormDescription>
                      {BRANDING_COPY.logoUploadDescription}
                    </FormDescription>
                    <FileInput
                      id='tour-logo-file'
                      accept='image/*'
                      file={logoFile}
                      onFileChange={setLogoFile}
                      currentUrl={savedLogoUrl}
                      disabled={!canEdit || form.brandingMode === 'client'}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='tour-favicon-file'>
                      {BRANDING_COPY.faviconUpload}
                    </Label>
                    <FormDescription>
                      {BRANDING_COPY.faviconUploadDescription}
                    </FormDescription>
                    <FileInput
                      id='tour-favicon-file'
                      accept='image/*'
                      file={faviconFile}
                      onFileChange={setFaviconFile}
                      currentUrl={savedFaviconUrls?.png}
                      currentFallbackUrl={savedFaviconUrls?.ico}
                      disabled={!canEdit || form.brandingMode === 'client'}
                    />
                  </div>
                </div>
              </CollapsibleFormSection>

              <StickyFormActions>
                <FormCancelButton
                  disabled={isSaving}
                  onReset={() => {
                    setForm(savedValues);
                    setLogoFile(null);
                    setFaviconFile(null);
                    setEditOpen(false);
                  }}
                />
                <PendingButton
                  type='submit'
                  pending={isSaving}
                  pendingLabel='Saving…'
                  disabled={!canEdit || !isDirty}
                >
                  <Save aria-hidden='true' />
                  Save changes
                </PendingButton>
              </StickyFormActions>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
