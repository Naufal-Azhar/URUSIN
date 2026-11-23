import { Alert } from "@/components/ui/alert";
import { adminMessage } from "@/modules/admin/messages";

export function AdminNotice({ msg, error }: { msg?: string; error?: string }) {
  const success = adminMessage(msg);
  const failure = adminMessage(error);

  return (
    <>
      {success ? (
        <Alert variant="info" aria-live="polite">
          {success}
        </Alert>
      ) : null}
      {failure ? (
        <Alert variant="danger" aria-live="polite">
          {failure}
        </Alert>
      ) : null}
    </>
  );
}
