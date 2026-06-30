import { useCallback, useEffect, useMemo, useState } from 'react';
import { findCatalogClient } from '../data/tourCatalog';
import { loadTour } from '../data/loadTour';
import { DEV_CRUD_MODE_TABS, type DevCrudModeTab } from '../constants/devPanel';
import { slugifyHotspotName } from '../utils/devHotspotLogger';
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
import {
  devViewPanelActionsClassName,
  devViewPanelBrandFaviconClassName,
  devViewPanelBrandFaviconWrapClassName,
  devViewPanelBrandLogoClassName,
  devViewPanelBrandPreviewWrapClassName,
  devViewPanelBtnVariants,
  devViewPanelFieldClassName,
  devViewPanelFieldLabelClassName,
  devViewPanelFileInputClassName,
  devViewPanelInputClassName,
  devViewPanelManageListClassName,
  devViewPanelManageListItemClassName,
  devViewPanelManageListItemHeadClassName,
  devViewPanelManageListItemHeadMainClassName,
  devViewPanelManageListItemIdClassName,
  devViewPanelManageListItemTitleClassName,
  devViewPanelSecondaryTabsClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSelectClassName,
  devViewPanelSlugPreviewClassName,
  devViewPanelTabHintClassName,
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
  onCreateTourForClient: (clientId: string) => void;
};

export function DevClientPanel({
  catalogClients,
  catalogTick,
  manageClientId,
  onManageClientIdChange,
  onCatalogRefresh,
  onOpenTour,
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
  const [logoAlt, setLogoAlt] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontSourceUrl, setFontSourceUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(
    null,
  );

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

  const createClientSlug = useMemo(
    () =>
      createClientIdInput.trim() ? slugifyHotspotName(createClientIdInput) : '',
    [createClientIdInput],
  );

  const canCreateClient = Boolean(
    createClientName.trim() && createClientIdInput.trim() && createClientSlug,
  );

  const canSaveClient = Boolean(manageClientId && clientName.trim());

  useEffect(() => {
    if (!selectedClient) return;

    setClientName(selectedClient.name);
    setWebsite(selectedClient.website ?? '');
    setEmail(selectedClient.email ?? '');
    setPhone(selectedClient.phone ?? selectedClient.phones?.[0]?.number ?? '');
    setPhoneLabel(
      selectedClient.phoneLabel ?? selectedClient.phones?.[0]?.label ?? '',
    );
    setFax(selectedClient.fax ?? '');
    setFaxLabel(selectedClient.faxLabel ?? '');
    setAddress(selectedClient.address ?? '');
    setPrimaryColor(
      selectedClient.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    );
    setLogoAlt(selectedClient.branding?.logoAlt ?? selectedClient.name);
    setFontFamily(selectedClient.branding?.fontFamily ?? '');
    setFontSourceUrl(selectedClient.branding?.fontSourceUrl ?? '');
    setLogoFile(null);
    setFaviconFile(null);
    setSuggestBrandingNotes([]);
    setSuggestBrandingStatus('idle');
    setSuggestContactNotes([]);
    setSuggestContactStatus('idle');
    setSaveStatus('idle');
    setSaveError(null);
  }, [selectedClient?.id, catalogTick]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(selectedClient?.branding?.logo ?? null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, selectedClient?.branding?.logo]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreviewUrl(selectedClient?.branding?.favicon ?? null);
      return;
    }
    const url = URL.createObjectURL(faviconFile);
    setFaviconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [faviconFile, selectedClient?.branding?.favicon]);

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
        clientLogoAlt: logoAlt.trim() || undefined,
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
    logoAlt,
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
        clientLogoAlt: logoAlt.trim() || undefined,
        primaryColor: normalizeHexColorInput(primaryColor),
        fontFamily: fontFamily.trim() || undefined,
        fontSourceUrl: fontSourceUrl.trim() || undefined,
        logoFile,
        faviconFile,
      });
      await onCatalogRefresh();
      onManageClientIdChange(result.clientId);
      setClientModeTab('manage');
      setCreateClientIdInput('');
      setCreateClientName('');
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
    logoAlt,
    logoFile,
    onCatalogRefresh,
    onManageClientIdChange,
    phone,
    phoneLabel,
    primaryColor,
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

      <label className={devViewPanelFieldClassName}>
        <span className={devViewPanelFieldLabelClassName}>Logo alt text</span>
        <input
          className={devViewPanelInputClassName}
          type='text'
          value={logoAlt}
          onChange={(e) => setLogoAlt(e.target.value)}
          placeholder={clientName.trim() || 'Client name'}
          spellCheck={true}
        />
      </label>

      <DevPanelFormRow>
        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>Logo</span>
          <input
            className={devViewPanelFileInputClassName}
            type='file'
            accept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          {logoPreviewUrl ?
            <div className={devViewPanelBrandPreviewWrapClassName}>
              <img
                className={devViewPanelBrandLogoClassName}
                src={logoPreviewUrl}
                alt='Logo preview'
              />
            </div>
          : null}
        </label>

        <label className={devViewPanelFieldClassName}>
          <span className={devViewPanelFieldLabelClassName}>
            Favicon (optional)
          </span>
          <input
            className={devViewPanelFileInputClassName}
            type='file'
            accept='image/png,image/jpeg,image/webp,image/x-icon,.png,.jpg,.jpeg,.webp,.ico'
            onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
          />
          {faviconPreviewUrl ?
            <div className={devViewPanelBrandFaviconWrapClassName}>
              <img
                className={devViewPanelBrandFaviconClassName}
                src={faviconPreviewUrl}
                alt='Favicon preview'
              />
            </div>
          : null}
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
            onClick={() => setClientModeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {clientModeTab === 'manage' ?
        <>
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

                <DevPanelFormSection title='Tours' divided>
                  {selectedClient.tours.length > 0 ?
                    <ul className={devViewPanelManageListClassName}>
                      {selectedClient.tours.map((catalogTour) => (
                        <li
                          key={catalogTour.id}
                          className={devViewPanelManageListItemClassName}
                        >
                          <div
                            className={devViewPanelManageListItemHeadClassName}
                          >
                            <div
                              className={
                                devViewPanelManageListItemHeadMainClassName
                              }
                            >
                              <span
                                className={
                                  devViewPanelManageListItemTitleClassName
                                }
                              >
                                {catalogTour.name}
                              </span>
                              <span
                                className={
                                  devViewPanelManageListItemIdClassName
                                }
                              >
                                {catalogTour.id}
                              </span>
                            </div>
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
                          </div>
                        </li>
                      ))}
                    </ul>
                  : <p className={devViewPanelSectionHintClassName}>
                      No tours yet.
                    </p>
                  }

                  <div className={devViewPanelActionsClassName}>
                    <button
                      type='button'
                      className={devViewPanelBtnVariants({ tone: 'secondary' })}
                      onClick={() => onCreateTourForClient(manageClientId)}
                    >
                      Add tour for this client…
                    </button>
                  </div>
                </DevPanelFormSection>

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
                {saveError ?
                  <p className={devViewPanelSectionHintClassName}>
                    {saveError}
                  </p>
                : null}
              </>
            : null}
          </DevPanelFormGroup>
        </>
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

            <DevPanelFormSection title='Shared branding' divided>
              {brandingFields}
            </DevPanelFormSection>

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
            {createError ?
              <p className={devViewPanelSectionHintClassName}>{createError}</p>
            : null}
          </DevPanelFormGroup>
        </>
      }
    </>
  );
}
