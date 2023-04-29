import { Item, PrismaClient } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const prisma = new PrismaClient();

export const router = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  sessionItems: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input: { slug } }) => {
      // const items = prisma.session.findMany({
      //   select: {
      //     items: true,
      //   },
      //   where: {
      //     slug,
      //   },
      // });

      // simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      return Promise.resolve([
        {
          name: "Foo",
          id: "foo",
          order: 0,
          list: "QUEUE",
          updatedAt: new Date(),
          createdAt: new Date(),
          sessionSlug: "123",
        },
        {
          name: "Bar",
          id: "bar",
          order: 1,
          list: "QUEUE",
          updatedAt: new Date(),
          createdAt: new Date(),
          sessionSlug: "123",
        },
        {
          name: "Baz",
          id: "baz",
          order: 2,
          list: "QUEUE",
          updatedAt: new Date(),
          createdAt: new Date(),
          sessionSlug: "123",
        },
      ] satisfies Item[] as Item[]);
    }),
});
