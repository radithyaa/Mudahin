import { Input } from "@mudahin/ui/components/input";
import { Label } from "@mudahin/ui/components/label";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useCallback } from "react";

interface FormTextFieldProps {
  autoComplete?: string;
  field: AnyFieldApi;
  label: string;
  type?: string;
}

/** Input teks terikat ke field TanStack Form, dengan label + pesan error aksesibel. */
export function FormTextField({
  field,
  label,
  type = "text",
  autoComplete,
}: FormTextFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      field.handleChange(e.target.value),
    [field]
  );

  const errors = field.state.meta.errors.filter(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        aria-describedby={errors.length > 0 ? `${field.name}-error` : undefined}
        aria-invalid={errors.length > 0}
        autoComplete={autoComplete}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={handleChange}
        type={type}
        value={field.state.value}
      />
      {errors.map((error) => (
        <p
          className="text-destructive text-sm"
          id={`${field.name}-error`}
          key={error?.message}
        >
          {error?.message}
        </p>
      ))}
    </div>
  );
}
