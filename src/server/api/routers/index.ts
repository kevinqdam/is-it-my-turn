import { Item, PrismaClient } from "@prisma/client";
import { TRPCError, procedureTypes } from "@trpc/server";
import { z } from "zod";
import { MAX_SESSION_NAME_INPUT_LENGTH } from "~/pages";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const prisma = new PrismaClient();

/**
 * A regular expression matching snake-case strings with numbers. Specifically,
 * it matches any string that contains only these types of characters:
 * - English alphabet characters (lower case only)
 * - Numeric characters
 * - Hyphens (`-`)
 */
const SLUG_PATTERN = new RegExp("^[a-z0-9-]+$");

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
          message: "The session name is too long.",
        });
      }
      if (!SLUG_PATTERN.test(slug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The slug is invalid",
        });
      }
      await prisma.session.create({
        data: {
          slug,
          name,
        },
      });
    }),
  sessionItems: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input: { slug } }) => {
      const items = prisma.session.findMany({
        select: {
          items: true,
        },
        where: {
          slug,
        },
      });
      return await items;
    }),
});
