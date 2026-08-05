import { execSync } from 'child_process';
import {
	readFileSync,
	writeFileSync,
	readdirSync,
	statSync,
	unlinkSync,
	existsSync,
	mkdirSync
} from 'fs';
import { join, basename, extname } from 'path';
import { createHash } from 'crypto';

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

interface AssetInfo {
	originalPath: string;
	originalName: string;
	cdnUrl: string;
	md5Hash: string;
	cdnFileName: string;
	size: number;
}

interface CDNManifest {
	assets: Record<string, AssetInfo>;
	buildTime: string;
	version: string;
	cdnBaseUrl: string;
	htmlFile: string;
}

function buildCDNForSvelteKit() {
	console.log('🚀 Starting SvelteKit CDN build process...\n');

	const cdnBaseUrl = process.env.CDN_URL || 'https://assets.kreedzt.cn/rwrs-v2-web-assets';
	const buildDir = 'build';

	try {
		// Step 0: Pre-process app.html for build-time environment variable replacement
		// For static builds, we need to replace %VITE_*% placeholders directly in app.html
		console.log('📝 Step 0: Pre-processing app.html for environment variables...');
		const appHtmlPath = 'src/app.html';
		let appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

		// Replace __VITE_SITE_URL__ and __VITE_CDN_IMAGE_URL__ placeholders
		const siteUrl = process.env.VITE_SITE_URL || 'https://robin.kreedzt.com';
		const cdnImageUrl = process.env.VITE_CDN_IMAGE_URL || siteUrl;
		const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
		const canonicalUrl = `${normalizedSiteUrl}/`;

		appHtmlContent = appHtmlContent.replace(/__VITE_SITE_URL__/g, siteUrl);
		appHtmlContent = appHtmlContent.replace(/__VITE_CDN_IMAGE_URL__/g, cdnImageUrl);

		// Update canonical/alternate/OG/Twitter/JSON-LD URLs to absolute site domain for CDN build
		const replaceLink = (rel: string, hreflang?: string) => {
			const langAttr = hreflang ? `\\s+hreflang="${hreflang}"` : '';
			const pattern = new RegExp(`<link\\s+rel="${rel}"${langAttr}\\s+href="[^"]*"\\s*\\/?>`, 'i');
			const replacement = `<link rel="${rel}"${hreflang ? ` hreflang="${hreflang}"` : ''} href="${canonicalUrl}" />`;
			appHtmlContent = appHtmlContent.replace(pattern, replacement);
		};

		replaceLink('canonical');
		replaceLink('alternate', 'en');
		replaceLink('alternate', 'zh');
		replaceLink('alternate', 'x-default');

		appHtmlContent = appHtmlContent.replace(
			/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
			`<meta property="og:url" content="${canonicalUrl}" />`
		);
		appHtmlContent = appHtmlContent.replace(
			/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
			`<meta name="twitter:url" content="${canonicalUrl}" />`
		);
		appHtmlContent = appHtmlContent.replace(/"url":\s*"[^"]*"/, `"url": "${canonicalUrl}"`);

		writeFileSync(appHtmlPath, appHtmlContent);
		console.log(`  ✓ Replaced __VITE_SITE_URL__ with ${siteUrl}`);
		console.log(`  ✓ Replaced __VITE_CDN_IMAGE_URL__ with ${cdnImageUrl}`);
		console.log('✅ app.html pre-processed\n');

		// Backup original app.html content
		const appHtmlBackup = readFileSync(appHtmlPath, 'utf-8');

		try {
			// Step 1: 标准构建
			console.log('🏗️  Step 1: Building with standard SvelteKit process...');
			// 传递 CDN_BUILD 环境变量
			const env: Record<string, string> = { ...process.env, CDN_BUILD: 'true' };
			if (process.env.CDN_URL) {
				env.CDN_URL = process.env.CDN_URL;
			}
			// Ensure VITE_* variables are passed for $env/static/public
			for (const key in process.env) {
				if (key.startsWith('VITE_')) {
					env[key] = process.env[key] as string;
				}
			}

			execSync('vite build', { stdio: 'inherit', env });
			console.log('✅ Standard build completed\n');
		} finally {
			// Restore original app.html after build (without git dependency)
			writeFileSync(appHtmlPath, appHtmlBackup);
			console.log('✅ Restored original app.html\n');
		}

		// Step 2: 处理资源文件
		console.log('📦 Step 2: Processing assets for CDN...');
		const manifest = processAssetsForCDN(buildDir, cdnBaseUrl, cdnImageUrl);
		console.log('✅ Asset processing completed\n');

		// Step 3: 处理HTML文件
		console.log('📄 Step 3: Processing HTML files for CDN references...');
		const htmlFiles = processHTMLFiles(buildDir, manifest);
		console.log('✅ HTML processing completed\n');

		// Step 3.5: 处理 manifest.webmanifest
		console.log('📱 Step 3.5: Processing PWA manifest for CDN references...');
		processManifestFile(buildDir, manifest);
		console.log('✅ Manifest processing completed\n');

		// Step 4: 创建CDN部署结构
		// console.log('📁 Step 4: Creating CDN deployment structure...');
		// createCDNDeploymentStructure(buildDir);
		// console.log('✅ CDN structure created\n');

		// Step 5: 生成部署指南
		// console.log('📋 Step 5: Generating deployment guide...');
		// const deploymentGuide = generateSvelteKitDeploymentGuide(buildDir, manifest, htmlFiles);
		// const guidePath = join(buildDir, 'CDN-DEPLOYMENT.md');
		// writeFileSync(guidePath, deploymentGuide);
		// console.log(`📋 Deployment guide: ${guidePath}\n`);

		// 清理临时文件
		console.log('🧹 Cleaning up temporary files...');
		const manifestPath = join(buildDir, 'cdn-manifest.json');
		if (existsSync(manifestPath)) {
			unlinkSync(manifestPath);
		}
		console.log('✅ Cleanup completed\n');

		// 生成摘要
		const totalAssets = Object.keys(manifest.assets).length;
		const totalSize = Object.values(manifest.assets).reduce((sum, asset) => sum + asset.size, 0);
		const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);

		console.log('🎉 SvelteKit CDN build completed successfully!');
		console.log('\n📊 Build Summary:');
		console.log(`   - CDN assets: ${totalAssets} files`);
		console.log(`   - Total size: ${sizeInMB} MB`);
		console.log(`   - CDN base URL: ${cdnBaseUrl}`);
		console.log(`   - HTML files: ${htmlFiles.length}`);
		console.log(`   - Build directory: ${buildDir}/`);

		console.log('\n🚀 Next Steps:');
		console.log('   1. Upload all files from build/ directory to your OSS');
		console.log('   2. Update your web server to serve the HTML files');
		console.log('   3. Configure CDN domain to point to your OSS bucket');
	} catch (error) {
		console.error('❌ CDN build failed:', error);
		process.exit(1);
	}
}

