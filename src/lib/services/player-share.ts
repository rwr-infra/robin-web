import { snapdom, type SnapdomOptions } from '@zumer/snapdom';

export interface ShareOptions {
	format?: 'png' | 'jpeg' | 'webp';
	quality?: number;
	scale?: number;
	backgroundColor?: string;
}

export interface ShareFilters {
	brightness?: number;
	contrast?: number;
	saturate?: number;
	blur?: number;
}

export interface ShareContext {
	element: HTMLElement;
	options: ShareOptions;
	metadata: {
		filename?: string;
		timestamp?: number;
	};
}

/**
 * Player share service for generating and exporting player stats as images
 * Uses SnapDOM for fast, accurate DOM capture
 * Extensible for future image editor features
 */
export class PlayerShareService {
	private defaultOptions: ShareOptions = {
		format: 'png',
		quality: 0.95,
		scale: 2, // High resolution for retina displays
		backgroundColor: 'transparent'
	};

	/**
	 * Generate image from DOM element using SnapDOM
	 * SnapDOM is 93x faster than html2canvas with better CSS support
	 */
	async generateImage(element: HTMLElement, options: ShareOptions = {}): Promise<Blob> {
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			// Build snapdom options
			const snapdomOptions: SnapdomOptions = {
				scale: mergedOptions.scale,
				quality: mergedOptions.quality,
				backgroundColor: mergedOptions.backgroundColor
			};

			// snapdom returns a CaptureResult - use toBlob with format
			const capture = await snapdom(element, snapdomOptions);

			// Convert to blob with the specified format
			const blob = await capture.toBlob({ type: mergedOptions.format });

			return blob;
		} catch (error) {
			throw new Error(
				`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ cause: error }
			);
		}
	}

	/**
	 * Download image to file
	 */
	async downloadImage(blob: Blob, filename: string): Promise<void> {
		try {
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			throw new Error(
				`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{
					cause: error
				}
			);
		}
	}

	/**
	 * Copy image to clipboard
	 */
	async copyToClipboard(blob: Blob): Promise<void> {
		if (!this.canCopyToClipboard()) {
			throw new Error('Clipboard API not supported in this browser');
		}

		try {
			const item = new ClipboardItem({ 'image/png': blob });
			await navigator.clipboard.write([item]);
		} catch (error) {
			throw new Error(
				`Copy to clipboard failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ cause: error }
			);
		}
	}

	/**
	 * Check if clipboard API is supported
	 */
	canCopyToClipboard(): boolean {
		return (
			'clipboard' in navigator && navigator.clipboard != null && 'write' in navigator.clipboard
		);
	}

	/**
	 * Generate filename for player stats image
	 */
	generateFilename(username: string, format: 'png' | 'jpeg' | 'webp' = 'png'): string {
		const date = new Date();
		const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
		return `${username}_stats_${timestamp}.${format}`;
	}

	/**
	 * Format a timestamp for display
	 */
	formatTimestamp(timestamp: number, locale: string = 'en-US'): string {
		const date = new Date(timestamp);
		return date.toLocaleString(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Get current timestamp for data freshness indicator
	 */
	getCurrentTimestamp(): number {
		return Date.now();
	}

	// ===== Extensibility hooks for future image editor features =====

	/**
	 * Apply image filters (for future image editor)
	 * @param blob - The image blob to apply filters to
	 * @param filters - Filter options
	 */
	async applyFilters(blob: Blob, filters: ShareFilters): Promise<Blob> {
		if (Object.keys(filters).length === 0) {
			return blob;
		}

		// Create an image element from the blob
		const bitmap = await createImageBitmap(blob);
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = canvas.getContext('2d')!;

		// Draw the image
		ctx.drawImage(bitmap, 0, 0);

		// Apply filters using Canvas API
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			let r = data[i];
			let g = data[i + 1];
			let b = data[i + 2];

			// Brightness
			if (filters.brightness) {
				const factor = filters.brightness;
				r = Math.min(255, r * factor);
				g = Math.min(255, g * factor);
				b = Math.min(255, b * factor);
			}

			// Contrast
			if (filters.contrast) {
				const factor = filters.contrast;
				const intercept = 128 * (1 - factor);
				r = Math.min(255, Math.max(0, r * factor + intercept));
				g = Math.min(255, Math.max(0, g * factor + intercept));
				b = Math.min(255, Math.max(0, b * factor + intercept));
			}

			// Saturation
			if (filters.saturate) {
				const factor = filters.saturate;
				const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
				r = Math.min(255, Math.max(0, gray + factor * (r - gray)));
				g = Math.min(255, Math.max(0, gray + factor * (g - gray)));
				b = Math.min(255, Math.max(0, gray + factor * (b - gray)));
			}

			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
		}

		ctx.putImageData(imageData, 0, 0);

		// Convert back to blob
		return canvas.convertToBlob({ type: `image/png` });
	}

	/**
	 * Add watermark to image (for future image editor)
	 * @param blob - The image blob to add watermark to
	 * @param text - Watermark text
	 * @param options - Watermark options
	 */
	async addWatermark(
		blob: Blob,
		text: string,
		options: {
			position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
			fontSize?: number;
			opacity?: number;
			color?: string;
		} = {}
	): Promise<Blob> {
		const { position = 'bottom-right', fontSize = 16, opacity = 0.5, color = '#ffffff' } = options;

		// Create an image element from the blob
		const bitmap = await createImageBitmap(blob);
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = canvas.getContext('2d')!;

		// Draw the original image
		ctx.drawImage(bitmap, 0, 0);

		// Add watermark
		ctx.save();
		ctx.globalAlpha = opacity;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.fillStyle = color;

		const padding = 10;
		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;

		let x = padding;
		let y = canvas.height - padding;

		switch (position) {
			case 'bottom-right':
				x = canvas.width - textWidth - padding;
				y = canvas.height - padding;
				break;
			case 'top-right':
				x = canvas.width - textWidth - padding;
				y = fontSize + padding;
				break;
			case 'top-left':
				x = padding;
				y = fontSize + padding;
				break;
			case 'center':
				x = (canvas.width - textWidth) / 2;
				y = (canvas.height + fontSize) / 2;
				break;
		}

		ctx.fillText(text, x, y);
		ctx.restore();

		// Convert back to blob
		return canvas.convertToBlob({ type: blob.type });
	}

	/**
	 * Crop image to specified dimensions (for future image editor)
	 */
	async cropImage(blob: Blob, x: number, y: number, width: number, height: number): Promise<Blob> {
		const bitmap = await createImageBitmap(blob);
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
		return canvas.convertToBlob({ type: blob.type });
	}

	/**
	 * Resize image to specified dimensions (for future image editor)
	 */
	async resizeImage(blob: Blob, width: number, height: number): Promise<Blob> {
		const bitmap = await createImageBitmap(blob);
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(bitmap, 0, 0, width, height);
		return canvas.convertToBlob({ type: blob.type });
	}
}

// Singleton instance
export const playerShareService = new PlayerShareService();
