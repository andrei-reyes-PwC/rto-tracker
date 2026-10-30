"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe2, Save } from "lucide-react";
import type { WeekendRules } from "@/api/settings";
import { settingsSchema, type SettingsFormValues } from "@/validation/settings";
import { SettingsProvider, useSettings } from "@/providers/SettingsProvider";
import SidebarPageLayout from "@/components/SidebarPageLayout";
import PageHeading from "@/components/PageHeading";
import DataLoadError from "@/components/DataLoadError";
import InlineNotification from "@/components/InlineNotification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsManagement({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return <SettingsProvider><SettingsContent isSuperAdmin={isSuperAdmin} /></SettingsProvider>;
}

function SettingsContent({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { data, loading, saving, loadError, saveError, notice, dismissNotice, retry } = useSettings();
  const [platformId, setPlatformId] = useState<string>("");
  const platform = data?.platforms.find((item) => String(item.id) === platformId) ?? data?.platforms[0];

  return <SidebarPageLayout headerContent={<span className="text-sm font-medium">Settings</span>} defaultOpen className="bg-[#f7f6f4] text-[#2d2926]">
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 md:px-8 md:py-10">
      <PageHeading category="Administration" title="Settings" description="Manage global defaults and platform rules for office-day planning." />
      {notice && <InlineNotification tone="success" message={notice} onDismiss={dismissNotice} />}
      {saveError && <InlineNotification message={saveError} />}
      {loadError && <DataLoadError message={loadError} onRetry={retry} retrying={loading} />}
      {loading ? <div role="status" aria-label="Loading settings" aria-busy="true" className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((item) => <Card key={item} className="shadow-none"><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-9 w-28" /></CardContent></Card>)}
      </div> : !loadError && data && <div className="grid items-start gap-6 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="size-4 text-[#e65300]" /> Global defaults</CardTitle>
            <CardDescription>Applies to users without a platform and platforms that inherit global settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuperAdmin && <p className="mb-5 text-xs text-muted-foreground">Only super admins can change global settings.</p>}
            <WeekendForm rules={data.global} inheritGlobal={false} platformId={null} readOnly={!isSuperAdmin} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4 text-[#e65300]" /> Platform settings</CardTitle>
            <CardDescription>Follow the global defaults or set weekend rules for a specific platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {platform ? <>
              <div className="space-y-2">
                <Label htmlFor="settings-platform">Platform</Label>
                <Select value={String(platform.id)} onValueChange={setPlatformId} disabled={saving}>
                  <SelectTrigger id="settings-platform" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{data.platforms.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
                <Badge variant="secondary">{platform.inheritGlobal ? "Inherits global defaults" : "Platform override"}</Badge>
              </div>
              <WeekendForm key={platform.id} rules={platform.effective} inheritGlobal={platform.inheritGlobal} platformId={platform.id} readOnly={false} />
            </> : <p className="text-sm text-muted-foreground">Create a platform in Manage people to configure its settings.</p>}
          </CardContent>
        </Card>
      </div>}
      <p className="text-sm text-muted-foreground">Days marked off are excluded from the My Schedule calendar, planned office-day totals, and next office day. Existing saved plans are preserved and reappear if the day is unlocked. The weekly dashboard continues to report Monday to Friday.</p>
    </main>
  </SidebarPageLayout>;
}

function WeekendForm({ rules, inheritGlobal, platformId, readOnly }: {
  rules: WeekendRules; inheritGlobal: boolean; platformId: number | null; readOnly: boolean;
}) {
  const { data, save, saving } = useSettings();
  const id = useId();
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema), defaultValues: { ...rules, inheritGlobal },
  });
  useEffect(() => { reset({ ...rules, inheritGlobal }); }, [rules, inheritGlobal, reset]);
  const inherits = useWatch({ control, name: "inheritGlobal" });
  const disabled = readOnly || saving;

  return <form className="space-y-5" onSubmit={handleSubmit((input) => save(platformId, input))}>
    {platformId !== null && <Controller name="inheritGlobal" control={control} render={({ field }) => <div className="flex items-start gap-3 rounded-lg border bg-slate-50/60 p-4">
      <Checkbox id={`${id}-inherit`} checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} disabled={disabled} onBlur={field.onBlur} ref={field.ref} />
      <div className="space-y-1"><Label htmlFor={`${id}-inherit`}>Use global defaults</Label><p className="text-xs text-muted-foreground">Automatically follow future changes to global rules.</p></div>
    </div>} />}
    <div className="space-y-1"><p className="text-sm font-semibold">Weekend days off</p><p className="text-xs text-muted-foreground">Check a day to block new office-day selections.</p></div>
    {([['saturdayDayOff', 'Saturday'], ['sundayDayOff', 'Sunday']] as const).map(([name, label]) => <Controller key={name} name={name} control={control} render={({ field }) => <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <Label htmlFor={`${id}-${name}`}>{label}</Label>
      <Checkbox id={`${id}-${name}`} checked={platformId !== null && inherits ? data?.global[name] ?? false : field.value}
        onCheckedChange={(value) => field.onChange(value === true)} disabled={disabled || (platformId !== null && inherits)} onBlur={field.onBlur} ref={field.ref} />
    </div>} />)}
    {!readOnly && <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={saving || !isDirty} className="bg-[#e65300] text-white hover:bg-[#c74600]"><Save className="size-4" />{saving ? "Saving..." : "Save settings"}</Button>
      <Button type="button" variant="outline" disabled={saving || !isDirty} onClick={() => reset()}>Reset changes</Button>
    </div>}
  </form>;
}
