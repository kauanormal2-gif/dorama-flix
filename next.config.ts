import type { NextConfig } from "next";

const securityHeaders = [
  // Força HTTPS por 2 anos + subdomínios
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Bloqueia embed em iframes (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Bloqueia MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza URL de origem pra sites externos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Reduz superfície de APIs sensíveis
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
  },
  // XSS legacy fallback
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // CSP básica — permite imagens externas (posters), vídeos R2/Drive
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://drive.google.com https://vercel.live",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    // Na Cloudflare o otimizador arrasta ~1,4 MB de WebAssembly e estoura o
    // limite de tamanho do Worker. As capas já vêm prontas do R2, então servir
    // direto é o caminho lá. Fora da Cloudflare o otimizador continua ligado.
    unoptimized: process.env.CLOUDFLARE_BUILD === "1",
    // Pôsteres são PNG de ~1.4MB. O otimizador converte pra AVIF/WebP no
    // tamanho real do card (150px no Android), derrubando ~98% do peso.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "pub-1c2e5587009f43a5a1fb5225d3b74177.r2.dev" },
    ],
    // Larguras que a gente realmente usa: card mobile, card desktop, banner.
    deviceSizes: [360, 640, 828, 1080, 1200, 1920],
    imageSizes: [150, 190, 256, 384],
    // Next 16 só aceita os quality que estiverem listados aqui
    qualities: [65, 75],
    minimumCacheTTL: 2678400, // 31 dias
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
