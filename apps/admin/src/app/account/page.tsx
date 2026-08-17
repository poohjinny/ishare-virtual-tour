import { Settings2, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { AccountProfileForm } from "@/components/account-profile-form";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader, PageMain } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ADMIN_ACCOUNT_COPY } from "@/lib/authoring-copy";

export default function AccountPage() {
  return (
    <AdminShell currentPage={ADMIN_ACCOUNT_COPY.label}>
      <PageMain>
        <PageHeader
          title={ADMIN_ACCOUNT_COPY.label}
          description={ADMIN_ACCOUNT_COPY.description}
          icon={UserRound}
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]">
          <AccountProfileForm />

          <Card className="h-full border-info/15">
            <CardHeader className="gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <CardTitle>
                  <h2>{ADMIN_ACCOUNT_COPY.accessTitle}</h2>
                </CardTitle>
              </div>
              <CardDescription>
                {ADMIN_ACCOUNT_COPY.accessDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="type-label text-muted-foreground">
                {ADMIN_ACCOUNT_COPY.accessStatus}
              </p>
              <p className="type-body text-muted-foreground">
                {ADMIN_ACCOUNT_COPY.accessDetail}
              </p>
              <div className="border-t pt-4">
                <p className="mb-3 type-body text-muted-foreground">
                  {ADMIN_ACCOUNT_COPY.preferencesDetail}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/settings" prefetch>
                    <Settings2 aria-hidden="true" />
                    {ADMIN_ACCOUNT_COPY.openSettings}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageMain>
    </AdminShell>
  );
}
