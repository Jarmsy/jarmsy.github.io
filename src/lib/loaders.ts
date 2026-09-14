import { promises as fs } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { glob } from 'astro/loaders';
import { load, YAMLException } from 'js-yaml';

// Astro doesn't export these types publicly; derive them from the built-in glob loader.
type Loader = ReturnType<typeof glob>;
type LoaderContext = Parameters<Loader['load']>[0];

const TIP =
  'Tip: every entry starts with "- " and each field is "name: value" on its own line, indented the same amount. ' +
  'Wrap a value in quotes if it contains a colon.';

async function readYaml(filePath: string, fileName: string): Promise<unknown> {
  const text = await fs.readFile(filePath, 'utf8');
  try {
    return load(text, { filename: fileName });
  } catch (error) {
    if (error instanceof YAMLException) {
      throw new Error(`${fileName} has a YAML mistake.\n\n${error.message}\n\n${TIP}`);
    }
    throw error;
  }
}

function watch(filePath: string, ctx: LoaderContext, sync: () => Promise<void>) {
  ctx.watcher?.add(filePath);
  ctx.watcher?.on('change', async (changed) => {
    if (changed !== filePath) return;
    try {
      await sync();
      ctx.logger.info(`Reloaded ${relative(fileURLToPath(ctx.config.root), filePath)}`);
    } catch (error) {
      ctx.logger.error((error as Error).message);
    }
  });
}

function entryPath(ctx: LoaderContext, filePath: string) {
  return relative(fileURLToPath(ctx.config.root), filePath).replaceAll('\\', '/');
}

// Astro treats a collection with no entries as missing and warns "check your content config".
// Registering it as present-but-empty keeps empty rooms a normal, quiet state.
function markPresent(store: LoaderContext['store']) {
  if (Array.from(store.keys()).length > 0) return;
  store.set({ id: '__empty__', data: {} });
  store.delete('__empty__');
}

/** Wraps any loader so that an empty folder is fine, not a warning. */
export function allowEmpty(loader: Loader): Loader {
  return {
    name: loader.name,
    load: async (ctx) => {
      await loader.load(ctx);
      markPresent(ctx.store);
    },
  };
}

/** A YAML file containing a list. Entries get ids from their position, so nobody has to write them. */
export function yamlList(fileName: string): Loader {
  return {
    name: 'yaml-list',
    load: async (ctx) => {
      const filePath = fileURLToPath(new URL(fileName, ctx.config.root));
      const sync = async () => {
        const data = await readYaml(filePath, fileName);
        const items = data == null ? [] : data;
        if (!Array.isArray(items)) {
          throw new Error(`${fileName} must be a list: each entry starts with "- ". ${TIP}`);
        }
        ctx.store.clear();
        for (const [index, raw] of items.entries()) {
          const id = String(index + 1);
          const parsed = await ctx.parseData({ id, data: raw as Record<string, unknown>, filePath });
          ctx.store.set({ id, data: parsed, filePath: entryPath(ctx, filePath) });
        }
        markPresent(ctx.store);
      };
      await sync();
      watch(filePath, ctx, sync);
    },
  };
}

/** A YAML file containing one object (the site settings), stored as a single entry. */
export function yamlObject(fileName: string, id: string): Loader {
  return {
    name: 'yaml-object',
    load: async (ctx) => {
      const filePath = fileURLToPath(new URL(fileName, ctx.config.root));
      const sync = async () => {
        const data = await readYaml(filePath, fileName);
        if (data == null || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error(`${fileName} must contain settings as "name: value" lines. ${TIP}`);
        }
        ctx.store.clear();
        const parsed = await ctx.parseData({ id, data: data as Record<string, unknown>, filePath });
        ctx.store.set({ id, data: parsed, filePath: entryPath(ctx, filePath) });
      };
      await sync();
      watch(filePath, ctx, sync);
    },
  };
}
