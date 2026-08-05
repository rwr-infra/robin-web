#!/usr/bin/env node
/**
 * Build-time environment variable injection script
 * Similar to docker-entrypoint.sh but runs at build time for Cloudflare Workers
 *
 * Usage: node scripts/inject-env.ts
 *
 * This script:
 * 1. Reads environment variables from process.env (CI/CD injected)
 * 2. Replaces placeholders in build/index.html with actual values
 * 3. Outputs the modified HTML for deployment
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Configuration - match docker-entrypoint.sh behavior
const PLACEHOLDERS: Record<string, string> = {
	__VITE_SITE_URL__: 'VITE_SITE_URL',
	__VITE_CDN_IMAGE_URL__: 'VITE_CDN_IMAGE_URL',
	__VITE_ANALYTICS_ID__: 'VITE_ANALYTICS_ID'
};

const DEFAULTS: Record<string, string> = {
	VITE_SITE_URL: 'https://robin.kreedzt.com',
	VITE_CDN_IMAGE_URL: '',
	VITE_ANALYTICS_ID: ''
};

function injectEnv(): void {
	console.log('🔧 Build-time environment variable injection\n');

	const buildDir = resolve('build');
	const htmlPath = resolve(buildDir, 'index.html');

	// Check if build/index.html exists
	try {
		let html = readFileSync(htmlPath, 'utf-8');
		let modified = false;

		console.log('Processing placeholders:\n');

		// Replace each placeholder
		for (const [placeholder, envKey] of Object.entries(PLACEHOLDERS)) {
			const value = process.env[envKey] || DEFAULTS[envKey] || '';

			if (html.includes(placeholder)) {
				html = html.replace(
					new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
					value
				);
				modified = true;
				console.log(`  ✓ ${placeholder} → ${value || '(empty)'}`);
			} else {
				console.log(`  - ${placeholder} (not found)`);
			}
		}

		// Handle HEADER_SCRIPTS injection (similar to docker-entrypoint.sh)
		const headerScripts = process.env.HEADER_SCRIPTS;
		if (headerScripts && html.includes('</head>')) {
			console.log('\n  ✓ Injecting HEADER_SCRIPTS');
			html = html.replace('</head>', `${headerScripts}\n</head>`);
			modified = true;
		}

		// Write back if modified
		if (modified) {
			writeFileSync(htmlPath, html);
			console.log('\n✅ Environment variables injected successfully\n');
		} else {
			console.log('\nℹ️ No changes needed\n');
		}

		// Also process manifest.webmanifest if it exists
		const manifestPath = resolve(buildDir, 'manifest.webmanifest');
		try {
			let manifest = readFileSync(manifestPath, 'utf-8');
			let manifestModified = false;

			const siteUrl = process.env.VITE_SITE_URL || DEFAULTS.VITE_SITE_URL;

			if (manifest.includes('__VITE_SITE_URL__')) {
				manifest = manifest.replace(/__VITE_SITE_URL__/g, siteUrl);
				manifestModified = true;
			}

			if (manifestModified) {
				writeFileSync(manifestPath, manifest);
				console.log('✅ manifest.webmanifest updated\n');
			}
		} catch {
			// manifest.webmanifest may not exist, ignore
		}
	} catch (error) {
		console.error('❌ Error injecting environment variables:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	injectEnv();
}

export { injectEnv };
