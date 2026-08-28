import { getRedis } from "./client";
import { getAuctionStatus } from "@/lib/auctions/status";

export const BID_INCREMENT_OPTIONS = [5, 10, 15];

function auctionKey(auctionId) {
  return `auction:${auctionId}`;
}

export async function initializeAuctionState(auction) {
  const redis = getRedis();
  const now = new Date().toISOString();

  await redis.hset(auctionKey(auction.id), {
    currentPrice: Number(auction.starting_price),
    startingPrice: Number(auction.starting_price),
    sellerId: String(auction.seller_id),
    startTime: auction.start_time,
    endTime: auction.end_time,
    status: getAuctionStatus(auction),
    lastBidderId: "",
    updatedAt: now,
  });

  return getAuctionState(auction.id);
}

export async function getAuctionState(auctionId) {
  const redis = getRedis();
  const state = await redis.hgetall(auctionKey(auctionId));

  if (!state || state.currentPrice === undefined) {
    return null;
  }

  const status = getAuctionStatus({
    start_time: state.startTime,
    end_time: state.endTime,
  });

  if (status !== state.status) {
    await redis.hset(auctionKey(auctionId), { status });
  }

  return {
    currentPrice: Number(state.currentPrice),
    startingPrice: Number(state.startingPrice),
    sellerId: String(state.sellerId),
    startTime: state.startTime,
    endTime: state.endTime,
    status,
    lastBidderId: state.lastBidderId || null,
    updatedAt: state.updatedAt,
  };
}

const bidScript = `
local current = tonumber(redis.call('HGET', KEYS[1], 'currentPrice'))
local increment = tonumber(ARGV[1])
local bidderId = ARGV[2]
local updatedAt = ARGV[3]

if not current then
  return {0, 'Auction state is not initialized.'}
end

if increment ~= 5 and increment ~= 10 and increment ~= 15 then
  return {0, 'Invalid bid increment.'}
end

local nextPrice = current + increment
redis.call('HSET', KEYS[1], 'currentPrice', nextPrice, 'lastBidderId', bidderId, 'updatedAt', updatedAt)
return {1, tostring(nextPrice)}
`;

export async function applyBid({ auctionId, bidderId, increment }) {
  const redis = getRedis();
  const result = await redis.eval(bidScript, [auctionKey(auctionId)], [increment, bidderId, new Date().toISOString()]);

  if (!result || Number(result[0]) !== 1) {
    return { ok: false, error: result?.[1] || "Unable to place bid." };
  }

  return { ok: true, state: await getAuctionState(auctionId) };
}
