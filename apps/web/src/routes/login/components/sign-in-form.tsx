import { Button } from "@mudahin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import z from "zod";

import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

import { FormTextField } from "./form-text-field";

const submitStateSelector = (state: {
  canSubmit: boolean;
  isSubmitting: boolean;
}) => ({
  canSubmit: state.canSubmit,
  isSubmitting: state.isSubmitting,
});

export function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate({ from: "/login/" });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({ to: "/" });
            toast.success("Berhasil masuk");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Alamat email tidak valid"),
        password: z.string().min(8, "Kata sandi minimal 8 karakter"),
      }),
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">
        Selamat Datang Kembali
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <form.Field name="email">
          {(field) => (
            <FormTextField
              autoComplete="email"
              field={field}
              label="Email"
              type="email"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormTextField
              autoComplete="current-password"
              field={field}
              label="Kata Sandi"
              type="password"
            />
          )}
        </form.Field>

        <form.Subscribe selector={submitStateSelector}>
          {({ canSubmit, isSubmitting }) => (
            <Button
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button onClick={onSwitchToSignUp} variant="link">
          Belum punya akun? Daftar
        </Button>
      </div>
    </div>
  );
}
