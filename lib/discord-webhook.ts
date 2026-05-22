const DISCORD_CONTENT_MAX_LENGTH = 2000;

let _discordWebhookUrl: string | null = null;

export function getDiscordWebhookUrl(): string {
  if (_discordWebhookUrl) return _discordWebhookUrl;
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) {
    const devHint =
      process.env.NODE_ENV !== "production"
        ? " Set DISCORD_WEBHOOK_URL in .env.local (replace TELEGRAM_*) and restart `pnpm dev`."
        : "";
    throw new Error(`Discord env validation failed: DISCORD_WEBHOOK_URL is required.${devHint}`);
  }
  _discordWebhookUrl = url;
  return _discordWebhookUrl;
}

function truncateContent(content: string): string {
  if (content.length <= DISCORD_CONTENT_MAX_LENGTH) return content;
  return content.slice(0, DISCORD_CONTENT_MAX_LENGTH - 3) + "...";
}

async function assertDiscordResponseOk(response: Response): Promise<void> {
  if (response.ok) return;
  const detail = await response.text().catch(() => "");
  throw new Error(`Discord webhook failed (${response.status}): ${detail.slice(0, 200)}`);
}

export async function sendDiscordWebhook(content: string): Promise<void> {
  const url = getDiscordWebhookUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: truncateContent(content) }),
  });
  await assertDiscordResponseOk(response);
}

export async function sendDiscordWebhookWithFile(params: {
  content: string;
  file: File;
}): Promise<void> {
  const url = getDiscordWebhookUrl();
  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({ content: truncateContent(params.content) })
  );
  form.append("files[0]", params.file, params.file.name || "proof");

  const response = await fetch(url, {
    method: "POST",
    body: form,
  });
  await assertDiscordResponseOk(response);
}
