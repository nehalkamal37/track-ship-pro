import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DEMO_CREDENTIALS } from "@/api/authApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TrackFlow Operations Console" },
      { name: "description", content: "Sign in to the TrackFlow console to manage shipments and merchants." },
      { property: "og:title", content: "Sign in — TrackFlow Operations Console" },
      { property: "og:description", content: "Secure access to shipment operations and delivery intelligence." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof schema>;

function LoginPage() {
  const { login, user, isReady } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  useEffect(() => {
    if (isReady && user) navigate({ to: "/dashboard", replace: true });
  }, [isReady, user, navigate]);

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    try {
      await login(values);
      navigate({ to: "/dashboard", replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in right now.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Truck className="size-4.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">TrackFlow</span>
            <span className="block text-xs text-muted-foreground">Operations console</span>
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your TrackFlow operations account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0 size-9"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" aria-hidden="true" />
                            ) : (
                              <Eye className="size-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
                      </FormControl>
                      <FormLabel className="font-normal">Remember me on this device</FormLabel>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-5 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Prototype credentials</p>
              <p className="mt-1 font-mono">{DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}</p>
              <p className="mt-1">operator@trackflow.io and merchant@trackflow.io use the same password.</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Tracking a package?{" "}
          <Link to="/track" className="font-medium text-primary underline-offset-4 hover:underline">
            Track your shipment
          </Link>
        </p>
      </div>
    </div>
  );
}
