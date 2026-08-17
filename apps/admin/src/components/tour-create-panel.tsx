'use client';

import { useState, type FormEvent } from 'react';
import {
  AudioLines,
  Building2,
  Eye,
  Gauge,
  Info,
  Link,
  Palette,
  Plus,
  Repeat2,
  Sparkles,
  Tag,
  Type,
  View,
  Volume2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { CreateSheet } from '@/components/create-panel-shell';
import { BrandFontField } from '@/components/brand-font-field';
import { ColorHexInput } from '@/components/color-swatch';
import { FileInput } from '@/components/file-input';
import {
  CheckboxField,
  CollapsibleFormSection,
  FormDescription,
  FormField,
  FormHint,
} from '@/components/form-field';
import { FormCancelButton, StickyFormActions } from '@/components/form-status';
import { InputGroup } from '@/components/input-group';
import { PendingButton } from '@/components/pending-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  createLocalTour,
  fileToBase64,
  type AdminTourCreate,
} from '@/lib/admin-dev-api';
import {
  CATALOG_VISIBILITY_OPTIONS,
  BRANDING_COPY,
  EXPERIENCE_COPY,
  TOUR_FORM_COPY,
} from '@/lib/authoring-copy';
import { createOpaqueId, OPAQUE_TOUR_ID_PREFIX } from '@/lib/opaque-id';
import type { AdminClientSummary } from '@/lib/tour-catalog';
import type {
  AdminBrandingMode,
  AdminImmersiveMode,
  AdminTransitionEffect,
} from '@/lib/tour-detail';
import { TOURS_PATH } from '@/lib/admin-routes';

