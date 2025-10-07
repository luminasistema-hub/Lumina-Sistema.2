import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string | null) {
  if (!secret) return true // Se não houver segredo configurado, não bloqueia (opcional)
  if (!signatureHeader) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )
  const signature = Uint8Array.from(atob(signatureHeader), c => c.charCodeAt(0))
  const ok = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(rawBody))
  return ok
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const raw = await req.text()
    const signatureHeader = req.headers.get("X-Abacatepay-Signature") || req.headers.get("x-signature")
    const secret = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET") || null
    const valid = await verifySignature(raw, signatureHeader, secret)
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 })
    }

    const payload = JSON.parse(raw)

    // Espera: { event_type: string, status: string, external_reference: uuid, amount?: number, ... }
    const churchId = payload.external_reference
    if (!churchId) {
      return new Response(JSON.stringify({ error: "missing_external_reference" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Mapeia status de gateway para coluna ultimo_pagamento_status
    const statusMap: Record<string, string> = {
      paid: "Pago",
      payment_succeeded: "Pago",
      pending: "Pendente",
      payment_pending: "Pendente",
      failed: "Atrasado",
      cancelled: "Cancelado",
      canceled: "Cancelado"
    }
    const mapped = statusMap[(payload.status || payload.event_type || "").toLowerCase()] ?? "Pendente"

    // Atualiza igreja
    const { error: updErr } = await supabaseAdmin
      .from("igrejas")
      .update({
        ultimo_pagamento_status: mapped,
        // Opcional: data_proximo_pagamento se informado no webhook
        data_proximo_pagamento: payload.next_billing_date ?? null
      })
      .eq("id", churchId)

    if (updErr) throw updErr

    // Registra evento para auditoria
    await supabaseAdmin
      .from("eventos_aplicacao")
      .insert({
        user_id: null,
        church_id: churchId,
        event_name: "abacatepay_webhook",
        event_details: payload
      })

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
  } catch (e) {
    console.error("Abacate PAY webhook error:", e)
    return new Response(JSON.stringify({ error: (e as Error).message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 })
  }
})