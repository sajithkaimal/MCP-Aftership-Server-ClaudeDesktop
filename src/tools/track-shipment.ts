import { detectCouriers, getTracking, createTracking } from "../utils/aftership-api.ts";

export const trackShipmentTool = {
  name: "track-shipment",
  description: "Tracks a shipment using a tracking number and optional courier slug.",
  input_schema: {
    type: "object",
    properties: {
      trackingNumber: { type: "string", description: "The tracking number." },
      slug: {
        type: "string",
        description: "Courier slug (e.g. 'ups', 'fedex'). Optional.",
        nullable: true,
      },
    },
    required: ["trackingNumber"],
    additionalProperties: false,
  },
  handler: async ({
    trackingNumber,
    slug,
  }: {
    trackingNumber: string;
    slug?: string;
  }) => {
    // Build candidate slug list
    let candidates = slug ? [slug] : [];
    if (!slug) {
      const detected = await detectCouriers(trackingNumber);
      candidates = detected.map((c) => c.slug);
    }
    if (candidates.length === 0) {
      return {
        status: "no_courier_detected",
        message:
          "Could not detect a courier for that tracking number. Try specifying a slug (e.g., 'ups', 'fedex') or run list-couriers.",
      };
    }

    // Try existing tracking first
    for (const s of candidates.slice(0, 3)) {
      const existing = await getTracking(s, trackingNumber);
      if (existing) {
        return { status: "ok", courier: s, tracking: existing };
      }
    }

    // If none existed, create with the top candidate
    const chosen = candidates[0];
    try {
      const created = await createTracking(trackingNumber, chosen);
      if (created) return { status: "created", courier: chosen, tracking: created };
      return {
        status: "created_but_empty",
        courier: chosen,
        message:
          "Tracking was created, but no checkpoints yet. It can take a little while to populate after creation.",
      };
    } catch (e: any) {
      // Bubble AfterShip message up to Claude
      return { status: "error", courier: chosen, error: String(e?.message ?? e) };
    }
  },
};
