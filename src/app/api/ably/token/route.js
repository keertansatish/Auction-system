import * as Ably from "ably";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function issueToken(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "You must be signed in." }, { status: 401 });
  }

  const auctionId = new URL(request.url).searchParams.get("auctionId");

  if (!auctionId) {
    return Response.json({ error: "auctionId is required." }, { status: 400 });
  }

  if (!process.env.ABLY_API_KEY) {
    return Response.json({ error: "Ably is not configured." }, { status: 503 });
  }

  const ably = new Ably.Rest(process.env.ABLY_API_KEY);
  const tokenRequest = await ably.auth.createTokenRequest({
    capability: JSON.stringify({ [`auction:${auctionId}`]: ["subscribe"] }),
    clientId: user.id,
  });

  return Response.json(tokenRequest);
}

export const GET = issueToken;
export const POST = issueToken;
