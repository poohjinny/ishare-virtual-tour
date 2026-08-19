"use client";

import { Mail, Phone, Save, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { FormField, FormHint } from "@/components/form-field";
import { InputGroup } from "@/components/input-group";
import { FormCancelButton, StickyFormActions } from "@/components/form-status";
import { PendingButton } from "@/components/pending-button";
import { StaffRoleBadge } from "@/components/status-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminAccountInitials,
  useAdminAccountIdentity,
  type AdminAccountIdentity,
} from "@/lib/admin-account";
import { ADMIN_ACCOUNT_COPY } from "@/lib/authoring-copy";
import { showFormError, showFormSuccess } from "@/lib/form-toast";

export function AccountProfileForm() {
  const { identity, saveIdentity } = useAdminAccountIdentity();
  return (
    <AccountProfileEditor
      key={`${identity.name}\u0000${identity.email}\u0000${identity.phone}`}
      identity={identity}
      saveIdentity={saveIdentity}
    />
  );
}

function AccountProfileEditor({
  identity,
  saveIdentity,
}: {
  identity: AdminAccountIdentity;
  saveIdentity: (identity: AdminAccountIdentity) => void;
}) {
  const [form, setForm] = useState(identity);
  const [savedForm, setSavedForm] = useState(identity);
  const isDirty =
    form.name !== savedForm.name ||
    form.email !== savedForm.email ||
    form.phone !== savedForm.phone;

  function setField(field: keyof AdminAccountIdentity, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdentity = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    try {
      saveIdentity(nextIdentity);
      setForm(nextIdentity);
      setSavedForm(nextIdentity);
      showFormSuccess(ADMIN_ACCOUNT_COPY.form.success);
    } catch (error) {
      showFormError(error, ADMIN_ACCOUNT_COPY.form.error);
    }
  }

  return (
    <Card className="h-full border-primary/15">
      <CardHeader className="gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <Avatar className="size-16">
          <AvatarImage src={ADMIN_ACCOUNT_COPY.avatarSrc} alt="" />
          <AvatarFallback className="text-lg">
            {adminAccountInitials(form.name)}
          </AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 gap-1.5">
          <Badge variant="info">{ADMIN_ACCOUNT_COPY.identityStatus}</Badge>
          <h2 className="type-title leading-snug">
            {form.name || ADMIN_ACCOUNT_COPY.form.emptyName}
          </h2>
          <CardDescription>
            {ADMIN_ACCOUNT_COPY.identityDescription}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="admin-form" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={ADMIN_ACCOUNT_COPY.form.name.label}
              htmlFor="account-name"
              description={ADMIN_ACCOUNT_COPY.form.name.description}
            >
              <InputGroup icon={UserRound}>
                <Input
                  id="account-name"
                  name="name"
                  value={form.name}
                  placeholder={ADMIN_ACCOUNT_COPY.form.name.placeholder}
                  maxLength={ADMIN_ACCOUNT_COPY.form.name.maxLength}
                  autoComplete="name"
                  required
                  onChange={(event) => setField("name", event.target.value)}
                />
              </InputGroup>
            </FormField>
            <FormField
              label={ADMIN_ACCOUNT_COPY.form.email.label}
              htmlFor="account-email"
              description={ADMIN_ACCOUNT_COPY.form.email.description}
            >
              <InputGroup icon={Mail}>
                <Input
                  id="account-email"
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder={ADMIN_ACCOUNT_COPY.form.email.placeholder}
                  maxLength={ADMIN_ACCOUNT_COPY.form.email.maxLength}
                  autoComplete="email"
                  required
                  onChange={(event) => setField("email", event.target.value)}
                />
              </InputGroup>
            </FormField>
            <FormField
              label={ADMIN_ACCOUNT_COPY.form.phone.label}
              htmlFor="account-phone"
              description={ADMIN_ACCOUNT_COPY.form.phone.description}
            >
              <InputGroup icon={Phone}>
                <Input
                  id="account-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  placeholder={ADMIN_ACCOUNT_COPY.form.phone.placeholder}
                  maxLength={ADMIN_ACCOUNT_COPY.form.phone.maxLength}
                  autoComplete="tel"
                  onChange={(event) => setField("phone", event.target.value)}
                />
              </InputGroup>
            </FormField>
          </div>
          <div className="rounded-lg border bg-muted/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <span className="type-label text-muted-foreground">
                  {ADMIN_ACCOUNT_COPY.form.roleLabel}
                </span>
                <StaffRoleBadge role={ADMIN_ACCOUNT_COPY.role} />
              </div>
              <FormHint className="max-w-md">
                {ADMIN_ACCOUNT_COPY.form.persistenceHint}
              </FormHint>
            </div>
          </div>
          <StickyFormActions>
            <FormCancelButton
              disabled={!isDirty}
              onReset={() => setForm(savedForm)}
            />
            <PendingButton type="submit" disabled={!isDirty}>
              <Save aria-hidden="true" />
              {ADMIN_ACCOUNT_COPY.form.save}
            </PendingButton>
          </StickyFormActions>
        </form>
      </CardContent>
    </Card>
  );
}
