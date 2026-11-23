"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/modules/auth/schemas";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      callbackUrl,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const result = await signIn("email", {
        email: values.email,
        callbackUrl: values.callbackUrl ?? "/dashboard",
        redirect: false,
      });

      if (!result?.ok) {
        setServerError("Tautan masuk belum dapat dikirim. Tunggu beberapa saat lalu coba lagi.");
        return;
      }

      router.push("/masuk/cek-email");
    } catch {
      setServerError("Tautan masuk belum dapat dikirim. Tunggu beberapa saat lalu coba lagi.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : "email-help"}
          {...register("email")}
        />
        <p id="email-help" className="text-muted text-sm">
          Kami akan mengirim tautan masuk. Tidak ada password yang perlu dibuat.
        </p>
        {errors.email ? (
          <p id="email-error" className="text-danger text-sm font-medium" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="danger" aria-live="polite">
          {serverError}
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim…" : "Kirim tautan masuk"}
      </Button>
    </form>
  );
}
