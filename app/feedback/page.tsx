import { FeedbackFormPage } from "@/components/feedback-form-page";
import { getTurnstileSiteKey } from "@/lib/turnstile-config";

export default function FeedbackPage() {
  return <FeedbackFormPage initialTurnstileSiteKey={getTurnstileSiteKey()} />;
}
