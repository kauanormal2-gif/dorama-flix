import https from "node:https";

/**
 * Cliente das APIs da Efí (Efí Bank).
 *
 * São duas APIs distintas, com credenciais e autenticação separadas:
 * - API Pix (pix.api.efipay.com.br) — exige certificado mTLS em TODAS as requisições
 * - API Cobranças (cobrancas.api.efipay.com.br) — boleto e cartão, sem certificado
 */

const SANDBOX = process.env.EFI_ENV !== "production";

const PIX_BASE = SANDBOX
  ? "https://pix-h.api.efipay.com.br"
  : "https://pix.api.efipay.com.br";

const COB_BASE = SANDBOX
  ? "https://cobrancas-h.api.efipay.com.br"
  : "https://cobrancas.api.efipay.com.br";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Env ${name} não configurada`);
  return value;
}

/* -------------------------------------------------------------------------- */
/* API Pix — requisições com certificado mTLS                                  */
/* -------------------------------------------------------------------------- */

/** Certificado .p12 convertido para PEM (cert + chave no mesmo arquivo), em base64 */
function getCertPem(): string {
  return Buffer.from(required("EFI_CERT_PEM"), "base64").toString("utf8");
}

interface PixRequestOptions {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

function pixRequest<T>({
  method,
  path,
  headers = {},
  body,
}: PixRequestOptions): Promise<T> {
  const pem = getCertPem();
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const url = new URL(PIX_BASE + path);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        cert: pem,
        key: pem,
        minVersion: "TLSv1.2",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(
              new Error(`Efí Pix ${method} ${path} → ${status}: ${raw.slice(0, 500)}`)
            );
            return;
          }
          try {
            resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
          } catch {
            reject(new Error(`Efí Pix ${path}: resposta inválida`));
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let pixToken: { value: string; expiresAt: number } | null = null;

async function getPixToken(): Promise<string> {
  if (pixToken && Date.now() < pixToken.expiresAt) return pixToken.value;

  const basic = Buffer.from(
    `${required("EFI_PIX_CLIENT_ID")}:${required("EFI_PIX_CLIENT_SECRET")}`
  ).toString("base64");

  const data = await pixRequest<{ access_token: string; expires_in: number }>({
    method: "POST",
    path: "/oauth/token",
    headers: { Authorization: `Basic ${basic}` },
    body: { grant_type: "client_credentials" },
  });

  // Renova 60s antes de expirar
  pixToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return pixToken.value;
}

async function pixApi<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const token = await getPixToken();
  return pixRequest<T>({
    method,
    path,
    body,
    headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
  });
}

export interface PixCharge {
  txid: string;
  status: string;
  loc: { id: number; location: string };
  pixCopiaECola: string;
}

export async function createPixCharge(params: {
  /** Valor no formato "9.90" */
  value: string;
  name: string;
  description: string;
  /** Segundos até a cobrança expirar */
  expiresIn?: number;
}): Promise<PixCharge> {
  // `devedor` é opcional no Pix e exigiria CPF — não pedimos CPF pra Pix.
  return pixApi<PixCharge>("POST", "/v2/cob", {
    calendario: { expiracao: params.expiresIn ?? 3600 },
    valor: { original: params.value },
    chave: required("EFI_PIX_KEY"),
    solicitacaoPagador: params.description,
  });
}

export async function getPixCharge(txid: string) {
  return pixApi<{
    txid: string;
    status: string;
    valor: { original: string };
    pix?: { endToEndId: string; valor: string; horario: string }[];
  }>("GET", `/v2/cob/${encodeURIComponent(txid)}`);
}

/** Retorna o QR Code como imagem data-uri base64 pronta pra <img src> */
export async function getPixQrCode(locId: number) {
  return pixApi<{ qrcode: string; imagemQrcode: string }>(
    "GET",
    `/v2/loc/${locId}/qrcode`
  );
}

/** Registra a URL que a Efí vai chamar quando um Pix for pago. */
export async function registerPixWebhook(webhookUrl: string) {
  return pixApi(
    "PUT",
    `/v2/webhook/${encodeURIComponent(required("EFI_PIX_KEY"))}`,
    { webhookUrl },
    // Vercel não faz validação de certificado do cliente — a autenticidade do
    // webhook é garantida reconsultando a cobrança na Efí antes de liberar acesso.
    { "x-skip-mtls-checking": "true" }
  );
}

export async function getPixWebhook() {
  return pixApi("GET", `/v2/webhook/${encodeURIComponent(required("EFI_PIX_KEY"))}`);
}

/* -------------------------------------------------------------------------- */
/* API Cobranças — boleto e cartão (sem certificado)                           */
/* -------------------------------------------------------------------------- */

let cobToken: { value: string; expiresAt: number } | null = null;

async function getCobToken(): Promise<string> {
  if (cobToken && Date.now() < cobToken.expiresAt) return cobToken.value;

  const basic = Buffer.from(
    `${required("EFI_CHARGE_CLIENT_ID")}:${required("EFI_CHARGE_CLIENT_SECRET")}`
  ).toString("base64");

  const res = await fetch(`${COB_BASE}/v1/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Efí Cobranças auth → ${res.status}: ${JSON.stringify(json)}`);
  }

  cobToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return cobToken.value;
}

async function cobApi<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getCobToken();
  const res = await fetch(COB_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `Efí Cobranças ${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 500)}`
    );
  }
  return json as T;
}

interface EfiCustomer {
  name: string;
  cpf: string;
  email: string;
  phone_number: string;
  birth?: string;
}

interface EfiAddress {
  street: string;
  number: string;
  neighborhood: string;
  zipcode: string;
  city: string;
  state: string;
  complement?: string;
}

export interface CardChargeResult {
  charge_id: number;
  status: string;
  total: number;
  payment: string;
  installments: number;
  installment_value: number;
}

export async function createCardCharge(params: {
  item: string;
  amount: number;
  customer: EfiCustomer;
  billingAddress: EfiAddress;
  paymentToken: string;
  installments: number;
  notificationUrl: string;
  customId: string;
}): Promise<CardChargeResult> {
  const res = await cobApi<{ data: CardChargeResult }>(
    "POST",
    "/v1/charge/one-step",
    {
      items: [{ name: params.item, value: params.amount, amount: 1 }],
      payment: {
        credit_card: {
          customer: { ...params.customer, address: params.billingAddress },
          installments: params.installments,
          billing_address: params.billingAddress,
          payment_token: params.paymentToken,
        },
      },
      metadata: {
        notification_url: params.notificationUrl,
        custom_id: params.customId,
      },
    }
  );
  return res.data;
}

export interface BoletoChargeResult {
  charge_id: number;
  status: string;
  total: number;
  barcode: string;
  link: string;
  billet_link: string;
  pdf: { charge: string };
  expire_at: string;
}

export async function createBoletoCharge(params: {
  item: string;
  amount: number;
  customer: EfiCustomer;
  expireAt: string;
  notificationUrl: string;
  customId: string;
}): Promise<BoletoChargeResult> {
  const res = await cobApi<{ data: BoletoChargeResult }>(
    "POST",
    "/v1/charge/one-step",
    {
      items: [{ name: params.item, value: params.amount, amount: 1 }],
      payment: {
        banking_billet: {
          customer: params.customer,
          expire_at: params.expireAt,
        },
      },
      metadata: {
        notification_url: params.notificationUrl,
        custom_id: params.customId,
      },
    }
  );
  return res.data;
}

export interface EfiNotificationEntry {
  id: number;
  type: string;
  custom_id: string | null;
  identifiers: { charge_id?: number };
  status: { current: string; previous: string };
  value?: number;
  created_at: string;
}

/** Consulta os detalhes de uma notificação da API de Cobranças pelo token recebido. */
export async function getNotification(token: string) {
  const res = await cobApi<{ data: EfiNotificationEntry[] }>(
    "GET",
    `/v1/notification/${encodeURIComponent(token)}`
  );
  return res.data;
}

export async function getCharge(chargeId: number) {
  const res = await cobApi<{ data: { status: string; total: number } }>(
    "GET",
    `/v1/charge/${chargeId}`
  );
  return res.data;
}
