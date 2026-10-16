import { protectedProcedure, publicProcedure, router } from "../index";
import { aiRouter } from "./ai";
import { backupRouter } from "./backup";
import { dataRouter } from "./data";
import { materialsRouter } from "./materials";
import { progressRouter } from "./progress";
import { speechRouter } from "./speech";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  materials: materialsRouter,
  ai: aiRouter,
  speech: speechRouter,
  progress: progressRouter,
  backup: backupRouter,
  data: dataRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
});
export type AppRouter = typeof appRouter;
