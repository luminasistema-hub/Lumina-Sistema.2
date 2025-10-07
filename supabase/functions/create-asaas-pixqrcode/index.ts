import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AsaasCustomer = {
  name: string;
  email: string;
  cellphone: string;
  taxId: string; // CPF/CNPJ
};

type CreatePixBody = {
  amount: number; // em reais
  description?: string;
  customer: AsaasCustomer;
  metadata?: Record<string, unknown> | null;
};

const sanitizeTaxId = (v: string) => (v || "").replace(/[^\d]+/g, "");
const todayIsoDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    const token = Deno.env.get("ASAAS_API_TOKEN");
    const baseUrl = Deno.env.get("ASAAS_API_URL") ?? "https://api.asaas.com/v3";

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing ASAAS_API_TOKEN secret" }), {
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
    if (!body.customer || !body.customer.name || !body.customer.email || !body.customer.cellphone || !body.customer.taxId) {
      return new Response(JSON.stringify({ error: "Customer data is required for ASAAS (name, email, cellphone, taxId)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const value = Math.round(body.amount * 100) / 100; // ASAAS espera valor em reais (2 casas), não centavos
    const description = (body.description || "").slice(0, 140);
    const cpfCnpj = sanitizeTaxId(body.customer.taxId);

    // 1) Buscar cliente por email; se não existir, criar
    let customerId: string | null = null;

    const searchRes = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(body.customer.email)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "access_token": token,
      },
    });
    const searchJson = await searchRes.json();
    if (searchRes.ok && searchJson?.data?.length) {
      customerId = searchJson.data[0].id;
    } else {
      const createRes = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": token,
        },
        body: JSON.stringify({
          name: body.customer.name,
          email: body.customer.email,
          cpfCnpj,
          mobilePhone: body.customer.cellphone,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        return new Response(JSON.stringify({ error: "asaas_customer_error", details: createJson }), {
          status: createRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      customerId = createJson.id;
    }

    if (!customerId) {
      return new Response(JSON.stringify({ error: "Failed to resolve ASAAS customer ID" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Criar pagamento PIX
    const paymentRes = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": token,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value,
        description,
        dueDate: todayIsoDate(),
      }),
    });
    const paymentJson = await paymentRes.json();
    if (!paymentRes.ok) {
      return new Response(JSON.stringify({ error: "asaas_payment_error", details: paymentJson }), {
        status: paymentRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = paymentJson.id;

    // 3) Obter QRCode PIX
    const qrRes = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "access_token": token,
      },
    });
    const qrJson = await qrRes.json();
    if (!qrRes.ok) {
      return new Response(JSON.stringify({ error: "asaas_qrcode_error", details: qrJson }), {
        status: qrRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retorna em formato similar ao do Abacate PAY para facilitar uso no front
    const mapped = {
      data: {
        id: paymentId,
        amount: value,
        status: paymentJson.status,
        brCode: qrJson?.payload || null,
        brCodeBase64: qrJson?.encodedImage || null,
        createdAt: paymentJson?.dateCreated || null,
        updatedAt: paymentJson?.dateUpdated || null,
        expiresAt: paymentJson?.dueDate || null,
      },
      error: null,
    };

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-asaas-pixqrcode error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});