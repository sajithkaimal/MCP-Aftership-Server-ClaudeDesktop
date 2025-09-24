import { listCouriers } from "../utils/aftership-api.ts";

export const listCouriersTool = {
  name: "list-couriers",
  description: "Lists all available couriers.",
  input_schema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  handler: async () => {
    const rows = await listCouriers();
    // Optional: return a compact list for nicer rendering
    return rows?.map((c: any) => ({ slug: c.slug, name: c.name })) ?? [];
  },
};