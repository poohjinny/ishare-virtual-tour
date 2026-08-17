import { toast } from 'sonner';

export function showFormSuccess(message: string) {
  toast.success(message);
}

export function showFormError(error: unknown, fallback: string) {
  toast.error(
    error instanceof Error ? error.message
    : typeof error === 'string' ? error
    : fallback,
  );
}