function processAssetsForCDN(
	buildDir: string,
	cdnBaseUrl: string,
	cdnImageUrl: string
): CDNManifest {
	const manifest: CDNManifest = {
		assets: {},
		buildTime: new Date().toISOString(),
		version: process.env.npm_package_version || '1.0.0',
		cdnBaseUrl,
		htmlFile: ''
	};

	const assetExtensions = [
		'.js',
		'.css',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.svg',
		'.webp',
		'.ico',
		'.woff',
		'.woff2',
		'.ttf',
		'.eot'
	];
	const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

	// SEO-critical assets that should remain on same domain
	function shouldExcludeFromCDN(relativePath: string, filename: string): boolean {
		const excludePatterns = [
			/^favicon\./i, // favicon.png, favicon.ico
			/^apple-touch-icon/, // apple-touch-icon*.png
			/^apple-splash/, // apple-splash*.jpg
			/^apple-touch-startup-image/ // apple-touch-startup-image*.jpg
		];
		return excludePatterns.some((pattern) => pattern.test(filename));
	}

	function processDirectory(dir: string, relativePath: string = '') {
		const items = readdirSync(dir);

		for (const item of items) {
			const fullPath = join(dir, item);
			const itemRelativePath = relativePath ? join(relativePath, item) : item;
			const stat = statSync(fullPath);

			if (stat.isDirectory() && item !== '.git' && item !== 'node_modules') {
				// 跳过 SvelteKit 生成的 _app 目录，因为它们已经包含了哈希并且由 SvelteKit 管理引用
				// 但如果 _app 内部有 images 目录 (由 vite.config.ts 生成)，我们也不需要处理它，因为它是 Vite 管理的
				if (item === '_app' || item === 'images') {
					console.log(`  ⏭️  Skipping managed directory: ${itemRelativePath}`);
					continue;
				}
				processDirectory(fullPath, itemRelativePath);
			} else if (stat.isFile()) {
				const ext = extname(item).toLowerCase();

				// 跳过 HTML 文件和系统文件
				if (
					ext === '.html' ||
					ext === '.json' ||
					ext === '.map' ||
					item.startsWith('.') ||
					item.includes('.DS_Store')
				) {
					continue;
				}

				// 处理资源文件
				if (assetExtensions.includes(ext)) {
					// Skip SEO-critical assets (favicon, apple icons, splash screens)
					if (shouldExcludeFromCDN(itemRelativePath, item)) {
						console.log(`  🔒 SEO asset (local): ${itemRelativePath}`);
						continue;
					}
					try {
						const content = readFileSync(fullPath);
						const md5Hash = createHash('md5').update(content).digest('hex');

						const isImage = imageExtensions.includes(ext);

						let cdnFileName: string;
						let cdnUrl: string;
						let targetPath: string;

						if (isImage) {
							// 图片移动到 images 目录
							const imagesDir = join(buildDir, 'images');
							if (!existsSync(imagesDir)) {
								mkdirSync(imagesDir, { recursive: true });
							}

							cdnFileName = `${md5Hash}${ext}`; // 使用完整 MD5 哈希文件名
							targetPath = join(imagesDir, cdnFileName);
							cdnUrl = `${cdnImageUrl}/images/${cdnFileName}`;
						} else {
							// 其他文件（如果在 static 下）原地重命名
							const shortHash = md5Hash.substring(0, 8); // 其他文件保持短哈希以保留可读性
							const nameWithoutExt = basename(item, ext);
							cdnFileName = `${nameWithoutExt}-${shortHash}${ext}`;
							targetPath = join(dir, cdnFileName);
							// 注意：这里假设非图片资源仍然在原目录结构中
							cdnUrl = `${cdnBaseUrl}/${itemRelativePath.replace(item, cdnFileName)}`;
						}

						// 写入新文件
						writeFileSync(targetPath, content);

						// 更新清单
						manifest.assets[itemRelativePath] = {
							originalPath: itemRelativePath,
							originalName: item,
							cdnUrl,
							md5Hash,
							cdnFileName,
							size: content.length
						};

						// 删除原文件 (如果目标路径不同，或者文件名不同)
						if (fullPath !== targetPath) {
							unlinkSync(fullPath);
						}

						console.log(`  📦 ${itemRelativePath} -> ${cdnUrl}`);
					} catch (error) {
						console.error(`❌ Error processing ${itemRelativePath}:`, error);
					}
				}
			}
		}
	}

	processDirectory(buildDir);

	// 保存清单
	const manifestPath = join(buildDir, 'cdn-manifest.json');
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

	console.log(`✅ Processed ${Object.keys(manifest.assets).length} assets for CDN`);
	return manifest;
}

