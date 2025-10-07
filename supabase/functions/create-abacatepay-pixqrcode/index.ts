import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PixCustomer = {
  name: string;
  cellphone: string;
  email: string;
  taxId: string; // CPF/CNPJ como string
};

type CreatePixBody = {
  amount: number; // em reais (vamos converter para centavos)
  description?: string;
  expiresIn?: number; // segundos
  customer?: PixCustomer | null;
  metadata?: Record<string, unknown> | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ABACATEPAY_API_KEY");
    const baseUrl = Deno.env.get("ABACATEPAY_API_URL") ?? "https://api.abacatepay.com/v1";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ABACATEPAY_API_KEY secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CreatePixBody;
    if (!body || typeof body.amount !== "number" || isNaN(body.amount) || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // A API requer amount em centavos
    const amountInCents = Math.round(body.amount * 100);

    // Monta payload conforme docs
    const payload: Record<string, unknown> = {
      amount: amountInCents,
    };
    if (body.expiresIn && Number.isFinite(body.expiresIn)) payload.expiresIn = body.expiresIn;
    if (body.description) payload.description = body.description.slice(0, 140);
    if (body.customer && body.customer.name && body.customer.cellphone && body.customer.email && body.customer.taxId) {
      payload.customer = body.customer;
    }
    if (body.metadata) payload.metadata = body.metadata;

    const res = await fetch(`${baseUrl}/pixQrCode/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "abacatepay_error", details: json }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Espera: { data: { id, amount, status, brCode, brCodeBase64, ... }, error: null }
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-abacatepay-pixqrcode error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});