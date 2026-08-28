export const AUCTION_STATUS = Object.freeze({
  UPCOMING: "upcoming",
  ACTIVE: "active",
  EXPIRED: "expired",
});

export function parseAuctionTime(value, referenceTime = Date.now()) {
  const timestamp = new Date(value).getTime();

  if (Number.isFinite(timestamp)) {
    return timestamp;
  }

  // Support time-only values if older rows use a time column.
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return Number.NaN;
  }

  const date = new Date(referenceTime);
  date.setHours(Number(match[1]), Number(match[2]), Number(match[3] ?? 0), 0);
  return date.getTime();
}

export function getAuctionStatus(auction, now = Date.now()) {
  const start = parseAuctionTime(auction?.start_time, now);
  const end = parseAuctionTime(auction?.end_time, now);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return AUCTION_STATUS.EXPIRED;
  }

  if (now < start) {
    return AUCTION_STATUS.UPCOMING;
  }

  if (now > end) {
    return AUCTION_STATUS.EXPIRED;
  }

  return AUCTION_STATUS.ACTIVE;
}

export function isAuctionActive(auction, now = Date.now()) {
  return getAuctionStatus(auction, now) === AUCTION_STATUS.ACTIVE;
}
