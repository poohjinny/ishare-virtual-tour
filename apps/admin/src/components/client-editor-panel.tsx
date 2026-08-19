'use client';

import { useState, type FormEvent } from 'react';
import {
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  Pipette,
  Printer,
  Save,
  ShieldCheck,
  Sparkles,
  Type,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ColorHexInput, ColorSwatch } from '@/components/color-swatch';
import { BrandFontField } from '@/components/brand-font-field';
import { FileInput } from '@/components/file-input';
import { InputGroup } from '@/components/input-group';
import {
  CollapsibleFormSection,
  FormDescription,
} from '@/components/form-field';
import {
  AUTHORING_SHEET_BODY_CLASS,
  AUTHORING_SHEET_CLASS,
  CreateSheet,
} from '@/components/create-panel-shell';
import {
  FormCancelButton,
  InfoField,
  InfoFieldList,
  InfoLink,
  StickyFormActions,
} from '@/components/form-status';
import { useHeaderEdit } from '@/components/header-edit';
import { PendingButton } from '@/components/pending-button';
import { LicenseBadge } from '@/components/status-badges';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import { colorLabelClass } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  createLocalClient,
  base64ToImageFile,
  fileToBase64,
  suggestLocalClient,
  updateLocalClient,
  type AdminClientPayload,
} from '@/lib/admin-dev-api';
import { clientFaviconUrls, clientLogoUrl } from '@/lib/admin-media';
import { httpHref, mapsHref } from '@/lib/admin-routes';
import {
  AUTHORING_SURFACE,
  BRANDING_COPY,
  CLIENT_FORM_COPY,
} from '@/lib/authoring-copy';
import type { AdminClientSummary } from '@/lib/tour-catalog';

function initialClient(client?: AdminClientSummary): AdminClientPayload {
  return {
    clientId: client?.id ?? '',
    clientName: client?.name ?? '',
    websiteUrl: client?.website ?? '',
    clientEmail: client?.email ?? '',
    clientPhone: client?.phones[0]?.number ?? '',
    clientPhoneLabel: client?.phones[0]?.label ?? 'Telephone',
    clientFax: client?.fax?.number ?? '',
    clientFaxLabel: client?.fax?.label ?? 'Fax',
    clientAddress: client?.address ?? '',
    clientLogoAlt: client?.logoAlt ?? client?.name ?? '',
    primaryColor: client?.brandColor ?? '',
    fontFamily: client?.fontFamily ?? '',
    fontSourceUrl: client?.fontSourceUrl ?? '',
  };
}

