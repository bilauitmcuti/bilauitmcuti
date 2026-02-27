import { NextResponse } from "next/server";

export const runtime = "edge";

const FEEDBACK_FORM_URL = "https://forms.gle/qw13g7PJJgzRD3zk8";

export function GET() {
  return NextResponse.redirect(FEEDBACK_FORM_URL, 307);
}