function processHTMLFiles(buildDir: string, manifest: CDNManifest): string[] {
	const htmlFiles: string[] = [];

	function findAndProcessHTMLFiles(dir: string, relativePath: string = '') {
		const items = readdirSync(dir);

		for (const item of items) {
			const fullPath = join(dir, item);
			const itemRelativePath = relativePath ? join(relativePath, item) : item;
			const stat = statSync(fullPath);

			if (stat.isDirectory() && item !== '.git' && item !== 'node_modules') {
				findAndProcessHTMLFiles(fullPath, itemRelativePath);
			} else if (stat.isFile() && item.endsWith('.html')) {
				const processedContent = processHTMLContent(fullPath, manifest);
				// 直接覆盖原 HTML，确保最终产物使用 CDN 引用
				writeFileSync(fullPath, processedContent);

				htmlFiles.push(fullPath);
				console.log(`  📄 ${itemRelativePath} -> ${basename(fullPath)}`);
			}
		}
	}

	findAndProcessHTMLFiles(buildDir);
	return htmlFiles;
}

function processManifestFile(buildDir: string, manifest: CDNManifest): void {
	const manifestPath = join(buildDir, 'manifest.webmanifest');

	if (!existsSync(manifestPath)) {
		console.log('  ⚠️  manifest.webmanifest not found, skipping...');
		return;
	}

	try {
		const content = readFileSync(manifestPath, 'utf-8');
		const manifestJson = JSON.parse(content);

		const imageCdnUrl = process.env.CDN_IMAGE_URL || manifest.cdnBaseUrl;

		// Helper function to update icon URLs
		const updateIcon = (icon: { src: string }, label: string) => {
			const originalSrc = icon.src;
			// Skip if already a full URL
			if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
				return;
			}

			// Find matching asset in manifest
			const assetInfo = Object.values(manifest.assets).find(
				(asset) =>
					asset.originalPath === originalSrc.replace(/^\//, '') ||
					asset.originalName === basename(originalSrc)
			);

			if (assetInfo) {
				icon.src = assetInfo.cdnUrl;
				console.log(`  📦 ${label}: ${originalSrc} -> ${assetInfo.cdnUrl}`);
			} else {
				// If not found in assets, construct CDN URL directly for images
				const filename = basename(originalSrc);
				console.log(`  ⚠️  ${label}: ${originalSrc} not in assets, using direct CDN URL`);
				icon.src = `${imageCdnUrl}/images/${filename}`;
			}
		};

		// Update top-level icons
		if (manifestJson.icons && Array.isArray(manifestJson.icons)) {
			for (const icon of manifestJson.icons) {
				updateIcon(icon, 'icon');
			}
		}

		// Update shortcuts icons
		if (manifestJson.shortcuts && Array.isArray(manifestJson.shortcuts)) {
			for (const shortcut of manifestJson.shortcuts) {
				if (shortcut.icons && Array.isArray(shortcut.icons)) {
					for (const icon of shortcut.icons) {
						updateIcon(icon, `shortcut.${shortcut.name}.icon`);
					}
				}
			}
		}

		// Update screenshots
		if (manifestJson.screenshots && Array.isArray(manifestJson.screenshots)) {
			for (const screenshot of manifestJson.screenshots) {
				updateIcon(screenshot, 'screenshot');
			}
		}

		// Add scope to fix cross-origin warnings
		if (!manifestJson.scope) {
			manifestJson.scope = '/';
			console.log(`  📦 Added scope: /`);
		}

		// Write updated manifest
		writeFileSync(manifestPath, JSON.stringify(manifestJson, null, '\t'));
		console.log('  ✅ manifest.webmanifest updated with CDN URLs');
	} catch (error) {
		console.error('  ❌ Error processing manifest.webmanifest:', error);
	}
}

