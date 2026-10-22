import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['feeding', 'sleep', 'care', 'health', 'growth', 'development']),
    order: z.number(),
    updated: z.coerce.date(),
    emoji: z.string().default('📘'),
    /** Short answer shown at the top of the article (good for featured snippets). */
    summary: z.string(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
    related: z.array(z.string()).default([])
  })
});

export const collections = { guides };
