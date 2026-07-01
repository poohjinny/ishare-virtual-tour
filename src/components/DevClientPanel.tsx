import { useCallback, useEffect, useMemo, useState } from 'react';
import { findCatalogClient } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { DEV_CRUD_MODE_TABS, type DevCrudModeTab } from '../constants/devPanel';
import { slugifyHotspotName } from '../utils/devHotspotLogger';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import { DevBrandFaviconPreview } from './DevBrandFaviconPreview';
import {
  DevTourApiError,
  devBase64ToImageFile,
  devCreateClient,
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
  devViewPanelActionsClassName,
  devViewPanelBtnVariants,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelInputClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListFooterClassName,
  devViewPanelManageListItemBulletClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemHeadClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemIdClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelSecondaryTabsClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelStackedFormFooterClassName,
  devViewPanelTabHintClassName,
  devViewPanelTabPanelBodyClassName,
  devViewPanelTabVariants,
  devViewPanelTextareaClassName,
} from './devViewPanelVariants';

const DEFAULT_PRIMARY_COLOR = '#007078';

type ActionStatus = 'idle' | 'working' | 'done' | 'error';

type DevClientPanelProps = {
  catalogClients: DevCatalogClient[];
  catalogTick: number;
  manageClientId: string;
  onManageClientIdChange: (clientId: string) => void;
  onCatalogRefresh: () => Promise<void>;
  onOpenTour: (tourId: string) => void;
  onEditTour: (tourId: string) => void;
  onCreateTourForClient: (clientId: string) => void;
};

