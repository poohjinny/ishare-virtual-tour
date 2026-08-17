'use client';

import {
  AlignLeft,
  BadgeDollarSign,
  Building2,
  Eye,
  HandHeart,
  Link2,
  Save,
  Shapes,
  Tag,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  CollapsibleFormSection,
  FormDescription,
  FormHint,
} from '@/components/form-field';
import { FormCancelButton, StickyFormActions } from '@/components/form-status';
import { InputGroup } from '@/components/input-group';
import { PendingButton } from '@/components/pending-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateLocalNaming } from '@/lib/admin-dev-api';
import {
  NAMING_DONOR_KIND_OPTIONS,
  NAMING_FORM_COPY,
  NAMING_STATUS_OPTIONS,
  SCENE_VISIBILITY_OPTIONS,
} from '@/lib/authoring-copy';
import { showFormError, showFormSuccess } from '@/lib/form-toast';
import type {
  AdminNamingOpportunity,
  AdminNamingStatus,
} from '@/lib/tour-namings';

export function NamingEditorForm({
  canEdit,
  naming,
  onCancel,
  onSaved,
  tourId,
}: {
  canEdit: boolean;
  naming: AdminNamingOpportunity;
  onCancel?: () => void;
  onSaved?: () => void;
  tourId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(naming);
  const [savedForm, setSavedForm] = useState(naming);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  async function save() {
    setIsSaving(true);
    try {
      await updateLocalNaming(tourId, form);
      setSavedForm(form);
      showFormSuccess('Naming opportunity saved.');
      onSaved?.();
      router.refresh();
    } catch (error) {
      showFormError(error, 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  function cancel() {
    setForm(savedForm);
    onCancel?.();
  }

  return (
    <div className='admin-form'>
      <p className='type-meta font-mono'>{naming.id}</p>
      <CollapsibleFormSection
        title={NAMING_FORM_COPY.basicsSection}
        icon={Tag}
        description={NAMING_FORM_COPY.basicsSectionDescription}
        defaultOpen
      >
        <div className='grid gap-2'>
          <Label htmlFor={`naming-name-${naming.id}`}>
            {NAMING_FORM_COPY.nameOptional}
          </Label>
          <FormDescription>{NAMING_FORM_COPY.nameDescription}</FormDescription>
          <InputGroup icon={Tag}>
            <Input
              id={`naming-name-${naming.id}`}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={NAMING_FORM_COPY.namePlaceholder}
              disabled={!canEdit}
            />
          </InputGroup>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='grid gap-2'>
            <Label htmlFor={`naming-price-${naming.id}`}>Price</Label>
            <FormDescription>
              {NAMING_FORM_COPY.priceDescription}
            </FormDescription>
            <InputGroup icon={BadgeDollarSign}>
              <Input
                id={`naming-price-${naming.id}`}
                type='number'
                min='0'
                placeholder={NAMING_FORM_COPY.pricePlaceholder}
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: Number(event.target.value) || 0,
                  }))
                }
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Status</Label>
            <FormDescription>
              {NAMING_FORM_COPY.statusDescription}
            </FormDescription>
            <InputGroup icon={Shapes}>
              <Select
                value={form.status}
                onValueChange={(status) =>
                  setForm((current) => ({
                    ...current,
                    status: status as AdminNamingStatus,
                  }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>Visibility</Label>
            <FormDescription>
              {NAMING_FORM_COPY.visibilityDescription}
            </FormDescription>
            <InputGroup icon={Eye}>
              <Select
                value={form.visibility}
                onValueChange={(visibility) =>
                  setForm((current) => ({
                    ...current,
                    visibility:
                      visibility as AdminNamingOpportunity['visibility'],
                  }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENE_VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title={NAMING_FORM_COPY.contentSection}
        icon={AlignLeft}
        description={NAMING_FORM_COPY.contentSectionDescription}
        defaultOpen
      >
        <div className='grid gap-2'>
          <Label htmlFor={`naming-body-${naming.id}`}>Body</Label>
          <FormDescription>{NAMING_FORM_COPY.bodyDescription}</FormDescription>
          <Textarea
            id={`naming-body-${naming.id}`}
            value={form.body}
            onChange={(event) =>
              setForm((current) => ({ ...current, body: event.target.value }))
            }
            placeholder={NAMING_FORM_COPY.bodyPlaceholder}
            disabled={!canEdit}
          />
          <FormHint>{NAMING_FORM_COPY.bodyHint}</FormHint>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor={`naming-video-${naming.id}`}>
            {NAMING_FORM_COPY.videoUrl}
          </Label>
          <FormDescription>
            {NAMING_FORM_COPY.videoUrlDescription}
          </FormDescription>
          <InputGroup icon={Link2}>
            <Input
              id={`naming-video-${naming.id}`}
              value={form.videoUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  videoUrl: event.target.value,
                }))
              }
              placeholder={NAMING_FORM_COPY.videoUrlPlaceholder}
              disabled={!canEdit}
            />
          </InputGroup>
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title={NAMING_FORM_COPY.donorSection}
        icon={HandHeart}
        description={NAMING_FORM_COPY.donorSectionDescription}
        defaultOpen
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor={`naming-donor-name-${naming.id}`}>
              {NAMING_FORM_COPY.donorName}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorNameDescription}
            </FormDescription>
            <InputGroup icon={UserRound}>
              <Input
                id={`naming-donor-name-${naming.id}`}
                value={form.donor?.name ?? ''}
                placeholder={NAMING_FORM_COPY.donorNamePlaceholder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    donor: {
                      name: event.target.value,
                      kind: current.donor?.kind ?? 'organization',
                      affiliation: current.donor?.affiliation,
                      website: current.donor?.website,
                    },
                  }))
                }
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label>{NAMING_FORM_COPY.donorKind}</Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorKindDescription}
            </FormDescription>
            <InputGroup icon={Shapes}>
              <Select
                value={form.donor?.kind ?? 'organization'}
                onValueChange={(kind) =>
                  setForm((current) => ({
                    ...current,
                    donor: {
                      name: current.donor?.name ?? '',
                      kind: kind as 'organization' | 'person',
                      affiliation: current.donor?.affiliation,
                      website: current.donor?.website,
                    },
                  }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAMING_DONOR_KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={`naming-donor-affiliation-${naming.id}`}>
              {NAMING_FORM_COPY.donorAffiliation}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorAffiliationDescription}
            </FormDescription>
            <InputGroup icon={Building2}>
              <Input
                id={`naming-donor-affiliation-${naming.id}`}
                value={form.donor?.affiliation ?? ''}
                placeholder={NAMING_FORM_COPY.donorAffiliationPlaceholder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    donor: {
                      name: current.donor?.name ?? '',
                      kind: current.donor?.kind ?? 'organization',
                      affiliation: event.target.value,
                      website: current.donor?.website,
                    },
                  }))
                }
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor={`naming-donor-website-${naming.id}`}>
              {NAMING_FORM_COPY.donorWebsite}
            </Label>
            <FormDescription>
              {NAMING_FORM_COPY.donorWebsiteDescription}
            </FormDescription>
            <InputGroup icon={Link2}>
              <Input
                id={`naming-donor-website-${naming.id}`}
                value={form.donor?.website ?? ''}
                placeholder={NAMING_FORM_COPY.donorWebsitePlaceholder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    donor: {
                      name: current.donor?.name ?? '',
                      kind: current.donor?.kind ?? 'organization',
                      affiliation: current.donor?.affiliation,
                      website: event.target.value,
                    },
                  }))
                }
                disabled={!canEdit}
              />
            </InputGroup>
          </div>
        </div>
      </CollapsibleFormSection>

      {canEdit ?
        <StickyFormActions>
          <FormCancelButton disabled={isSaving} onReset={cancel} />
          <PendingButton
            type='button'
            pending={isSaving}
            pendingLabel='Saving…'
            disabled={!isDirty}
            onClick={save}
          >
            <Save aria-hidden='true' />
            Save changes
          </PendingButton>
        </StickyFormActions>
      : <FormHint>
          Editing is available only while the local development authoring API is
          enabled.
        </FormHint>
      }
    </div>
  );
}
