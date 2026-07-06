/// <reference types="vite/client" />

declare module '@vercel/node' {
	export interface VercelRequest {
		method?: string;
		body?: unknown;
		headers: Record<string, string | string[] | undefined>;
		query: Record<string, string | string[] | undefined>;
	}

	export interface VercelResponse {
		status(code: number): VercelResponse;
		json(body: unknown): VercelResponse;
		setHeader(name: string, value: string | string[]): void;
	}
}