export function DevClientPanel({
  catalogClients,
  catalogTick,
  manageClientId,
  onManageClientIdChange,
  onCatalogRefresh,
  onOpenTour,
  onEditTour,
  onCreateTourForClient,
}: DevClientPanelProps) {
  const [clientModeTab, setClientModeTab] = useState<DevCrudModeTab>('manage');

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

  const managedLogoPreviewUrl = useMemo(() => {
    if (clientModeTab !== 'manage' || logoFile) return null;
    const path = selectedManageCatalogClient?.branding?.logo;
    if (!path) return null;
    return withBaseUrl(appendCacheBust(path, catalogTick));
  }, [
    catalogTick,
    clientModeTab,
    logoFile,
    selectedManageCatalogClient?.branding?.logo,
  ]);

  const managedFaviconPreviewAlt = useMemo(
    () =>
      `${clientName.trim() || selectedManageCatalogClient?.name || 'Client'} favicon`,
    [clientName, selectedManageCatalogClient?.name],
  );

  const showManagedFaviconPreview =
    clientModeTab === 'manage' &&
    Boolean(manageClientId) &&
    !faviconFile;

  const createClientSlug = useMemo(
    () =>
      createClientIdInput.trim() ? slugifyHotspotName(createClientIdInput) : '',
    [createClientIdInput],
  );

  const canCreateClient = Boolean(
    createClientName.trim() && createClientIdInput.trim() && createClientSlug,
  );

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

  const handleClientModeTabChange = useCallback(
    (tab: DevCrudModeTab) => {
      if (tab === 'create') {
        resetCreateClientForm();
      }
      setClientModeTab(tab);
    },
    [resetCreateClientForm],
  );

  useEffect(() => {
    if (clientModeTab !== 'manage' || !selectedManageCatalogClient) return;
    hydrateManagedClientForm(selectedManageCatalogClient);
  }, [
    clientModeTab,
    selectedManageCatalogClient,
    catalogTick,
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
      setClientModeTab('manage');
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
        <div className={devViewPanelActionsClassName}>
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
        <div className={devViewPanelActionsClassName}>
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
            {clientModeTab === 'manage' && managedLogoPreviewUrl ?
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
    <>
      <div
        className={devViewPanelSecondaryTabsClassName}
        role='tablist'
        aria-label='Client mode'
      >
        {DEV_CRUD_MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={clientModeTab === tab.id}
            className={devViewPanelTabVariants({
              depth: 'secondary',
              kind: tab.id === 'manage' ? 'manage' : 'create',
              active: clientModeTab === tab.id,
            })}
            onClick={() => handleClientModeTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {clientModeTab === 'manage' ?
        <div className={devViewPanelTabPanelBodyClassName}>
          <p className={devViewPanelTabHintClassName}>
            Shared contact and branding for all tours under this client.
          </p>

          <DevPanelFormGroup stacked>
            <DevPanelFormSection title='Catalog client'>
              <label className={devViewPanelFieldClassName}>
                <span className={devViewPanelFieldLabelClassName}>Client</span>
                <select
                  className={devViewPanelSelectClassName}
                  value={manageClientId}
                  onChange={(e) => onManageClientIdChange(e.target.value)}
                >
                  {catalogClients.length === 0 ?
                    <option value=''>Loading clients…</option>
                  : catalogClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.id}) · {client.tourCount} tour
                        {client.tourCount === 1 ? '' : 's'}
                      </option>
                    ))
                  }
                </select>
              </label>

              {selectedClient ?
                <>
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
                      Client id <code>{selectedClient.id}</code> (read-only)
                    </p>
                  </label>
                </>
              : null}
            </DevPanelFormSection>

            {selectedClient ?
              <>
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
                  {saveError ?
                    <p className={devViewPanelSectionHintClassName}>
                      {saveError}
                    </p>
                  : null}

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'primary' })}
                      onClick={() => void saveClient()}
                      disabled={!canSaveClient || saveStatus === 'working'}
                    >
                      {saveStatus === 'working' ?
                        'Saving…'
                      : saveStatus === 'done' ?
                        'Saved!'
                      : 'Save client'}
                    </button>
                  </div>
                </div>
              </>
            : null}
          </DevPanelFormGroup>

          {selectedClient ?
            <DevPanelFormGroup
              title='Tours'
              hint='Open a tour to edit it in the Tour tab, or add a new one for this client.'
            >
              {selectedClient.tours.length > 0 ?
                <ul className={devViewPanelManageListClassName}>
                  {selectedClient.tours.map((catalogTour) => (
                    <li
                      key={catalogTour.id}
                      className={devViewPanelManageListItemClassName}
                    >
                      <div className={devViewPanelManageListItemHeadClassName}>
                        <div
                          className={
                            devViewPanelManageListItemHeadMainClassName
                          }
                        >
                          <span
                            className={devViewPanelManageListItemTitleClassName}
                          >
                            {catalogTour.name}
                          </span>
                          <span
                            className={
                              devViewPanelManageListItemBulletClassName
                            }
                            aria-hidden='true'
                          >
                            ·
                          </span>
                          <code
                            className={devViewPanelManageListItemIdClassName}
                          >
                            {catalogTour.id}
                          </code>
                        </div>
                      </div>
                      <div className={devViewPanelActionsClassName}>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() => {
                            loadTour(catalogTour.id);
                            onOpenTour(catalogTour.id);
                          }}
                        >
                          Open
                        </button>
                        <button
                          type='button'
                          className={devViewPanelBtnVariants({
                            tone: 'secondary',
                          })}
                          onClick={() => {
                            loadTour(catalogTour.id);
                            onEditTour(catalogTour.id);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              : <p className={devViewPanelSectionHintClassName}>
                  No tours yet.
                </p>
              }

              <div className={devViewPanelManageListFooterClassName}>
                <button
                  type='button'
                  className={devViewPanelBtnVariants({ tone: 'secondary' })}
                  onClick={() => onCreateTourForClient(manageClientId)}
                >
                  Add tour for this client
                </button>
              </div>
            </DevPanelFormGroup>
          : null}
        </div>
      : <>
          <p className={devViewPanelTabHintClassName}>
            Create a catalog client without a tour. Add tours from Manage or
            Tour → Create.
          </p>

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
                </label>
                <label className={devViewPanelFieldClassName}>
                  <span className={devViewPanelFieldLabelClassName}>
                    Client id
                  </span>
                  <input
                    className={devViewPanelInputClassName}
                    type='text'
                    value={createClientIdInput}
                    onChange={(e) => setCreateClientIdInput(e.target.value)}
                    placeholder='e.g. example-foundation'
                    spellCheck={false}
                  />
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
                <p className={devViewPanelSectionHintClassName}>
                  {createError}
                </p>
              : null}

              <div className={devViewPanelActionsClassName}>
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
        </>
      }
    </>
  );
}
