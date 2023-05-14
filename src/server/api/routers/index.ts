import { Item, PrismaClient } from "@prisma/client";
import { TRPCError, procedureTypes } from "@trpc/server";
import { z } from "zod";
import { MAX_SESSION_NAME_INPUT_LENGTH } from "~/pages";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { SLUG_PATTERN } from "~/utils/session-name";

const prisma = new PrismaClient();

export const router = createTRPCRouter({
  sessionSlugExists: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input: { slug } }) => {
      const maybeSession = await prisma.session.findUnique({
        where: {
          slug,
        },
      });
      if (!maybeSession) {
        return { exists: false };
      }
      return { exists: true };
    }),
  createSession: publicProcedure
    .input(
      z.object({
        name: z.string().max(MAX_SESSION_NAME_INPUT_LENGTH),
        slug: z.string().regex(SLUG_PATTERN),
      })
    )
    .mutation(async ({ input: { name, slug } }) => {
      if (name.length > MAX_SESSION_NAME_INPUT_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The session name is too long."
        })
      }
      if (!SLUG_PATTERN.test(slug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The slug is invalid",
        })
      }
      await prisma.session.create({
        data: {
          slug,
          name,
        }
      });
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
