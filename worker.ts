// Cloudflare Worker to proxy /api/* requests to Rust backend via Service Binding
// Also serves static assets for the SvelteKit frontend

export interface Env {
	// Service binding to robin-workers-server Worker
	ROBIN_SERVER: Fetcher;
}

// ExecutionContext interface for Workers
interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle /api/* requests - proxy to Rust backend via Service Binding
		if (url.pathname.startsWith('/api/')) {
			return handleApiRequest(request, env, ctx);
		}

		// All other requests - serve static assets
		// This will be handled by the assets configuration in wrangler.jsonc
		// But we need to return a pass-through response for assets to work
		return fetch(request);
	},
};

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);

	console.log(`Proxying API request via Service Binding: ${request.method} ${url.pathname}`);

	try {
		// Forward the request to the robin-workers-server Worker via Service Binding
		// The Service Binding handles the internal routing to /api/*
		const response = await env.ROBIN_SERVER.fetch(request);

		// Clone the response so we can modify headers if needed
		const modifiedResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});

		// Add CORS headers
		modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
		modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

		return modifiedResponse;
	} catch (error) {
		console.error('Error proxying request to robin-workers-server:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to connect to backend server', details: String(error) }),
			{
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	}
}
