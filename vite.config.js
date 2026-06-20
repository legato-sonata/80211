import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isBuild = process.argv.includes('build') || process.argv.includes('preview');

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Only use Cloudflare adapter in build/preview to avoid TCMalloc VSS memory limits from Miniflare/workerd in the dev sandbox
			...(isBuild && { adapter: adapter() })
		})
	]
});
