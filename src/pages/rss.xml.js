import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getSite } from '../lib/site';

export async function GET(context) {
  const site = await getSite();
  const posts = (await getCollection('writing', ({ data }) => data.status !== 'draft')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: `${site.name} — Writing`,
    description: site.one_liner || site.motto,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
      categories: post.data.topics,
    })),
  });
}
