import { useCallback, useEffect, useMemo, useState } from 'react';
import { findCatalogClient } from '../data/tourCatalog';
import { slugifyHotspotName } from '../utils/devHotspotLogger';
import { tryClientIdFromWebsite } from '../utils/clientId';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import { resolveClientLogoPath } from '../utils/resolveTourBranding';
import { phoneToTelHref } from '../utils/tourClientContact';
import { DevBrandFaviconPreview } from './DevBrandFaviconPreview';
import {
  DevTourApiError,
  devBase64ToImageFile,
  devCreateClient,
  devDeleteClient,
  devSuggestBranding,
  devSuggestContact,
  devUpdateClient,
  type DevCatalogClient,
} from '../utils/devTourApi';
import {
  DevPanelColorField,
  normalizeHexColorInput,
} from './DevPanelColorField';
import {
  DevPanelFormGroup,
  DevPanelFormRow,
  DevPanelFormSection,
} from './DevPanelFormGroup';
import { DevPanelFileField } from './DevPanelFileField';
import { DevPanelFileInput } from './DevPanelFileInput';
import { DevLocalFilePreview } from './DevLocalFilePreview';
import {
  DevPanelSection,
  DevPanelSectionAccordion,
} from './DevPanelSectionAccordion';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolLayoutClassName,
} from './ui/materialSymbolClasses';
import { cn } from '../lib/cn';
import {
  devViewPanelActionsClassName,
  devViewPanelInlineActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelIconBtnVariants,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelControlRadiusClassName,
  devViewPanelFormGroupTitleClassName,
  devViewPanelInputClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListItemActiveClassName,
  devViewPanelManageListItemBodyClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemContentClassName,
  formatManageListItemId,
  devViewPanelManageListItemDescBulletItemClassName,
  devViewPanelManageListItemDescBulletListClassName,
  devViewPanelManageListItemDescStackClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemIconActionsClassName,
  devViewPanelManageListItemLogoClassName,
  devViewPanelManageListItemLogoWrapClassName,
  devViewPanelManageListItemMainRowWithLogoClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelStackedFormFooterClassName,
  devViewPanelTextareaClassName,
} from './devViewPanelVariants';

const DEFAULT_PRIMARY_COLOR = '#007078';

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

type DevClientPanelProps = {
  catalogClients: DevCatalogClient[];
  catalogTick: number;
  /** Open tour's client — Current badge. */
  currentClientId: string;
  manageClientId: string;
  onManageClientIdChange: (clientId: string) => void;
  onCatalogRefresh: () => Promise<void>;
  onCreateOpenChange?: (open: boolean) => void;
  onClientDeleted?: (result: {
    clientId: string;
    deletedTourIds: string[];
    redirectTourId: string | null;
  }) => Promise<void>;
};

