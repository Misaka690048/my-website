import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import publication from './data/publication.json';

const posts = defineCollection({
  // Online test releases explicitly include the same samples as local development.
  loader: glob({
    base: "./src",
    pattern: (import.meta.env.DEV || publication.includeTestContent)
      ? ["content/posts/*.md", "preview/content/*.md"]
      : "content/posts/*.md",
    generateId: ({ entry }) => entry.split('/').at(-1)!.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    tags: z.array(z.string().trim().min(1)).default([]).transform(tags => [...new Set(tags)]),
    preview: z.boolean().default(false),
    author: z.string().optional(),
  }),
});

const reviews = defineCollection({
  loader: glob({ base: './src/content/reviews', pattern: '*.md' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    // Leave absent until the author decides the actual publication date.
    pubDate: z.coerce.date().optional(),
    preview: z.boolean().default(false),
  }),
});

const works = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '*.json' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    medium: z.string().min(1),
    cover: image(),
    coverSource: z.string().optional(),
    glowColor: z.string().regex(/^#[\da-fA-F]{6}$/).default('#8d929b'),
    review: reference('reviews').optional(),
    order: z.number().default(0),
    preview: z.boolean().default(false),
  }),
});

export const collections = { posts, reviews, works };