function processHTMLContent(htmlPath: string, manifest: CDNManifest): string {
	let content = readFileSync(htmlPath, 'utf-8');

	// Replace all asset references with CDN URLs
	for (const [, assetInfo] of Object.entries(manifest.assets)) {
		const filename = assetInfo.originalName;
		const cdnUrl = assetInfo.cdnUrl;

		// Match href="./filename" or href="/filename" or href="filename"
		const hrefPattern = new RegExp(`href=["']([./]*${filename})["']`, 'g');
		content = content.replace(hrefPattern, `href="${cdnUrl}"`);

		// Match src="./filename" or src="/filename" or src="filename"
		const srcPattern = new RegExp(`src=["']([./]*${filename})["']`, 'g');
		content = content.replace(srcPattern, `src="${cdnUrl}"`);

		// Match content="./filename" (for meta tags)
		const contentPattern = new RegExp(`content=["']([./]*${filename})["']`, 'g');
		content = content.replace(contentPattern, `content="${cdnUrl}"`);
	}

	// Replace SvelteKit _app references with CDN URLs
	const baseUrl = manifest.cdnBaseUrl.endsWith('/')
		? manifest.cdnBaseUrl.slice(0, -1)
		: manifest.cdnBaseUrl;

	// Ensure SvelteKit runtime knows the CDN assets root (fixes dynamic chunk loading)
	content = content.replace(
		/(__sveltekit_[\w$]+\s*=\s*{\s*base:[^}]*)(};)/,
		(match, prefix: string, suffix: string) =>
			prefix.includes('assets:') ? match : `${prefix}, assets: "${baseUrl}" ${suffix}`
	);

	// Replace import("./_app/...") or import("/_app/...")
	// Replace href="./_app/..." or href="/_app/..."
	// Replace src="./_app/..." or src="/_app/..."
	content = content.replace(/["'](\.?\/_app\/)([^"']+)["']/g, (match, prefix, path) => {
		const quote = match[0];
		return `${quote}${baseUrl}/_app/${path}${quote}`;
	});

	// Note: manifest.webmanifest should NOT be served from CDN - it must be same-origin for PWA to work
	// The manifest file itself stays local, but icons within it use CDN URLs (handled by processManifestFile)

	// Add CDN preconnect links (optimized to avoid duplicates)
	const imageCdnUrl = process.env.CDN_IMAGE_URL || manifest.cdnBaseUrl;
	const needsPreconnect = manifest.cdnBaseUrl && manifest.cdnBaseUrl.startsWith('http');

	if (needsPreconnect) {
		// Remove existing preconnect placeholders (matches comments containing link tags)
		content = content.replace(
			/<!-- Preconnect to CDN[\s\S]*?-->(\s*<!--[\s\S]*?preconnect[\s\S]*?-->\s*<!--[\s\S]*?dns-prefetch[\s\S]*?-->\s*)/g,
			''
		);

		// Build unique preconnect links (avoid duplicates when CDN_URL == CDN_IMAGE_URL)
		const preconnectLinks: string[] = [];
		const addedUrls = new Set<string>();

		const addPreconnect = (url: string) => {
			const origin = new URL(url).origin;
			if (!addedUrls.has(origin)) {
				preconnectLinks.push(`  <link rel="preconnect" href="${origin}" />`);
				preconnectLinks.push(`  <link rel="dns-prefetch" href="${origin}" />`);
				addedUrls.add(origin);
			}
		};

		addPreconnect(manifest.cdnBaseUrl);
		if (imageCdnUrl !== manifest.cdnBaseUrl) {
			addPreconnect(imageCdnUrl);
		}

		// Insert preconnect links after charset meta tag
		const preconnectHtml = '\n' + preconnectLinks.join('\n');
		content = content.replace(
			/<meta charset="[^"]*"\s*\/?>/i,
			`<meta charset="utf-8" />${preconnectHtml}\n`
		);
	}

	// Add CDN base URL meta tag
	const metaTag = `\n  <meta name="cdn-base-url" content="${manifest.cdnBaseUrl}">`;
	if (content.includes('<head>')) {
		content = content.replace('<head>', `<head>${metaTag}`);
	}

	return content;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	buildCDNForSvelteKit();
}

export { buildCDNForSvelteKit };
