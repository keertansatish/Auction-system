import * as Ably from "ably";
import { createClient } from "@/lib/supabase/server";
import {
  applyBid,
  BID_INCREMENT_OPTIONS,
  getAuctionState,
} from "@/lib/redis/auctions";

export const runtime = "nodejs";

function isActiveAuction(auction) {
  const start = new Date(auction.start_time).getTime();
  const end = new Date(auction.end_time).getTime();
  const now = Date.now();

  return Number.isNaN(start) || Number.isNaN(end) || (now >= start && now <= end);
}

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return Response.json({ error: "You must be signed in to bid." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const increment = Number(body.increment);

    if (!BID_INCREMENT_OPTIONS.includes(increment)) {
      return Response.json({ error: "Choose a valid bid increment." }, { status: 400 });
    }

    const { data: auction, error: auctionError } = await supabase
      .from("Auction")
      .select("*")
      .eq("id", id)
      .single();

    if (auctionError || !auction) {
      return Response.json({ error: "Auction not found." }, { status: 404 });
    }

    if (String(auction.seller_id) === String(authData.user.id)) {
      return Response.json({ error: "Sellers cannot bid on their own auctions." }, { status: 403 });
    }

    if (!isActiveAuction(auction)) {
      return Response.json({ error: "This auction is not currently active." }, { status: 409 });
    }

    const currentState = await getAuctionState(id);
    if (!currentState) {
      return Response.json({ error: "Auction live state is not initialized." }, { status: 503 });
    }

    const result = await applyBid({
      auctionId: id,
      bidderId: authData.user.id,
      increment,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 409 });
    }

    const event = {
      auctionId: id,
      currentPrice: result.state.currentPrice,
      bidderId: authData.user.id,
      updatedAt: result.state.updatedAt,
    };

    if (process.env.ABLY_API_KEY) {
      try {
        const ably = new Ably.Rest(process.env.ABLY_API_KEY);
        await ably.channels.get(`auction:${id}`).publish("bid-accepted", event);
      } catch (publishError) {
        console.error("Unable to publish accepted bid to Ably.", publishError);
      }
    }

    return Response.json({ auction: event });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to place bid." },
      { status: 500 },
    );
  }
}
