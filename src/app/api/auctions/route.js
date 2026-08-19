import { createClient } from "@/lib/supabase/server";
import {
  getAuctionState,
  initializeAuctionState,
} from "@/lib/redis/auctions";

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
    if (id) {
      // Fetch a single auction by ID
      const { data, error } = await supabase
        .from("Auction")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return Response.json(
          { error: error.message },
          { status: 404 }
        );
      }

      const state = await getAuctionState(data.id);
      return Response.json({ auction: data, state });
    }

    // Fetch all auctions, newest first
    const { data, error } = await supabase
      .from("Auction")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ auctions: data });
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
 *   - seller_id      (number, required)
 *
 * Returns the newly created auction row.
 */
export async function POST(request) {
  const supabase = await createClient();

  try {
    const body = await request.json();

    const {
      title,
      description,
      image_url,
      starting_price,
      start_time,
      end_time,
      seller_id,
    } = body;

    // Basic validation
    if (!title || !description || !image_url || !starting_price || !start_time || !end_time || !seller_id) {
      return Response.json(
        { error: "All fields are required: title, description, image_url, starting_price, start_time, end_time, seller_id." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("Auction")
      .insert([
        {
          title,
          description,
          image_url,
          starting_price: Number(starting_price),
          start_time,
          end_time,
          seller_id: Number(seller_id),
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

    await initializeAuctionState(data);

    return Response.json({ auction: data }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to create auction." },
      { status: 500 }
    );
  }
}
