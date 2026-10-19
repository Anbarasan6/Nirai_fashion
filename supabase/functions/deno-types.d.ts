// Type definitions for Supabase Edge Functions running on Deno
// Provides TypeScript intellisense and resolves IDE errors when Deno CLI is not installed locally.

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;

  export interface ServeHandlerInfo {
    remoteAddr: {
      transport: 'tcp' | 'udp';
      hostname: string;
      port: number;
    };
  }

  export type ServeHandler = (
    request: Request,
    info: ServeHandlerInfo
  ) => Response | Promise<Response>;

  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
  export function serve(
    options: ServeOptions,
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'https://*' {
  const content: any;
  export default content;
  export const createClient: any;
}
