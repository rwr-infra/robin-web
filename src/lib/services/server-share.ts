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
 * Server share service for generating and exporting server stats as images
 * Uses SnapDOM for fast, accurate DOM capture
 */
export class ServerShareService {
	private defaultOptions: ShareOptions = {
		format: 'png',
		quality: 0.95,
		scale: 2,
		backgroundColor: 'transparent'
	};

	async generateImage(element: HTMLElement, options: ShareOptions = {}): Promise<Blob> {
		const mergedOptions = { ...this.defaultOptions, ...options };

		try {
			const snapdomOptions: SnapdomOptions = {
				scale: mergedOptions.scale,
				quality: mergedOptions.quality,
				backgroundColor: mergedOptions.backgroundColor
			};

			const capture = await snapdom(element, snapdomOptions);
			const blob = await capture.toBlob({ type: mergedOptions.format });

			return blob;
		} catch (error) {
			throw new Error(
				`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{ cause: error }
			);
		}
	}

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

	canCopyToClipboard(): boolean {
		return (
			'clipboard' in navigator && navigator.clipboard != null && 'write' in navigator.clipboard
		);
	}

	generateFilename(serverName: string, format: 'png' | 'jpeg' | 'webp' = 'png'): string {
		const date = new Date();
		const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
		const sanitizedName = serverName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
		return `${sanitizedName}_server_${timestamp}.${format}`;
	}

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

	getCurrentTimestamp(): number {
		return Date.now();
	}
}

export const serverShareService = new ServerShareService();