export function TourCreatePanel({
  canEdit,
  categories,
  clients,
  defaultOpen = false,
}: {
  canEdit: boolean;
  categories: string[];
  clients: AdminClientSummary[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<
    Omit<AdminTourCreate, 'panoramaFileBase64' | 'panoramaFileName' | 'tourId'>
  >({
    clientId: '',
    tourTitle: '',
    tourSummary: '',
    category: categories[0] ?? '',
    firstSceneTitle: 'Overview',
    visibility: 'unlisted',
    askGuideEnabled: false,
    brandingMode: 'client',
    primaryColor: '',
    logoAlt: '',
    fontFamily: '',
    fontSourceUrl: '',
    transitionEffect: 'fade',
    transitionSpeed: '500ms',
    immersiveMode: 'platform',
    immersiveAudio: '',
    immersivePlaylistText: '',
    immersivePlaylistManifest: '',
    immersiveVolume: '',
  });
  const [open, setOpen] = useState(defaultOpen);
  const [panorama, setPanorama] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next && defaultOpen) {
      router.replace(TOURS_PATH, { scroll: false });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panorama) return;
    setIsSaving(true);
    try {
      const result = await createLocalTour({
        ...form,
        logoAlt:
          clients.find((client) => client.id === form.clientId)?.name ??
          form.tourTitle,
        logoFileBase64:
          form.brandingMode === 'custom' && logoFile ?
            await fileToBase64(logoFile)
          : undefined,
        faviconFileBase64:
          form.brandingMode === 'custom' && faviconFile ?
            await fileToBase64(faviconFile)
          : undefined,
        tourId: createOpaqueId(OPAQUE_TOUR_ID_PREFIX),
        panoramaFileBase64: await fileToBase64(panorama),
        panoramaFileName: panorama.name,
      });
      showFormSuccess('Tour created.');
      setOpen(false);
      if (typeof result.tourId === 'string') {
        router.push(`/tours/${result.tourId}`);
      }
      router.refresh();
    } catch (error) {
      showFormError(error, 'Tour creation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CreateSheet
      title={TOUR_FORM_COPY.addTitle}
      description={TOUR_FORM_COPY.addDescription}
      triggerLabel='Add tour'
      disabled={!canEdit}
      open={open}
      onOpenChange={changeOpen}
    >
      <form className='admin-form' onSubmit={submit}>
        <CollapsibleFormSection
          title={TOUR_FORM_COPY.clientSection}
          icon={Building2}
          description={TOUR_FORM_COPY.clientSectionDescription}
          defaultOpen
        >
          <div className='grid gap-2'>
            <Label>Client</Label>
            <FormDescription>
              {TOUR_FORM_COPY.clientDescription}
            </FormDescription>
            <InputGroup icon={Building2}>
              <Select
                value={form.clientId || undefined}
                onValueChange={(clientId) =>
                  setForm((current) => ({ ...current, clientId }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder={TOUR_FORM_COPY.clientPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title={TOUR_FORM_COPY.detailsSection}
          icon={Info}
          description={TOUR_FORM_COPY.detailsSectionDescription}
        >
          <div className='grid gap-2'>
            <Label htmlFor='new-tour-title'>{TOUR_FORM_COPY.tourTitle}</Label>
            <FormDescription>
              {TOUR_FORM_COPY.tourTitleDescription}
            </FormDescription>
            <InputGroup icon={Type}>
              <Input
                id='new-tour-title'
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
            htmlFor='new-tour-summary'
            description={TOUR_FORM_COPY.tourSummaryDescription}
          >
            <Textarea
              id='new-tour-summary'
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
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Category</Label>
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
                  <SelectTrigger>
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
              <Label htmlFor='new-tour-visibility'>
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
                      visibility: visibility as AdminTourCreate['visibility'],
                    }))
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger id='new-tour-visibility'>
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
            id='new-tour-ask-guide'
            label={TOUR_FORM_COPY.askGuide}
            description={TOUR_FORM_COPY.askGuideDescription}
            checked={form.askGuideEnabled ?? false}
            onCheckedChange={(askGuideEnabled) =>
              setForm((current) => ({ ...current, askGuideEnabled }))
            }
            disabled={!canEdit}
          />
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title={TOUR_FORM_COPY.firstSceneSection}
          icon={View}
          description={TOUR_FORM_COPY.firstSceneSectionDescription}
        >
          <div className='grid gap-2'>
            <Label htmlFor='new-scene-title'>
              {TOUR_FORM_COPY.firstSceneTitle}
            </Label>
            <FormDescription>
              {TOUR_FORM_COPY.firstSceneTitleDescription}
            </FormDescription>
            <InputGroup icon={Type}>
              <Input
                id='new-scene-title'
                value={form.firstSceneTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstSceneTitle: event.target.value,
                  }))
                }
                placeholder={TOUR_FORM_COPY.firstSceneTitlePlaceholder}
                disabled={!canEdit}
                required
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='new-tour-panorama'>
              {TOUR_FORM_COPY.firstPanorama}
            </Label>
            <FormDescription>
              {TOUR_FORM_COPY.firstPanoramaDescription}
            </FormDescription>
            <FileInput
              id='new-tour-panorama'
              accept='image/*'
              file={panorama}
              onFileChange={setPanorama}
              disabled={!canEdit}
              required
              aspect='video'
            />
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title={EXPERIENCE_COPY.sectionTitle}
          icon={Sparkles}
          description={EXPERIENCE_COPY.sectionDescription}
        >
          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='new-tour-transition-effect'>
                {EXPERIENCE_COPY.transitionEffect}
              </Label>
              <FormDescription>
                {EXPERIENCE_COPY.transitionEffectDescription}
              </FormDescription>
              <InputGroup icon={Repeat2}>
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
                  <SelectTrigger id='new-tour-transition-effect'>
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
              <Label htmlFor='new-tour-transition-speed'>
                {EXPERIENCE_COPY.transitionSpeed}
              </Label>
              <FormDescription>
                {EXPERIENCE_COPY.transitionSpeedDescription}
              </FormDescription>
              <InputGroup icon={Gauge}>
                <Input
                  id='new-tour-transition-speed'
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
            <Label htmlFor='new-tour-immersive-mode'>
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
                <SelectTrigger id='new-tour-immersive-mode'>
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
            <FormField
              label={EXPERIENCE_COPY.audioLabel}
              htmlFor='new-tour-immersive-audio'
              description={EXPERIENCE_COPY.audioDescription}
            >
              <InputGroup icon={AudioLines}>
                <Input
                  id='new-tour-immersive-audio'
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
            </FormField>
          : null}

          {form.immersiveMode === 'playlist' ?
            <FormField
              label={EXPERIENCE_COPY.playlistLabel}
              htmlFor='new-tour-immersive-playlist'
              description={EXPERIENCE_COPY.playlistDescription}
            >
              <Textarea
                id='new-tour-immersive-playlist'
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
            </FormField>
          : null}

          {form.immersiveMode === 'manifest' ?
            <FormField
              label={EXPERIENCE_COPY.manifestLabel}
              htmlFor='new-tour-immersive-manifest'
              description={EXPERIENCE_COPY.manifestDescription}
            >
              <InputGroup icon={Link}>
                <Input
                  id='new-tour-immersive-manifest'
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
            </FormField>
          : null}

          {form.immersiveMode !== 'platform' ?
            <FormField
              label={EXPERIENCE_COPY.volumeLabel}
              htmlFor='new-tour-immersive-volume'
              description={EXPERIENCE_COPY.volumeDescription}
            >
              <InputGroup icon={Volume2}>
                <Input
                  id='new-tour-immersive-volume'
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
            </FormField>
          : null}
        </CollapsibleFormSection>

        <CollapsibleFormSection
          title={BRANDING_COPY.sectionTitle}
          icon={Palette}
          description={BRANDING_COPY.sectionDescription}
        >
          <div className='grid gap-2'>
            <Label id='new-tour-branding-mode-label'>Branding mode</Label>
            <FormDescription>
              {form.brandingMode === 'client' ?
                BRANDING_COPY.modeClientHint
              : BRANDING_COPY.modeCustomHint}
            </FormDescription>
            <RadioGroup
              aria-labelledby='new-tour-branding-mode-label'
              value={form.brandingMode}
              onValueChange={(brandingMode) =>
                setForm((current) => ({
                  ...current,
                  brandingMode: brandingMode as AdminBrandingMode,
                }))
              }
              disabled={!canEdit}
            >
              {BRANDING_COPY.modes.map((option) => (
                <label
                  key={option.value}
                  className='flex cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`new-tour-branding-mode-${option.value}`}
                  />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          <FormField
            label={BRANDING_COPY.primaryColor}
            htmlFor='new-tour-primary-color'
            description={BRANDING_COPY.primaryColorDescription}
          >
            <ColorHexInput
              id='new-tour-primary-color'
              value={form.primaryColor}
              onChange={(primaryColor) =>
                setForm((current) => ({ ...current, primaryColor }))
              }
              placeholder={BRANDING_COPY.primaryColorPlaceholder}
              disabled={!canEdit || form.brandingMode === 'client'}
            />
          </FormField>

          <BrandFontField
            key={form.brandingMode}
            idPrefix='new-tour-brand-font'
            fontFamily={form.fontFamily}
            onChange={(fontFamily, fontSourceUrl) =>
              setForm((current) => ({ ...current, fontFamily, fontSourceUrl }))
            }
            disabled={!canEdit || form.brandingMode === 'client'}
          />

          <div className='grid gap-2 sm:grid-cols-2'>
            <FormField
              label={BRANDING_COPY.logoUpload}
              htmlFor='new-tour-logo-file'
              description={BRANDING_COPY.logoUploadDescription}
            >
              <FileInput
                id='new-tour-logo-file'
                accept='image/*'
                file={logoFile}
                onFileChange={setLogoFile}
                disabled={!canEdit || form.brandingMode === 'client'}
              />
            </FormField>
            <FormField
              label={BRANDING_COPY.faviconUpload}
              htmlFor='new-tour-favicon-file'
              description={BRANDING_COPY.faviconUploadDescription}
            >
              <FileInput
                id='new-tour-favicon-file'
                accept='image/*'
                file={faviconFile}
                onFileChange={setFaviconFile}
                disabled={!canEdit || form.brandingMode === 'client'}
              />
            </FormField>
          </div>
        </CollapsibleFormSection>

        <StickyFormActions>
          <FormCancelButton
            disabled={isSaving}
            onReset={() => {
              setForm({
                clientId: '',
                tourTitle: '',
                tourSummary: '',
                category: categories[0] ?? '',
                firstSceneTitle: 'Overview',
                visibility: 'unlisted',
                askGuideEnabled: false,
                brandingMode: 'client',
                primaryColor: '',
                logoAlt: '',
                fontFamily: '',
                fontSourceUrl: '',
                transitionEffect: 'fade',
                transitionSpeed: '500ms',
                immersiveMode: 'platform',
                immersiveAudio: '',
                immersivePlaylistText: '',
                immersivePlaylistManifest: '',
                immersiveVolume: '',
              });
              setPanorama(null);
              setLogoFile(null);
              setFaviconFile(null);
              changeOpen(false);
            }}
          />
          <PendingButton
            type='submit'
            pending={isSaving}
            pendingLabel='Creating…'
            disabled={!canEdit || isSaving || !panorama || !form.clientId}
          >
            <Plus aria-hidden='true' /> {TOUR_FORM_COPY.createButton}
          </PendingButton>
        </StickyFormActions>
      </form>
    </CreateSheet>
  );
}
