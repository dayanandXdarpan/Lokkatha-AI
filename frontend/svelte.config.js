import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$i18n: 'src/lib/i18n',
			$api: 'src/lib/api',
			$db: 'src/lib/db'
		},
		prerender: {
			handleHttpError: ({ status, path, referrer, referenceType }) => {
				// Ignore 404 errors for favicon and icon files during prerender
				if (path.includes('favicon') || path.includes('icon-')) {
					return;
				}
				// Throw for other errors
				throw new Error(`${status} ${path}`);
			}
		}
	}
};

export default config;
