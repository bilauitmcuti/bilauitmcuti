const DISCORD_CONTENT_MAX_LENGTH = 2000;
const DISCORD_EMBED_TITLE_MAX_LENGTH = 256;
const DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096;
const DISCORD_EMBED_FIELD_NAME_MAX_LENGTH = 256;
const DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH = 1024;
const DISCORD_EMBED_MAX_COUNT = 10;

export type DiscordWebhookKind = "rate_feedback";

const WEBHOOK_ENV_KEYS: Record<DiscordWebhookKind, string> = {
  rate_feedback: "DISCORD_WEBHOOK_RATE_FEEDBACK",
};

const _discordWebhookUrls: Partial<Record<DiscordWebhookKind, string>> = {};

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
}

export function getDiscordWebhookUrl(kind: DiscordWebhookKind): string {
  const cached = _discordWebhookUrls[kind];
  if (cached) return cached;
  const envKey = WEBHOOK_ENV_KEYS[kind];
  const url = process.env[envKey]?.trim();
  if (!url) {
    const devHint =
      process.env.NODE_ENV !== "production"
        ? ` Set ${envKey} in .env.local and restart \`pnpm dev\`.`
        : "";
    throw new Error(`Discord env validation failed: ${envKey} is required.${devHint}`);
  }
  _discordWebhookUrls[kind] = url;
  return url;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 3) + "...";
}

function truncateContent(content: string): string {
  return truncate(content, DISCORD_CONTENT_MAX_LENGTH);
}

function normalizeEmbed(embed: DiscordEmbed): DiscordEmbed {
  return {
    ...embed,
    title: embed.title ? truncate(embed.title, DISCORD_EMBED_TITLE_MAX_LENGTH) : undefined,
    description: embed.description
      ? truncate(embed.description, DISCORD_EMBED_DESCRIPTION_MAX_LENGTH)
      : undefined,
    fields: embed.fields?.map((field) => ({
      ...field,
      name: truncate(field.name, DISCORD_EMBED_FIELD_NAME_MAX_LENGTH),
      value: truncate(field.value, DISCORD_EMBED_FIELD_VALUE_MAX_LENGTH),
    })),
  };
}

function normalizeEmbeds(embeds: DiscordEmbed[]): DiscordEmbed[] {
  return embeds.slice(0, DISCORD_EMBED_MAX_COUNT).map(normalizeEmbed);
}

async function assertDiscordResponseOk(response: Response): Promise<void> {
  if (response.ok) return;
  const detail = await response.text().catch(() => "");
  throw new Error(`Discord webhook failed (${response.status}): ${detail.slice(0, 200)}`);
}

export async function sendDiscordWebhook(params: {
  kind: DiscordWebhookKind;
  content?: string;
  embeds: DiscordEmbed[];
}): Promise<void> {
  const url = getDiscordWebhookUrl(params.kind);
  const payload: { content?: string; embeds: DiscordEmbed[] } = {
    embeds: normalizeEmbeds(params.embeds),
  };
  if (params.content?.trim()) {
    payload.content = truncateContent(params.content.trim());
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await assertDiscordResponseOk(response);
}

export function buildContactNotificationEmbed(params: {
  who: string;
  category: string;
  message: string;
  rating: number;
  email?: string;
  time: string;
}): DiscordEmbed {
  const trimmedEmail = params.email?.trim() ?? "";
  const fields: DiscordEmbedField[] = [
    { name: "Who", value: params.who, inline: true },
    { name: "Category", value: params.category, inline: true },
    { name: "Rating", value: `${params.rating} out of 5 stars`, inline: true },
    { name: "Time", value: params.time, inline: false },
  ];
  if (trimmedEmail.length > 0) {
    fields.push({ name: "Email", value: trimmedEmail, inline: false });
  }

  return {
    title: "User Feedback",
    color: 0x5865f2,
    fields,
    description: params.message,
  };
}

const ENGAGEMENT_REASON_MAX_CHARS = 1024;

function excerptEngagementReason(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "(empty)";
  if (trimmed.length <= ENGAGEMENT_REASON_MAX_CHARS) return trimmed;
  return trimmed.slice(0, ENGAGEMENT_REASON_MAX_CHARS - 3) + "...";
}

export function buildEngagementNotificationEmbed(params: {
  rating: number;
  time: string;
  reason?: string;
}): DiscordEmbed {
  const fields: DiscordEmbed["fields"] = [
    { name: "Rating", value: `${params.rating} out of 5 stars`, inline: true },
    { name: "Time", value: params.time, inline: true },
  ];
  const reason = params.reason?.trim();
  if (reason) {
    fields.push({ name: "Reason", value: excerptEngagementReason(reason), inline: false });
  }
  return {
    title: "User Star Rating",
    color: 0xfee75c,
    fields,
  };
}

