"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/api/auth";
import { getSafeReturnPath } from "@/api/return-path";
import { useAuth } from "@/providers/AuthProvider";
import { loginSchema, type LoginFormValues } from "@/validation/login";
import { ArrowRight, Building2, CalendarDays, ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginForm() {
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const { refreshUser } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: LoginFormValues) {
    setNotice("");
    const result = await login(values);
    if (!result.success) {
      setNotice(result.message);
      return;
    }
    await refreshUser();
    form.reset();
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(getSafeReturnPath(next) ?? "/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f6] px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-48 size-[34rem] rounded-full bg-[#ffe5d6] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -right-40 size-[38rem] rounded-full bg-[#f5e9de] blur-3xl" />

      <Card className="relative grid w-full max-w-5xl overflow-visible rounded-3xl border border-black/5 bg-white p-0 shadow-[0_28px_90px_-42px_rgba(51,31,20,0.3)] md:min-h-[620px] md:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#25201d] p-10 text-white md:flex md:rounded-l-3xl md:rounded-r-none lg:p-12">
          <div aria-hidden="true" className="absolute -right-28 -top-24 size-96 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-16 -top-12 size-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-36 -left-24 size-80 rounded-full bg-[#e65300]/80 blur-3xl" />

          <a href="/" className="relative inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#e65300] text-xs font-bold tracking-wide">PwC</span>
            <span className="text-sm font-semibold tracking-wide">AC Manila</span>
          </a>

          <div className="relative max-w-sm py-12">
            <span className="mb-6 inline-flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-[#ff9b62]">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#ff9b62]">Your week, in sync</p>
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight lg:text-[2.75rem]">Make every office day count.</h1>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/65">Plan your time in the office and see your team&apos;s schedule in one place.</p>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-white/55">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/10"><CalendarDays className="size-4" aria-hidden="true" /></span>
            RTO Planner · AC Manila
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14">
          <Card className="w-full max-w-sm gap-0 overflow-visible rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
            <CardHeader className="mb-8 gap-0 p-0">
              <a href="/" className="mb-12 inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-[#302b27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e65300] md:hidden">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e65300] text-[10px] font-bold text-white">PwC</span>
                AC Manila
              </a>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c64a0a]">Welcome back</p>
              <CardTitle className="text-3xl font-semibold tracking-tight text-[#282522]">Sign in to your account</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">Enter your work email and password to continue.</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-5">
                <div className="space-y-2">
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <>
                        <Label htmlFor={field.name} className="text-[#302b27]">Work email</Label>
                        <Input
                          {...field}
                          id={field.name}
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "email-error" : undefined}
                          onChange={(event) => {
                            field.onChange(event);
                            setNotice("");
                          }}
                          className="h-11 rounded-xl px-3"
                        />
                        {fieldState.error && <p id="email-error" className="text-xs font-medium text-destructive">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Controller
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <>
                        <Label htmlFor={field.name} className="text-[#302b27]">Password</Label>
                        <Input
                          {...field}
                          id={field.name}
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "password-error" : undefined}
                          onChange={(event) => {
                            field.onChange(event);
                            setNotice("");
                          }}
                          className="h-11 rounded-xl px-3"
                        />
                        {fieldState.error && <p id="password-error" className="text-xs font-medium text-destructive">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="h-11 w-full rounded-xl bg-[#e65300] text-white hover:bg-[#ca4900]">
                  {form.formState.isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Button>

                {notice && (
                  <Alert className="border-[#e8c4ad] bg-[#fff8f3] text-[#713b1d]">
                    <ShieldCheck aria-hidden="true" />
                    <AlertDescription className="text-[#713b1d]">{notice}</AlertDescription>
                  </Alert>
                )}
              </form>

              <div className="mt-7 space-y-5">
                <Separator />
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-[#b54a16]" aria-hidden="true" />
                  <span>Use your organization account</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </Card>
    </main>
  );
}