export function ClientEditorPanel({
  canEdit,
  client,
  info = true,
  open: openProp,
  onOpenChange,
}: {
  canEdit: boolean;
  client?: AdminClientSummary;
  /** Details page shows the info card. Catalog Edit action keeps the sheet only. */
  info?: boolean;
  /** Controlled sheet — used by the Clients catalog Edit action. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialClient(client));
  const [savedForm, setSavedForm] = useState(() => initialClient(client));
  const [open, setOpen] = useState(false);
  const localEdit = useState(false);
  const headerEdit = useHeaderEdit();
  const editOpen = openProp ?? headerEdit?.open ?? localEdit[0];
  const setEditOpen = onOpenChange ?? headerEdit?.setOpen ?? localEdit[1];
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) ||
    logoFile !== null ||
    faviconFile !== null;

  const savedFaviconUrls = client ? clientFaviconUrls(client.id) : undefined;

  function setField(field: keyof AdminClientPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        clientLogoAlt: form.clientName.trim(),
        logoFileBase64: logoFile ? await fileToBase64(logoFile) : undefined,
        faviconFileBase64:
          faviconFile ? await fileToBase64(faviconFile) : undefined,
      };
      const result =
        client ?
          await updateLocalClient(client.id, payload)
        : await createLocalClient(payload);
      setSavedForm(form);
      setLogoFile(null);
      setFaviconFile(null);
      showFormSuccess(client ? 'Client saved.' : 'Client created.');
      if (!client) setOpen(false);
      else setEditOpen(false);
      if (!client && typeof result.clientId === 'string') {
        router.push(`/clients/${result.clientId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      showFormError(error, 'Client save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function suggest(kind: 'contact' | 'branding') {
    if (!form.websiteUrl) return;
    setIsSaving(true);
    try {
      const result = await suggestLocalClient(kind, form.websiteUrl);
      setForm((current) => ({
        ...current,
        ...(kind === 'contact' ?
          {
            clientEmail: result.email ?? current.clientEmail,
            clientPhone: result.phone ?? current.clientPhone,
            clientPhoneLabel: result.phoneLabel ?? current.clientPhoneLabel,
            clientAddress: result.address ?? current.clientAddress,
          }
        : { primaryColor: result.primaryColor ?? current.primaryColor }),
      }));
      if (kind === 'branding') {
        if (result.logoFileBase64 && result.logoFileName) {
          setLogoFile(
            base64ToImageFile(result.logoFileBase64, result.logoFileName),
          );
        }
        if (result.faviconFileBase64 && result.faviconFileName) {
          setFaviconFile(
            base64ToImageFile(result.faviconFileBase64, result.faviconFileName),
          );
        }
      }
      showFormSuccess(
        `${kind === 'contact' ? 'Contact' : 'Branding'} suggestions applied.`,
      );
    } catch (error) {
      showFormError(error, 'Suggestion failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const formContent = (
    <form className='admin-form' onSubmit={submit}>
      <CollapsibleFormSection
        title={CLIENT_FORM_COPY.identity}
        icon={ShieldCheck}
        description={CLIENT_FORM_COPY.identityDescription}
        defaultOpen
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='client-name'>{CLIENT_FORM_COPY.clientName}</Label>
            <FormDescription>
              {client ?
                CLIENT_FORM_COPY.clientNameDescription
              : CLIENT_FORM_COPY.clientNameCreateDescription}
            </FormDescription>
            <InputGroup icon={Type}>
              <Input
                id='client-name'
                value={form.clientName}
                onChange={(event) => setField('clientName', event.target.value)}
                placeholder={CLIENT_FORM_COPY.clientNamePlaceholder}
                disabled={!canEdit}
                required
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-id'>{CLIENT_FORM_COPY.clientId}</Label>
            <FormDescription>
              {CLIENT_FORM_COPY.clientIdDescription}
            </FormDescription>
            <InputGroup icon={Hash}>
              <Input
                id='client-id'
                className='font-mono'
                value={form.clientId}
                onChange={(event) => setField('clientId', event.target.value)}
                placeholder={CLIENT_FORM_COPY.clientIdPlaceholder}
                disabled={!canEdit || Boolean(client)}
              />
            </InputGroup>
          </div>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='client-website'>{CLIENT_FORM_COPY.website}</Label>
          <FormDescription>
            {CLIENT_FORM_COPY.websiteDescription}
          </FormDescription>
          <InputGroup icon={Globe}>
            <Input
              id='client-website'
              type='url'
              value={form.websiteUrl}
              onChange={(event) => setField('websiteUrl', event.target.value)}
              placeholder={CLIENT_FORM_COPY.websitePlaceholder}
              disabled={!canEdit}
            />
          </InputGroup>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canEdit || isSaving || !form.websiteUrl}
              onClick={() => suggest('contact')}
            >
              <Sparkles aria-hidden='true' /> {CLIENT_FORM_COPY.suggestContact}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canEdit || isSaving || !form.websiteUrl}
              onClick={() => suggest('branding')}
            >
              <Sparkles aria-hidden='true' /> {CLIENT_FORM_COPY.suggestBranding}
            </Button>
          </div>
        </div>
      </CollapsibleFormSection>
      <CollapsibleFormSection
        title={CLIENT_FORM_COPY.contact}
        icon={Mail}
        description={CLIENT_FORM_COPY.contactDescription}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='client-email'>{CLIENT_FORM_COPY.email}</Label>
            <FormDescription>
              {CLIENT_FORM_COPY.emailDescription}
            </FormDescription>
            <InputGroup icon={Mail}>
              <Input
                id='client-email'
                type='email'
                value={form.clientEmail}
                onChange={(event) =>
                  setField('clientEmail', event.target.value)
                }
                placeholder={CLIENT_FORM_COPY.emailPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-address'>{CLIENT_FORM_COPY.address}</Label>
            <FormDescription>
              {CLIENT_FORM_COPY.addressDescription}
            </FormDescription>
            <InputGroup icon={MapPin}>
              <Input
                id='client-address'
                value={form.clientAddress}
                onChange={(event) =>
                  setField('clientAddress', event.target.value)
                }
                placeholder={CLIENT_FORM_COPY.addressPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='client-phone'>{CLIENT_FORM_COPY.phone}</Label>
            <FormDescription>
              {CLIENT_FORM_COPY.phoneDescription}
            </FormDescription>
            <InputGroup icon={Phone}>
              <Input
                id='client-phone'
                value={form.clientPhone}
                onChange={(event) =>
                  setField('clientPhone', event.target.value)
                }
                placeholder={CLIENT_FORM_COPY.phonePlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-phone-label'>
              {CLIENT_FORM_COPY.phoneLabel}
            </Label>
            <FormDescription>
              {CLIENT_FORM_COPY.phoneLabelDescription}
            </FormDescription>
            <InputGroup icon={Type}>
              <Input
                id='client-phone-label'
                value={form.clientPhoneLabel}
                onChange={(event) =>
                  setField('clientPhoneLabel', event.target.value)
                }
                placeholder={CLIENT_FORM_COPY.phoneLabelPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-fax'>{CLIENT_FORM_COPY.fax}</Label>
            <FormDescription>{CLIENT_FORM_COPY.faxDescription}</FormDescription>
            <InputGroup icon={Printer}>
              <Input
                id='client-fax'
                value={form.clientFax}
                onChange={(event) => setField('clientFax', event.target.value)}
                placeholder={CLIENT_FORM_COPY.faxPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-fax-label'>
              {CLIENT_FORM_COPY.faxLabel}
            </Label>
            <FormDescription>
              {CLIENT_FORM_COPY.faxLabelDescription}
            </FormDescription>
            <InputGroup icon={Type}>
              <Input
                id='client-fax-label'
                value={form.clientFaxLabel}
                onChange={(event) =>
                  setField('clientFaxLabel', event.target.value)
                }
                placeholder={CLIENT_FORM_COPY.faxLabelPlaceholder}
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
        </div>
      </CollapsibleFormSection>
      <CollapsibleFormSection
        title={CLIENT_FORM_COPY.sharedBranding}
        icon={Pipette}
        description={CLIENT_FORM_COPY.sharedBrandingDescription}
      >
        <div className='grid gap-2'>
          <Label htmlFor='client-color'>{BRANDING_COPY.primaryColor}</Label>
          <FormDescription>
            {BRANDING_COPY.primaryColorDescription}
          </FormDescription>
          <ColorHexInput
            id='client-color'
            value={form.primaryColor}
            onChange={(primaryColor) => setField('primaryColor', primaryColor)}
            placeholder={BRANDING_COPY.primaryColorPlaceholder}
            disabled={!canEdit}
          />
        </div>
        <BrandFontField
          idPrefix='client-brand-font'
          fontFamily={form.fontFamily}
          onChange={(fontFamily, fontSourceUrl) =>
            setForm((current) => ({ ...current, fontFamily, fontSourceUrl }))
          }
          disabled={!canEdit}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='client-logo'>{BRANDING_COPY.logoUpload}</Label>
            <FormDescription>
              {BRANDING_COPY.logoUploadDescription}
            </FormDescription>
            <FileInput
              id='client-logo'
              accept='image/*'
              file={logoFile}
              onFileChange={setLogoFile}
              currentUrl={client ? clientLogoUrl(client.id) : undefined}
              disabled={!canEdit}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='client-favicon'>
              {BRANDING_COPY.faviconUpload}
            </Label>
            <FormDescription>
              {BRANDING_COPY.faviconUploadDescription}
            </FormDescription>
            <FileInput
              id='client-favicon'
              accept='image/*'
              file={faviconFile}
              onFileChange={setFaviconFile}
              currentUrl={savedFaviconUrls?.png}
              currentFallbackUrl={savedFaviconUrls?.ico}
              disabled={!canEdit}
            />
          </div>
        </div>
      </CollapsibleFormSection>
      <StickyFormActions>
        <FormCancelButton
          disabled={isSaving}
          onReset={() => {
            setForm(savedForm);
            setLogoFile(null);
            setFaviconFile(null);
            if (client) setEditOpen(false);
            else setOpen(false);
          }}
        />
        <PendingButton
          type='submit'
          pending={isSaving}
          pendingLabel='Saving…'
          disabled={!canEdit || !isDirty}
        >
          <Save aria-hidden='true' />{' '}
          {client ? CLIENT_FORM_COPY.saveButton : CLIENT_FORM_COPY.createButton}
        </PendingButton>
      </StickyFormActions>
    </form>
  );

  if (!client) {
    return (
      <CreateSheet
        title={CLIENT_FORM_COPY.addTitle}
        description={CLIENT_FORM_COPY.description}
        triggerLabel='Add client'
        disabled={!canEdit}
        open={open}
        onOpenChange={setOpen}
      >
        {formContent}
      </CreateSheet>
    );
  }

  return (
    <>
      {info ?
        <Card>
          <CardHeader>
            <CardTitle>{AUTHORING_SURFACE.clientDetails.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoFieldList columns={2}>
              <InfoField layout='inline' icon={ShieldCheck} label='License'>
                <LicenseBadge licensed={client.licensed} />
              </InfoField>
              <InfoField
                layout='inline'
                icon={Globe}
                label={CLIENT_FORM_COPY.website}
              >
                {savedForm.websiteUrl ?
                  <InfoLink href={httpHref(savedForm.websiteUrl)}>
                    {savedForm.websiteUrl}
                  </InfoLink>
                : '—'}
              </InfoField>
              <InfoField
                layout='inline'
                icon={Mail}
                label={CLIENT_FORM_COPY.email}
              >
                {savedForm.clientEmail ?
                  <InfoLink href={`mailto:${savedForm.clientEmail}`}>
                    {savedForm.clientEmail}
                  </InfoLink>
                : '—'}
              </InfoField>
              <InfoField
                layout='inline'
                icon={Phone}
                label={CLIENT_FORM_COPY.phone}
              >
                {savedForm.clientPhone ?
                  <InfoLink
                    href={`tel:${savedForm.clientPhone.replace(/[^\d+]/g, '')}`}
                  >
                    {savedForm.clientPhone}
                  </InfoLink>
                : '—'}
              </InfoField>
              <InfoField
                layout='inline'
                span='full'
                icon={MapPin}
                label={CLIENT_FORM_COPY.address}
              >
                {savedForm.clientAddress ?
                  <InfoLink href={mapsHref(savedForm.clientAddress)}>
                    {savedForm.clientAddress}
                  </InfoLink>
                : '—'}
              </InfoField>
              <InfoField layout='inline' icon={Pipette} label='Color'>
                <span className={colorLabelClass}>
                  {savedForm.primaryColor ?
                    <ColorSwatch color={savedForm.primaryColor} />
                  : null}
                  {savedForm.primaryColor || '—'}
                </span>
              </InfoField>
              <InfoField layout='inline' icon={Type} label='Font'>
                {savedForm.fontFamily || '—'}
              </InfoField>
            </InfoFieldList>
          </CardContent>
        </Card>
      : null}
      <Sheet
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) {
            setForm(savedForm);
            setLogoFile(null);
            setFaviconFile(null);
          }
        }}
      >
        <SheetContent className={AUTHORING_SHEET_CLASS}>
          <SheetHeader>
            <SheetTitle>Edit client</SheetTitle>
            <SheetDescription>{CLIENT_FORM_COPY.description}</SheetDescription>
          </SheetHeader>
          <div className={AUTHORING_SHEET_BODY_CLASS}>{formContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
