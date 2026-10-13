import { protectedProcedure, publicProcedure, router } from "../index";
import { aiRouter } from "./ai";
import { materialsRouter } from "./materials";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  materials: materialsRouter,
  ai: aiRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
});
export type AppRouter = typeof appRouter;
