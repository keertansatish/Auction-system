import { createClient } from "@/lib/supabase/server";
import {
  getAuctionState,
  initializeAuctionState,
} from "@/lib/redis/auctions";
import {
  getAuctionStatus,
  parseAuctionTime,
} from "@/lib/auctions/status";

function withAuctionStatus(auction, viewerId) {
  return {
    ...auction,
    status: getAuctionStatus(auction),
    isSeller: Boolean(viewerId && String(auction.seller_id) === String(viewerId)),
  };
}

/**
 * GET /api/auctions
 *
 * Query params:
 *   - id (optional): return a single auction by its primary key
 *
 * Without `id` → returns all auctions ordered by newest first.
 * With `id`    → returns a single auction object.
 */
export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  try {
    const { data: authData } = await supabase.auth.getUser();
    const viewerId = authData?.user?.id;

    if (id) {
      // Fetch a single auction by ID
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return Response.json(
          { error: error.message },
          { status: 404 }
        );
      }

      const auction = withAuctionStatus(data, viewerId);
      const state = await getAuctionState(data.id);
      return Response.json({
        auction,
        isSeller: auction.isSeller,
        state,
      });
    }

    // Fetch all auctions, newest first
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      auctions: (data ?? []).map((auction) => withAuctionStatus(auction, viewerId)),
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auctions
 *
 * Body (JSON):
 *   - title          (string, required)
 *   - description    (string, required)
 *   - image_url      (string, required)
 *   - starting_price (number, required)
 *   - start_time     (string, required – "HH:MM" format)
 *   - end_time       (string, required – "HH:MM" format)
 *   - seller_id      is taken from the authenticated Supabase user
 *
 * Returns the newly created auction row.
 */
export async function POST(request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return Response.json(
        { error: "You must be signed in to create an auction." },
        { status: 401 }
      );
    }

    // The authenticated Supabase user ID is the seller ID.

    const {
      title,
      description,
      image_url,
      starting_price,
      start_time,
      end_time,
    } = body;

    // Basic validation
    if (!title || !description || !image_url || !starting_price || !start_time || !end_time) {
      return Response.json(
        { error: "All fields are required: title, description, image_url, starting_price, start_time, and end_time." },
        { status: 400 }
      );
    }

    const numericStartingPrice = Number(starting_price);
    const startTimestamp = parseAuctionTime(start_time);
    const endTimestamp = parseAuctionTime(end_time);

    if (!Number.isFinite(numericStartingPrice) || numericStartingPrice < 0) {
      return Response.json(
        { error: "Starting price must be a valid non-negative number." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      return Response.json(
        { error: "Enter valid start and end times." },
        { status: 400 },
      );
    }

    if (startTimestamp <= Date.now()) {
      return Response.json(
        { error: "Start time must be after the current time." },
        { status: 400 },
      );
    }

    if (endTimestamp <= startTimestamp) {
      return Response.json(
        { error: "End time must be after the start time." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("auctions")
      .insert([
        {
          title,
          description,
          image_url,
          starting_price: numericStartingPrice,
          start_time,
          end_time,
          seller_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const auction = withAuctionStatus(data, user.id);
    await initializeAuctionState(auction);

    return Response.json({ auction }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to create auction." },
      { status: 500 }
    );
  }
}
