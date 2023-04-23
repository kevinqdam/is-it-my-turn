import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

type List = "QUEUE" | "NEXT" | "WENT";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  sessionUsers: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      // TODO: use Prisma client to fetch users for the session by slug

      // simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const users = [
        { name: "Foo", list: "QUEUE" },
        { name: "Bar", list: "QUEUE" },
        { name: "Baz", list: "QUEUE" },
        { name: "Qux", list: "QUEUE" },
      ];

      return Promise.resolve(users);
    }),
});
