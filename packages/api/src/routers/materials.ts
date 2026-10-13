import { z } from "zod";

import { publicProcedure, router } from "../index";
import { getSeedMaterialById, SEED_MATERIALS } from "../materials";

/** Prosedur materi: daftar pustaka & detail satu materi (FR-PRF-04). */
export const materialsRouter = router({
  list: publicProcedure.query(() => SEED_MATERIALS),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getSeedMaterialById(input.id) ?? null),
});
