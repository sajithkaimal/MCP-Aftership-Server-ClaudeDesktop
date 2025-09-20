// src/utils/aftership-api.ts
import axios from "axios";

const API_BASE_URL = "https://api.aftership.com/v4";
const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY ?? "";

const aftershipApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "aftership-api-key": AFTERSHIP_API_KEY,
    "Content-Type": "application/json",
  },
});

// normalize axios errors so Claude can show a helpful message
function asError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const meta = (err.response?.data as any)?.meta;
    const msg = meta?.message ?? err.message;
    return new Error(`AfterShip ${status}: ${msg}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

export async function listCouriers() {
  try {
    const res = await aftershipApi.get("/couriers");
    return res.data?.data?.couriers ?? [];
  } catch (e) {
    throw asError(e);
  }
}

export async function detectCouriers(trackingNumber: string) {
  try {
    const res = await aftershipApi.post("/couriers/detect", {
      tracking: { tracking_number: trackingNumber },
    });
    return (res.data?.data?.couriers ?? []) as Array<{ slug: string; name: string }>;
  } catch (e) {
    throw asError(e);
  }
}

export async function getTracking(slug: string, trackingNumber: string) {
  try {
    const res = await aftershipApi.get(
      `/trackings/${encodeURIComponent(slug)}/${encodeURIComponent(trackingNumber)}`
    );
    return res.data?.data?.tracking ?? null;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null;
    throw asError(e);
  }
}

export async function createTracking(trackingNumber: string, slug?: string) {
  try {
    const res = await aftershipApi.post("/trackings", {
      tracking: { tracking_number: trackingNumber, ...(slug ? { slug } : {}) },
    });
    return res.data?.data?.tracking ?? null;
  } catch (e) {
    throw asError(e);
  }
}
