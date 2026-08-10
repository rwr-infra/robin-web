import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Load .env file into process.env
function loadEnvFile(envPath = '.env') {
	if (existsSync(envPath)) {
		const content = readFileSync(envPath, 'utf-8');
		for (const line of content.split('\n')) {
			const trimmedLine = line.trim();
			// Skip empty lines and comments
			if (!trimmedLine || trimmedLine.startsWith('#')) {
				continue;
			}
			const equalIndex = trimmedLine.indexOf('=');
			if (equalIndex > 0) {
				const key = trimmedLine.substring(0, equalIndex).trim();
				const value = trimmedLine.substring(equalIndex + 1).trim();
				process.env[key] = value;
			}
		}
		console.log(`📄 Loaded ${envPath}`);
	} else {
		console.log(`⚠️  ${envPath} not found`);
	}
}

// Load .env file at startup
loadEnvFile();

async function buildSvelteKit() {
	console.log('🚀 Starting SvelteKit build process...\n');

	try {
		// Step 0: Pre-process app.html for build-time environment variable replacement
		// For static builds, we need to replace %VITE_*% placeholders directly in app.html
		console.log('📝 Step 0: Pre-processing app.html for environment variables...');
		const appHtmlPath = 'src/app.html';
		// Kept verbatim so the file can be restored byte-for-byte after the build.
		// This used to be `git checkout src/app.html`, which discarded *every*
		// uncommitted change to the file, not just the substitution below.
		const originalAppHtml = readFileSync(appHtmlPath, 'utf-8');
		let appHtmlContent = originalAppHtml;

		// Only replace placeholders if KEEP_PLACEHOLDERS is not set
		// This allows community builds to keep placeholders for runtime replacement
		const keepPlaceholders = process.env.KEEP_PLACEHOLDERS === 'true';
		let modified = false;

		if (!keepPlaceholders) {
			// Replace __VITE_SITE_URL__ and __VITE_CDN_IMAGE_URL__ placeholders
			const siteUrl = process.env.VITE_SITE_URL || 'https://robin.kreedzt.com';
			const cdnImageUrl = process.env.VITE_CDN_IMAGE_URL || siteUrl;

			appHtmlContent = appHtmlContent.replace(/__VITE_SITE_URL__/g, siteUrl);
			appHtmlContent = appHtmlContent.replace(/__VITE_CDN_IMAGE_URL__/g, cdnImageUrl);

			writeFileSync(appHtmlPath, appHtmlContent);
			modified = true;
			console.log(`  ✓ Replaced __VITE_SITE_URL__ with ${siteUrl}`);
			console.log(`  ✓ Replaced __VITE_CDN_IMAGE_URL__ with ${cdnImageUrl}`);
		} else {
			console.log('  ⏭️  Keeping placeholders for runtime replacement');
		}
		console.log('✅ app.html pre-processed\n');

		try {
			// Step 1: Run vite build
			console.log('🏗️  Step 1: Building with Vite...');
			// Ensure VITE_* variables are passed
			const env = { ...process.env };
			execSync('vite build', { stdio: 'inherit', env });
			console.log('✅ Build completed\n');
		} finally {
			// Restore original app.html after build (only if we modified it)
			if (modified) {
				writeFileSync(appHtmlPath, originalAppHtml);
				console.log('✅ Restored original app.html\n');
			}
		}

		console.log('🎉 SvelteKit build completed successfully!');

		// Step 3: Inject environment variables into build output
		console.log('\n🔧 Step 3: Injecting environment variables into build output...');
		const { injectEnv } = await import('./inject-env.ts');
		await injectEnv();
		console.log('✅ Environment variables injected\n');
	} catch (error) {
		console.error('❌ Build failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	buildSvelteKit().catch((error) => {
		console.error('❌ Build failed:', error);
		process.exit(1);
	});
}

export { buildSvelteKit };