export function DevClientPanel({
  catalogClients,
  catalogTick,
  currentClientId,
  manageClientId,
  onManageClientIdChange,
  onCatalogRefresh,
  onCreateOpenChange,
  onClientDeleted,
}: DevClientPanelProps) {
  const [clientCreateOpen, setClientCreateOpen] = useState(false);
  const [clientAddCloseKey, setClientAddCloseKey] = useState(0);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [deleteClientConfirm, setDeleteClientConfirm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<ActionStatus>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneLabel, setPhoneLabel] = useState('');
  const [fax, setFax] = useState('');
  const [faxLabel, setFaxLabel] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSourceUrl, setFontSourceUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [createClientIdInput, setCreateClientIdInput] = useState('');
  const [createClientName, setCreateClientName] = useState('');
  const [createStatus, setCreateStatus] = useState<ActionStatus>('idle');
  const [createError, setCreateError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<ActionStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [suggestBrandingStatus, setSuggestBrandingStatus] =
    useState<ActionStatus>('idle');
  const [suggestBrandingNotes, setSuggestBrandingNotes] = useState<string[]>(
    [],
  );
  const [suggestContactStatus, setSuggestContactStatus] =
    useState<ActionStatus>('idle');
  const [suggestContactNotes, setSuggestContactNotes] = useState<string[]>([]);

  const selectedClient = useMemo(
    () => (manageClientId ? findCatalogClient(manageClientId) : undefined),
    [manageClientId, catalogTick],
  );

  const selectedManageCatalogClient = useMemo(
    () => catalogClients.find((client) => client.id === manageClientId),
    [catalogClients, manageClientId],
  );

  const sortedClients = useMemo(
    () =>
      [...catalogClients].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    [catalogClients],
  );

  const managedLogoPreviewUrl = useMemo(() => {
    if (clientCreateOpen || logoFile || !selectedManageCatalogClient) {
      return null;
    }
    const path = resolveClientLogoPath(
      selectedManageCatalogClient.id,
      selectedManageCatalogClient.branding?.logo,
    );
    if (!path) return null;
    return withBaseUrl(appendCacheBust(path, catalogTick));
  }, [catalogTick, clientCreateOpen, logoFile, selectedManageCatalogClient]);

  const managedFaviconPreviewAlt = useMemo(
    () =>
      `${clientName.trim() || selectedManageCatalogClient?.name || 'Client'} favicon`,
    [clientName, selectedManageCatalogClient?.name],
  );

  const showManagedFaviconPreview =
    !clientCreateOpen &&
    Boolean(editingClientId && manageClientId) &&
    !faviconFile;

  const createClientSlug = useMemo(() => {
    const manual =
      createClientIdInput.trim() ? slugifyHotspotName(createClientIdInput) : '';
    return manual || tryClientIdFromWebsite(website);
  }, [createClientIdInput, website]);

  const canCreateClient = Boolean(createClientName.trim() && createClientSlug);

  const canSaveClient = Boolean(manageClientId && clientName.trim());

  const hydrateManagedClientForm = useCallback((client: DevCatalogClient) => {
    setClientName(client.name);
    setWebsite(client.website ?? '');
    setEmail(client.email ?? '');
    setPhone(client.phone ?? '');
    setPhoneLabel(client.phoneLabel ?? '');
    setFax(client.fax ?? '');
    setFaxLabel(client.faxLabel ?? '');
    setAddress(client.address ?? '');
    setPrimaryColor(client.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR);
    setFontFamily(client.branding?.fontFamily ?? '');
    setFontSourceUrl(client.branding?.fontSourceUrl ?? '');
    setLogoFile(null);
    setFaviconFile(null);
    setSuggestBrandingNotes([]);
    setSuggestBrandingStatus('idle');
    setSuggestContactNotes([]);
    setSuggestContactStatus('idle');
    setSaveStatus('idle');
    setSaveError(null);
  }, []);

  const resetCreateClientForm = useCallback(() => {
    setCreateClientIdInput('');
    setCreateClientName('');
    setWebsite('');
    setEmail('');
    setPhone('');
    setPhoneLabel('');
    setFax('');
    setFaxLabel('');
    setAddress('');
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setFontFamily('');
    setFontSourceUrl('');
    setLogoFile(null);
    setFaviconFile(null);
    setSuggestBrandingNotes([]);
    setSuggestBrandingStatus('idle');
    setSuggestContactNotes([]);
    setSuggestContactStatus('idle');
    setCreateStatus('idle');
    setCreateError(null);
  }, []);

  const startEditClient = useCallback(
    (client: DevCatalogClient) => {
      setClientCreateOpen(false);
      setDeletingClientId(null);
      setDeleteClientConfirm('');
      setDeleteStatus('idle');
      setDeleteError(null);
      onManageClientIdChange(client.id);
      setEditingClientId(client.id);
      hydrateManagedClientForm(client);
    },
    [hydrateManagedClientForm, onManageClientIdChange],
  );

  const cancelEditClient = useCallback(() => {
    setEditingClientId(null);
    setSaveStatus('idle');
    setSaveError(null);
  }, []);

  const startDeleteClient = useCallback((clientId: string) => {
    setClientCreateOpen(false);
    setEditingClientId(null);
    setDeletingClientId(clientId);
    setDeleteClientConfirm('');
    setDeleteStatus('idle');
    setDeleteError(null);
  }, []);

  const cancelDeleteClient = useCallback(() => {
    setDeletingClientId(null);
    setDeleteClientConfirm('');
    setDeleteStatus('idle');
    setDeleteError(null);
  }, []);

  const deleteClientEntry = useCallback(
    async (clientId: string) => {
      if (deleteClientConfirm.trim() !== clientId) return;

      setDeleteStatus('working');
      setDeleteError(null);

      try {
        const result = await devDeleteClient({
          clientId,
          confirmClientId: deleteClientConfirm.trim(),
        });
        setDeletingClientId(null);
        setDeleteClientConfirm('');
        if (manageClientId === clientId) {
          onManageClientIdChange('');
        }
        setEditingClientId((current) =>
          current === clientId ? null : current,
        );
        await onCatalogRefresh();
        await onClientDeleted?.(result);
        setDeleteStatus('done');
      } catch (error) {
        setDeleteStatus('error');
        setDeleteError(
          error instanceof DevTourApiError ?
            error.message
          : 'Could not delete client',
        );
      }
    },
    [
      deleteClientConfirm,
      manageClientId,
      onCatalogRefresh,
      onClientDeleted,
      onManageClientIdChange,
    ],
  );

  useEffect(() => {
    onCreateOpenChange?.(clientCreateOpen);
  }, [clientCreateOpen, onCreateOpenChange]);

  useEffect(() => {
    if (clientCreateOpen || !editingClientId) return;
    const client = catalogClients.find((entry) => entry.id === editingClientId);
    if (!client) {
      setEditingClientId(null);
      return;
    }
    hydrateManagedClientForm(client);
    // Re-hydrate when catalog snapshot refreshes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogClients identity churns
  }, [
    catalogTick,
    clientCreateOpen,
    editingClientId,
    hydrateManagedClientForm,
  ]);

  const suggestBranding = useCallback(async () => {
    const websiteUrl = website.trim();
    if (!websiteUrl) return;

    setSuggestBrandingStatus('working');
    setSuggestBrandingNotes([]);

    try {
      const result = await devSuggestBranding(websiteUrl);
      if (result.primaryColor) setPrimaryColor(result.primaryColor);
      if (result.logoFileBase64 && result.logoFileName) {
        setLogoFile(
          devBase64ToImageFile(result.logoFileBase64, result.logoFileName),
        );
      }
      if (result.faviconFileBase64 && result.faviconFileName) {
        setFaviconFile(
          devBase64ToImageFile(
            result.faviconFileBase64,
            result.faviconFileName,
          ),
        );
      }
      setSuggestBrandingNotes(result.notes);
      setSuggestBrandingStatus('done');
    } catch (error) {
      setSuggestBrandingStatus('error');
      setSuggestBrandingNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest branding from website',
      ]);
    }
  }, [website]);

  const suggestContact = useCallback(async () => {
    const websiteUrl = website.trim();
    if (!websiteUrl) return;

    setSuggestContactStatus('working');
    setSuggestContactNotes([]);

    try {
      const result = await devSuggestContact(websiteUrl);
      if (result.email) setEmail(result.email);
      if (result.phone) setPhone(result.phone);
      if (result.phoneLabel) setPhoneLabel(result.phoneLabel);
      if (result.address) setAddress(result.address);
      setSuggestContactNotes(result.notes);
      setSuggestContactStatus('done');
    } catch (error) {
      setSuggestContactStatus('error');
      setSuggestContactNotes([
        error instanceof DevTourApiError ?
          error.message
        : 'Could not suggest contact from website',
      ]);
    }
  }, [website]);

  const saveClient = useCallback(async () => {
    if (!canSaveClient || !manageClientId) return;

    setSaveStatus('working');
    setSaveError(null);

    try {
      await devUpdateClient({
        clientId: manageClientId,
        clientName: clientName.trim(),
        websiteUrl: website.trim() || undefined,
        clientEmail: email.trim() || undefined,
        clientPhone: phone.trim() || undefined,
        clientPhoneLabel: phoneLabel.trim() || undefined,
        clientFax: fax.trim() || undefined,
        clientFaxLabel: faxLabel.trim() || undefined,
        clientAddress: address.trim() || undefined,
        clientLogoAlt: clientName.trim() || undefined,
        primaryColor: normalizeHexColorInput(primaryColor),
        fontFamily: fontFamily.trim() || undefined,
        fontSourceUrl: fontSourceUrl.trim() || undefined,
        logoFile,
        faviconFile,
      });
      setLogoFile(null);
      setFaviconFile(null);
      await onCatalogRefresh();
      setSaveStatus('done');
      setEditingClientId(null);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not save client',
      );
    }
  }, [
    address,
    canSaveClient,
    clientName,
    email,
    fax,
    faxLabel,
    faviconFile,
    fontFamily,
    fontSourceUrl,
    logoFile,
    manageClientId,
    onCatalogRefresh,
    phone,
    phoneLabel,
    primaryColor,
    website,
  ]);

  const createClient = useCallback(async () => {
    if (!canCreateClient || !createClientSlug) return;

    setCreateStatus('working');
    setCreateError(null);

    try {
      const result = await devCreateClient({
        clientId: createClientSlug,
        clientName: createClientName.trim(),
        websiteUrl: website.trim() || undefined,
        clientEmail: email.trim() || undefined,
        clientPhone: phone.trim() || undefined,
        clientPhoneLabel: phoneLabel.trim() || undefined,
        clientFax: fax.trim() || undefined,
        clientFaxLabel: faxLabel.trim() || undefined,
        clientAddress: address.trim() || undefined,
        clientLogoAlt: createClientName.trim() || undefined,
        primaryColor: normalizeHexColorInput(primaryColor),
        fontFamily: fontFamily.trim() || undefined,
        fontSourceUrl: fontSourceUrl.trim() || undefined,
        logoFile,
        faviconFile,
      });
      await onCatalogRefresh();
      onManageClientIdChange(result.clientId);
      resetCreateClientForm();
      setClientCreateOpen(false);
      setEditingClientId(null);
      setCreateStatus('done');
    } catch (error) {
      setCreateStatus('error');
      setCreateError(
        error instanceof DevTourApiError ?
          error.message
        : 'Could not create client',
      );
    }
  }, [
    address,
    canCreateClient,
    createClientName,
    createClientSlug,
    email,
    fax,
    faxLabel,
    faviconFile,
    fontFamily,
    fontSourceUrl,
    logoFile,
    onCatalogRefresh,
    onManageClientIdChange,
    phone,
    phoneLabel,
    primaryColor,
    resetCreateClientForm,
    website,
  ]);

  const contactFields = (
    <>
      <label className={devViewPanelFieldClassName}>
        <span className={devViewPanelFieldLabelClassName}>Website</span>
        <input
          className={devViewPanelInputClassName}
          type='url'
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder='https://…'
          spellCheck={false}
          autoComplete='off'
        />
      </label>

      <div className='flex flex-col gap-1'>
        <div className={devViewPanelInlineActionsClassName}>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'secondary' })}
            onClick={() => void suggestContact()}
            disabled={!website.trim() || suggestContactStatus === 'working'}
          >
            {suggestContactStatus === 'working' ?
              'Suggesting…'
            : 'Suggest contact from website'}
          </button>
        </div>
        <p className={devViewPanelSectionHintClassName}>
          Fetches the website URL above to draft email, phone, and address —
          review before saving.
        </p>
      </div>

      {suggestContactNotes.length > 0 ?
        <ul className={devViewPanelSectionHintClassName}>
          {suggestContactNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      : null}

      <label className={devViewPanelFieldClassName}>
        <span className={devViewPanelFieldLabelClassName}>Email</span>
        <input
          className={devViewPanelInputClassName}
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='info@example.org'
          spellCheck={false}
          autoComplete='off'
        />
      </label>

      <DevPanelFormRow>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Phone</span>
          <input
            className={devViewPanelInputClassName}
            type='text'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='e.g. (416) 555-0100'
            spellCheck={false}
            autoComplete='off'
          />
        </label>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Phone label</span>
          <input
            className={devViewPanelInputClassName}
            type='text'
            value={phoneLabel}
            onChange={(e) => setPhoneLabel(e.target.value)}
            placeholder='e.g. Main line'
            spellCheck={false}
            autoComplete='off'
          />
        </label>
      </DevPanelFormRow>

      <DevPanelFormRow>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Fax</span>
          <input
            className={devViewPanelInputClassName}
            type='text'
            value={fax}
            onChange={(e) => setFax(e.target.value)}
            placeholder='e.g. (416) 555-0101'
            spellCheck={false}
            autoComplete='off'
          />
        </label>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Fax label</span>
          <input
            className={devViewPanelInputClassName}
            type='text'
            value={faxLabel}
            onChange={(e) => setFaxLabel(e.target.value)}
            placeholder='e.g. Fax'
            spellCheck={false}
            autoComplete='off'
          />
        </label>
      </DevPanelFormRow>

      <label className={devViewPanelFieldClassName}>
        <span className={devViewPanelFieldLabelClassName}>Address</span>
        <textarea
          className={devViewPanelTextareaClassName}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder='e.g. 123 Main St, Toronto, ON'
          rows={2}
          spellCheck={false}
        />
      </label>
    </>
  );

  const brandingFields = (
    <>
      <div className='flex flex-col gap-1'>
        <div className={devViewPanelInlineActionsClassName}>
          <button
            type='button'
            className={devViewPanelBtnVariants({ tone: 'secondary' })}
            onClick={() => void suggestBranding()}
            disabled={!website.trim() || suggestBrandingStatus === 'working'}
          >
            {suggestBrandingStatus === 'working' ?
              'Suggesting…'
            : 'Suggest branding from website'}
          </button>
        </div>
        <p className={devViewPanelSectionHintClassName}>
          Fetches the website URL above to draft logo, favicon, and primary
          color — review before saving.
        </p>
      </div>

      {suggestBrandingNotes.length > 0 ?
        <ul className={devViewPanelSectionHintClassName}>
          {suggestBrandingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      : null}

      <DevPanelColorField
        label='Primary color'
        value={primaryColor}
        onChange={setPrimaryColor}
        defaultColor={DEFAULT_PRIMARY_COLOR}
        pickerAriaLabel='Primary color picker'
      />

      <DevPanelFormRow>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>
            {editingClientId && managedLogoPreviewUrl ?
              'Logo (replace)'
            : 'Logo'}
          </span>
          <DevPanelFileField
            {...(logoFile != null ? { file: logoFile } : {})}
            preview={
              logoFile ?
                <DevLocalFilePreview
                  file={logoFile}
                  className={devViewPanelBrandLogoClassName}
                  alt='Logo preview'
                />
              : managedLogoPreviewUrl ?
                <img
                  className={devViewPanelBrandLogoClassName}
                  src={managedLogoPreviewUrl}
                  alt={`${clientName.trim() || selectedManageCatalogClient?.name || 'Client'} logo`}
                />
              : null
            }
            onClearPreview={() => setLogoFile(null)}
            showClear={Boolean(logoFile)}
          >
            <DevPanelFileInput
              accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
              file={logoFile}
              onChange={setLogoFile}
            />
          </DevPanelFileField>
        </label>

        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>
            {showManagedFaviconPreview ?
              'Favicon (replace)'
            : 'Favicon (optional)'}
          </span>
          <DevPanelFileField
            {...(faviconFile != null ? { file: faviconFile } : {})}
            preview={
              faviconFile ?
                <DevLocalFilePreview
                  file={faviconFile}
                  className={devViewPanelBrandFaviconClassName}
                  alt='Favicon preview'
                />
              : showManagedFaviconPreview && manageClientId ?
                <DevBrandFaviconPreview
                  catalogFavicon={
                    selectedManageCatalogClient?.branding?.favicon
                  }
                  clientId={manageClientId}
                  cacheKey={catalogTick}
                  className={devViewPanelBrandFaviconClassName}
                  alt={managedFaviconPreviewAlt}
                />
              : null
            }
            onClearPreview={() => setFaviconFile(null)}
            showClear={Boolean(faviconFile)}
          >
            <DevPanelFileInput
              accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
              file={faviconFile}
              onChange={setFaviconFile}
            />
          </DevPanelFileField>
        </label>
      </DevPanelFormRow>

      <DevPanelFormRow>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Font family</span>
          <input
            className={devViewPanelInputClassName}
            type='text'
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            placeholder='e.g. Inter'
            spellCheck={false}
          />
        </label>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>
            Google Fonts URL
          </span>
          <input
            className={devViewPanelInputClassName}
            type='url'
            value={fontSourceUrl}
            onChange={(e) => setFontSourceUrl(e.target.value)}
            placeholder='https://fonts.googleapis.com/css2?…'
            spellCheck={false}
          />
        </label>
      </DevPanelFormRow>
    </>
  );

  return (
    <DevPanelSectionAccordion
      persistKey='tab:client'
      defaultOpenIndex={1}
      ensureCloseIndex={0}
      ensureCloseKey={clientAddCloseKey}
    >
      <DevPanelSection
        title='Add client'
        description='Create a catalog client — shared contact and branding. Add tours afterward from the Tour tab.'
      >
        <DevPanelFormGroup stacked>
          <DevPanelFormSection title='Identity'>
            <DevPanelFormRow>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Client name
                </span>
                <input
                  className={devViewPanelInputClassName}
                  type='text'
                  value={createClientName}
                  onChange={(e) => setCreateClientName(e.target.value)}
                  placeholder='e.g. Example Foundation'
                  spellCheck={false}
                />
                <p className={devViewPanelSectionHintClassName}>
                  Creates a catalog client only — add tours afterward from the
                  Tour tab.
                </p>
              </label>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>
                  Client id (optional)
                </span>
                <input
                  className={devViewPanelInputClassName}
                  type='text'
                  value={createClientIdInput}
                  onChange={(e) => setCreateClientIdInput(e.target.value)}
                  placeholder={
                    tryClientIdFromWebsite(website) || 'e.g. qchfoundation'
                  }
                  spellCheck={false}
                />
                <p className={devViewPanelSectionHintClassName}>
                  Leave empty to use the website hostname without TLD
                  (qchfoundation.ca → qchfoundation).
                </p>
              </label>
            </DevPanelFormRow>
            {createClientSlug ?
              <p className={devViewPanelSlugPreviewClassName}>
                client id <code>{createClientSlug}</code>
              </p>
            : null}
          </DevPanelFormSection>

          <DevPanelFormSection title='Contact' divided>
            {contactFields}
          </DevPanelFormSection>

          <DevPanelFormSection
            title='Shared branding'
            divided
            description='Saved to catalog.json — every tour for this client inherits unless a tour overrides.'
          >
            {brandingFields}
          </DevPanelFormSection>

          <div className={devViewPanelStackedFormFooterClassName}>
            {createError ?
              <p className={devViewPanelSectionHintClassName}>{createError}</p>
            : null}

            <div className={devViewPanelInlineActionsClassName}>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'secondary' })}
                onClick={() => {
                  resetCreateClientForm();
                  setClientCreateOpen(false);
                  setClientAddCloseKey((key) => key + 1);
                }}
                disabled={createStatus === 'working'}
              >
                Cancel
              </button>
              <button
                type='button'
                className={devViewPanelBtnVariants({ tone: 'primary' })}
                onClick={() => void createClient()}
                disabled={!canCreateClient || createStatus === 'working'}
              >
                {createStatus === 'working' ?
                  'Creating…'
                : createStatus === 'done' ?
                  'Client created!'
                : 'Create client'}
              </button>
            </div>
          </div>
        </DevPanelFormGroup>
      </DevPanelSection>

      <DevPanelSection
        title='Manage clients'
        description='Catalog clients — shared contact and branding. Tour settings stay on the Tour tab.'
      >
        <DevPanelFormGroup>
          {sortedClients.length > 0 ?
            <ul className={devViewPanelManageListClassName}>
              {sortedClients.map((client) => {
                const isCurrent = client.id === currentClientId;
                const isEditing = editingClientId === client.id;
                const isDeleting = deletingClientId === client.id;
                const canConfirmDelete =
                  deleteClientConfirm.trim() === client.id;
                const contactRows: Array<{
                  key: string;
                  label: string;
                  value: string;
                  href: string;
                  external?: boolean;
                }> = [];
                const email = client.email?.trim();
                const phone = client.phone?.trim();
                const website = client.website?.trim();
                if (email) {
                  contactRows.push({
                    key: 'email',
                    label: 'Email',
                    value: email,
                    href: `mailto:${email}`,
                  });
                }
                if (phone) {
                  const telHref = phoneToTelHref(phone);
                  contactRows.push({
                    key: 'phone',
                    label: 'Phone',
                    value: phone,
                    href: telHref,
                  });
                }
                if (website) {
                  contactRows.push({
                    key: 'website',
                    label: 'Website',
                    value: website,
                    href:
                      /^https?:\/\//i.test(website) ? website : (
                        `https://${website}`
                      ),
                    external: true,
                  });
                }
                const logoPath = resolveClientLogoPath(
                  client.id,
                  client.branding?.logo,
                );
                const logoUrl =
                  logoPath ?
                    withBaseUrl(appendCacheBust(logoPath, catalogTick))
                  : null;
                const busy =
                  saveStatus === 'working' || deleteStatus === 'working';

                return (
                  <li
                    key={client.id}
                    className={cn(
                      devViewPanelManageListItemClassName,
                      (isEditing || isCurrent || isDeleting) &&
                        devViewPanelManageListItemActiveClassName,
                    )}
                  >
                    <div className={devViewPanelManageListItemBodyClassName}>
                      <div
                        className={
                          devViewPanelManageListItemMainRowWithLogoClassName
                        }
                      >
                        {logoUrl ?
                          <span
                            className={
                              devViewPanelManageListItemLogoWrapClassName
                            }
                          >
                            <img
                              className={
                                devViewPanelManageListItemLogoClassName
                              }
                              src={logoUrl}
                              alt=''
                            />
                          </span>
                        : null}
                        <div
                          className={devViewPanelManageListItemContentClassName}
                        >
                          <div
                            className={cn(
                              devViewPanelManageListItemHeadMainClassName,
                              'flex-nowrap',
                            )}
                          >
                            <span
                              className={cn(
                                devViewPanelManageListItemTitleClassName,
                                'truncate',
                              )}
                            >
                              {client.name}
                            </span>
                          </div>
                        </div>
                        <div
                          className={
                            devViewPanelManageListItemIconActionsClassName
                          }
                        >
                          <button
                            type='button'
                            className={devViewPanelIconBtnVariants({
                              tone: 'secondary',
                            })}
                            onClick={() => startEditClient(client)}
                            disabled={busy || isEditing}
                            aria-label={`Edit ${client.name}`}
                            title='Edit'
                          >
                            <MaterialSymbol
                              name='edit'
                              sizePx={MATERIAL_SYMBOL_SIZE_18}
                              className={materialSymbolLayoutClassName}
                              aria-hidden
                            />
                          </button>
                          <button
                            type='button'
                            className={devViewPanelIconBtnVariants({
                              tone: 'danger',
                            })}
                            onClick={() => startDeleteClient(client.id)}
                            disabled={busy || isDeleting}
                            aria-label={`Delete ${client.name}`}
                            title='Delete'
                          >
                            <MaterialSymbol
                              name='delete'
                              sizePx={MATERIAL_SYMBOL_SIZE_18}
                              className={materialSymbolLayoutClassName}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </div>
                      <div
                        className={devViewPanelManageListItemDescStackClassName}
                      >
                        <ul
                          className={
                            devViewPanelManageListItemDescBulletListClassName
                          }
                        >
                          <li
                            className={
                              devViewPanelManageListItemDescBulletItemClassName
                            }
                            title={client.id}
                          >
                            {formatManageListItemId('client', client.id)}
                          </li>
                          {contactRows.map((row) => (
                            <li
                              key={row.key}
                              className={
                                devViewPanelManageListItemDescBulletItemClassName
                              }
                            >
                              {row.label}:{' '}
                              {row.href ?
                                <a
                                  className='text-[var(--dev-panel-muted)] underline-offset-2 hover:text-[color:var(--dev-panel-primary,#4ade80)] hover:underline'
                                  href={row.href}
                                  {...(row.external ?
                                    {
                                      target: '_blank',
                                      rel: 'noopener noreferrer',
                                    }
                                  : {})}
                                >
                                  {row.value}
                                </a>
                              : row.value}
                            </li>
                          ))}
                        </ul>
                        {contactRows.length === 0 ?
                          <p className='m-0'>No contact</p>
                        : null}
                      </div>

                      {isDeleting ?
                        <div
                          className={cn(
                            'mt-2 flex flex-col gap-2.5 border border-[rgba(248,113,113,0.35)] bg-[rgba(69,10,10,0.35)] p-3',
                            devViewPanelControlRadiusClassName,
                          )}
                        >
                          <h4 className={devViewPanelFormGroupTitleClassName}>
                            Danger zone
                          </h4>
                          <p className={devViewPanelSectionHintClassName}>
                            Permanently deletes this client
                            {client.tourCount > 0 ?
                              <>
                                , its{' '}
                                <strong>
                                  {client.tourCount} tour
                                  {client.tourCount === 1 ? '' : 's'}
                                </strong>
                                , tour JSON, and{' '}
                              </>
                            : ' and '}
                            <code>assets/{client.id}/</code>. This cannot be
                            undone.
                          </p>
                          <label className={devViewPanelFieldClassName}>
                            <span className={devViewPanelFieldLabelClassName}>
                              Type <code>{client.id}</code> to confirm
                            </span>
                            <input
                              className={devViewPanelInputClassName}
                              type='text'
                              value={deleteClientConfirm}
                              onChange={(e) =>
                                setDeleteClientConfirm(e.target.value)
                              }
                              placeholder={client.id}
                              spellCheck={false}
                              autoComplete='off'
                              disabled={deleteStatus === 'working'}
                            />
                          </label>
                          <div className={devViewPanelActionsClassName}>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'secondary',
                              })}
                              onClick={cancelDeleteClient}
                              disabled={deleteStatus === 'working'}
                            >
                              Cancel
                            </button>
                            <button
                              type='button'
                              className={devViewPanelBtnVariants({
                                tone: 'danger',
                              })}
                              onClick={() => void deleteClientEntry(client.id)}
                              disabled={
                                !canConfirmDelete || deleteStatus === 'working'
                              }
                            >
                              {deleteStatus === 'working' ?
                                'Deleting…'
                              : 'Delete client permanently'}
                            </button>
                          </div>
                          {deleteError ?
                            <p className={devViewPanelSectionHintClassName}>
                              {deleteError}
                            </p>
                          : null}
                        </div>
                      : null}

                      {isEditing && selectedClient ?
                        <DevPanelFormGroup inline manageEdit>
                          <DevPanelFormSection title='Catalog client'>
                            <label className={devViewPanelFieldClassName}>
                              <span className={devViewPanelFieldLabelClassName}>
                                Display name
                              </span>
                              <input
                                className={devViewPanelInputClassName}
                                type='text'
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                spellCheck={false}
                              />
                              <p className={devViewPanelSectionHintClassName}>
                                Client id <code>{selectedClient.id}</code>{' '}
                                (read-only)
                              </p>
                            </label>
                          </DevPanelFormSection>

                          <DevPanelFormSection title='Contact' divided>
                            {contactFields}
                          </DevPanelFormSection>

                          <DevPanelFormSection
                            title='Shared branding'
                            divided
                            description='Saved to catalog.json — every tour for this client inherits unless a tour overrides.'
                          >
                            {brandingFields}
                          </DevPanelFormSection>

                          <div
                            className={devViewPanelStackedFormFooterClassName}
                          >
                            {saveError ?
                              <p className={devViewPanelSectionHintClassName}>
                                {saveError}
                              </p>
                            : null}

                            <div className={devViewPanelInlineActionsClassName}>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'secondary',
                                })}
                                onClick={cancelEditClient}
                                disabled={saveStatus === 'working'}
                              >
                                Cancel
                              </button>
                              <button
                                type='button'
                                className={devViewPanelBtnVariants({
                                  tone: 'primary',
                                })}
                                onClick={() => void saveClient()}
                                disabled={
                                  !canSaveClient || saveStatus === 'working'
                                }
                              >
                                {saveStatus === 'working' ?
                                  'Saving…'
                                : saveStatus === 'done' ?
                                  'Saved!'
                                : 'Save client'}
                              </button>
                            </div>
                          </div>
                        </DevPanelFormGroup>
                      : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          : <p className={devViewPanelSectionHintClassName}>
              No clients yet — add one to get started.
            </p>
          }
        </DevPanelFormGroup>
      </DevPanelSection>
    </DevPanelSectionAccordion>
  );
}
