import type { APIRoute } from 'astro';
import { sortedPosts } from '../lib/posts';
import { libraryWorks } from '../lib/works';
export const GET: APIRoute = async () => {
  const posts = await sortedPosts();
  const index = posts.map(post => ({
    title: post.data.title,
    description: post.data.description,
    url: `/posts/${post.id}/`,
    // Results are inserted with textContent, never HTML.
    text: (post.body ?? '').replace(/<[^>]*>/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#*`>~|]/g, '').replace(/\s+/g, ' ').trim(),
  }));
  for (const work of await libraryWorks()) {
    if (!work.review || !work.href) continue;
    index.push({
      title: work.review.data.title,
      description: `${work.data.title} · ${work.review.data.description}`,
      url: work.href,
      text: (work.review.body ?? '').replace(/<[^>]*>/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*`>~|]/g, '').replace(/\s+/g, ' ').trim(),
    });
  }
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
