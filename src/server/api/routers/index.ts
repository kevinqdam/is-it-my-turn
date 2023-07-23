import { List, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MAX_SESSION_NAME_INPUT_LENGTH } from "~/pages";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { MAX_ITEM_NAME_LENGTH } from "~/utils/session-name";

const prisma = new PrismaClient();

/**
 * A regular expression matching snake-case strings with numbers. Specifically,
 * it matches any string that contains only these types of characters:
 * - English alphabet characters (lower case only)
 * - Numeric characters
 * - Hyphens (`-`)
 */
const SLUG_PATTERN = new RegExp("^[a-z0-9-]+$");

const queryAllSessionItems = async ({
  input: { sessionSlug },
}: {
  input: { sessionSlug: string };
}) => {
  const items = await prisma.item.findMany({
    select: {
      id: true,
      name: true,
      session: true,
      sessionSlug: true,
      order: true,
      list: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      sessionSlug,
    },
  });
  return items;
};

const updateSessionItem = ({
  itemIdToUpdate,
  newOrder,
  newName,
  newList,
}: {
  itemIdToUpdate: string;
  newOrder: number;
  newName: string;
  newList: List;
}) => {
  return prisma.item.update({
    where: {
      id: itemIdToUpdate,
    },
    data: {
      order: newOrder,
      name: newName,
      list: newList,
    },
  });
};

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
        return { exists: false, name: "" };
      }
      return { exists: true, name: maybeSession.name };
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
  getAllSessionItems: publicProcedure
    .input(z.object({ sessionSlug: z.string() }))
    .query(queryAllSessionItems),
  createSessionItem: publicProcedure
    .input(
      z.object({
        name: z.string().max(MAX_ITEM_NAME_LENGTH),
        sessionSlug: z.string().regex(SLUG_PATTERN),
        order: z.number(),
        list: z.enum([List.QUEUE, List.NEXT, List.WENT]),
      })
    )
    .mutation(async ({ input: { name, sessionSlug, order, list } }) => {
      if (name.length > MAX_SESSION_NAME_INPUT_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The session name is too long.",
        });
      }
      if (!SLUG_PATTERN.test(sessionSlug)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The slug is invalid",
        });
      }
      await prisma.item.create({
        data: {
          name,
          sessionSlug,
          order,
          list,
        },
      });
    }),
  updateSessionItem: publicProcedure
    .input(
      z.object({
        itemIdToUpdate: z.string(),
        newOrder: z.number().int(),
        newName: z.string(),
        newList: z.enum([List.QUEUE, List.NEXT, List.WENT]),
        sessionSlug: z.string().regex(SLUG_PATTERN),
      })
    )
    .mutation(async ({ input: item }) => await updateSessionItem(item)),
  updateWhosNext: publicProcedure
    .input(
      z.object({
        currentNextItem: z
          .object({
            itemIdToUpdate: z.string(),
            newOrder: z.number().int(),
            newName: z.string(),
            newList: z.enum([List.QUEUE, List.NEXT, List.WENT]),
            sessionSlug: z.string().regex(SLUG_PATTERN),
          })
          .optional(),
        newNextItem: z.object({
          itemIdToUpdate: z.string(),
          newOrder: z.number().int(),
          newName: z.string(),
          newList: z.enum([List.QUEUE, List.NEXT, List.WENT]),
          sessionSlug: z.string().regex(SLUG_PATTERN),
        }),
      })
    )
    .mutation(async ({ input: { currentNextItem, newNextItem } }) => {
      await prisma.$transaction([
        ...(currentNextItem ? [updateSessionItem(currentNextItem)] : []),
        updateSessionItem(newNextItem),
      ]);
    }),
  updateSessionItemBatch: publicProcedure
    .input(
      z.array(
        z.object({
          sessionSlug: z.string().regex(SLUG_PATTERN),
          itemIdToUpdate: z.string(),
          newName: z.string(),
          newList: z.enum([List.QUEUE, List.NEXT, List.WENT]),
          newOrder: z.number().int(),
        })
      )
    )
    .mutation(async ({ input: items }) => {
      const updatePromises = items.map(updateSessionItem);
      await prisma.$transaction(updatePromises);
    }),
  deleteSessionItem: publicProcedure
    .input(
      z.object({
        itemIdToDelete: z.string(),
        sessionSlug: z.string().regex(SLUG_PATTERN),
      })
    )
    .mutation(async ({ input: { itemIdToDelete, sessionSlug } }) => {
      const allSessionItems = await queryAllSessionItems({
        input: { sessionSlug },
      });
      const itemToDelete = allSessionItems.find(
        (item) => item.id === itemIdToDelete
      );
      if (!itemToDelete) {
        return;
      }
      // update items with new order
      for (const sessionItem of allSessionItems) {
        if (sessionItem.order > itemToDelete.order) {
          sessionItem.order -= 1;
        }
      }
      // update the order of the items in the database
      const updatePromises = allSessionItems.map((item) =>
        updateSessionItem({
          itemIdToUpdate: item.id,
          newOrder: item.order,
          newName: item.name,
          newList: item.list,
        })
      );

      // delete the item
      const deletePromise = prisma.item.delete({
        where: {
          id: itemToDelete.id,
        },
      });

      await prisma.$transaction([...updatePromises, deletePromise]);
    }),
});
