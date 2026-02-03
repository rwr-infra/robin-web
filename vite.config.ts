import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

const isCdnBuild = process.env.CDN_BUILD === 'true';
const cdnImageUrl = process.env.CDN_IMAGE_URL;
const cdnUrl = process.env.CDN_URL;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'globalVariable', 'baseLocale']
		})
	],
	experimental: {
		renderBuiltUrl(filename) {
			if (isCdnBuild) {
				const ext = path.extname(filename).toLowerCase();

				// 图片资源处理
				if (cdnImageUrl && /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(ext)) {
					// 确保 URL 正确拼接，避免 double 斜杠
					const baseUrl = cdnImageUrl.endsWith('/') ? cdnImageUrl.slice(0, -1) : cdnImageUrl;
					const path = filename.startsWith('/') ? filename.slice(1) : filename;
					return { runtime: JSON.stringify(`${baseUrl}/${path}`) };
				}

				// 其他资源处理 (JS/CSS)
				if (cdnUrl) {
					const baseUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
					const path = filename.startsWith('/') ? filename.slice(1) : filename;
					return { runtime: JSON.stringify(`${baseUrl}/${path}`) };
				}
			}
			// Return undefined to let SvelteKit/Vite handle standard assets based on 'base' config
			return;
		}
	},
	build: {
		// Use default inline limit (4kb) to avoid bloating JS files
		// assetsInlineLimit: 4096,
		rollupOptions: {
			output: {
				// Separate images into their own directory with hash-only filenames for CDN builds
				assetFileNames: (assetInfo) => {
					if (!isCdnBuild) return 'assets/[name]-[hash][extname]';

					if (assetInfo.name) {
						const info = assetInfo.name.split('.');
						const ext = info[info.length - 1].toLowerCase();
						if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
							return 'images/[hash][extname]';
						}
					}
					return 'assets/[name]-[hash][extname]';
				},
				// Vendor splitting
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				}
			}
		}
	},
	resolve: {
		alias: { '@': path.resolve(__dirname, './src') }
	},
	server: {
		proxy: {
			'/api': {
				// Use mock server for E2E tests, production API for dev
				target: process.env.E2E_TEST ? 'http://localhost:5800' : 'https://robin-test.kreedzt.com',
				changeOrigin: true
			}
		}
	},
	test: {
		watch: false,
		projects: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'tests/unit/**/*.svelte.{test,spec}.{js,ts}'
					],
					exclude: ['src/lib/server/**', 'src/lib/paraglide/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}'],
					exclude: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'tests/unit/**/*.svelte.{test,spec}.{js,ts}'
					]
				}
			}
		],
		coverage: {
			include: ['src/'],
			exclude: ['src/lib/paraglide/**'],
			provider: 'v8',
			reporter: ['text', 'json', 'cobertura', 'html', 'lcov']
		},
		reporters: ['default', ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }]]
	}
});
