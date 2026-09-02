import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuração mínima: o app não usa cache incremental nem fila de revalidação,
// então não precisa de KV nem de Durable Objects por enquanto.
export default defineCloudflareConfig();
