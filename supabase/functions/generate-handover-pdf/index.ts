import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { protocolId } = await req.json();

    if (!protocolId) {
      throw new Error("Protocol ID is required");
    }

    // Use service role for data access (needed to fetch all related data)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch protocol with all related data
    const { data: protocol, error: protocolError } = await supabase
      .from("handover_protocols")
      .select(`
        *,
        unit:units(id, unit_number, building:buildings(id, name, address, city, postal_code)),
        tenant:tenants(id, first_name, last_name, email, phone)
      `)
      .eq("id", protocolId)
      .single();

    if (protocolError) throw protocolError;

    const { data: rooms } = await supabase
      .from("handover_rooms")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("order_index");

    const { data: defects } = await supabase
      .from("handover_defects")
      .select("*")
      .eq("protocol_id", protocolId);

    const { data: signatures } = await supabase
      .from("handover_signatures")
      .select("*")
      .eq("protocol_id", protocolId);

    const { data: keys } = await supabase
      .from("handover_keys")
      .select("*")
      .eq("protocol_id", protocolId);

    // Generate PDF HTML
    const html = generatePDFHTML({
      protocol,
      rooms: rooms || [],
      defects: defects || [],
      signatures: signatures || [],
      keys: keys || [],
    });

    return new Response(
      JSON.stringify({
        success: true,
        html,
        protocol,
        rooms,
        defects,
        signatures,
        keys,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface PDFData {
  protocol: any;
  rooms: any[];
  defects: any[];
  signatures: any[];
  keys: any[];
}

function generatePDFHTML({ protocol, rooms, defects, signatures, keys }: PDFData): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel = protocol.type === "move_in" ? "Einzug" : "Auszug";

  const roomsHtml = rooms
    .map(
      (room) => `
      <div class="room">
        <h3>${room.room_name}</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Prüfpunkt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(room.items || [])
              .map(
                (item: any) => `
              <tr>
                <td>${item.name}</td>
                <td class="${item.status === "ok" ? "status-ok" : item.status === "defect" ? "status-defect" : "status-pending"}">
                  ${item.status === "ok" ? "✓ In Ordnung" : item.status === "defect" ? "✗ Mangel" : "—"}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        ${room.notes ? `<p class="notes"><strong>Notizen:</strong> ${room.notes}</p>` : ""}
      </div>
    `
    )
    .join("");

  const defectsHtml =
    defects.length > 0
      ? `
    <div class="section">
      <h2>Mängelliste</h2>
      <table class="defects-table">
        <thead>
          <tr>
            <th>Beschreibung</th>
            <th>Schweregrad</th>
            <th>Mieter verantwortlich</th>
          </tr>
        </thead>
        <tbody>
          ${defects
            .map(
              (defect) => `
            <tr>
              <td>${defect.description}</td>
              <td>${defect.severity === "light" ? "Leicht" : defect.severity === "medium" ? "Mittel" : "Schwer"}</td>
              <td>${defect.is_tenant_responsible ? "Ja" : "Nein"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : "";

  const keysHtml = `
    <div class="section">
      <h2>Schlüsselübergabe</h2>
      <table class="keys-table">
        <thead>
          <tr>
            <th>Schlüsseltyp</th>
            <th>Anzahl</th>
            <th>Übergeben</th>
          </tr>
        </thead>
        <tbody>
          ${keys
            .map(
              (key) => `
            <tr>
              <td>${key.key_label || key.key_type}</td>
              <td>${key.quantity}</td>
              <td>${key.handed_over ? "Ja ✓" : "Nein"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  const signaturesHtml = `
    <div class="section signatures">
      <h2>Unterschriften</h2>
      <div class="signature-grid">
        ${signatures
          .map(
            (sig) => `
          <div class="signature-box">
            <p class="signer-type">${sig.signer_type === "landlord" ? "Vermieter" : sig.signer_type === "tenant" ? "Mieter" : "Zeuge"}</p>
            <img src="${sig.signature_path}" alt="Unterschrift" class="signature-img" />
            <p class="signer-name">${sig.signer_name}</p>
            <p class="signed-at">${formatDateTime(sig.signed_at)}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Übergabeprotokoll - ${typeLabel}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { font-size: 24px; text-align: center; margin-bottom: 5px; }
        h2 { font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 20px; }
        h3 { font-size: 14px; margin-bottom: 10px; }
        .type-badge {
          text-align: center;
          margin-bottom: 20px;
        }
        .type-badge span {
          display: inline-block;
          padding: 5px 15px;
          background: #e0e0e0;
          border-radius: 4px;
          font-weight: bold;
        }
        .header-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .header-info-box {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
        }
        .header-info-box h4 {
          margin: 0 0 5px 0;
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .status-ok { color: green; }
        .status-defect { color: red; }
        .status-pending { color: #999; }
        .room {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .notes {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
          font-style: italic;
        }
        .section {
          margin-top: 30px;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .signature-box {
          border: 1px solid #ddd;
          padding: 15px;
          text-align: center;
        }
        .signer-type {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .signature-img {
          max-width: 200px;
          height: 60px;
          object-fit: contain;
        }
        .signer-name {
          margin-top: 10px;
          font-weight: bold;
        }
        .signed-at {
          font-size: 10px;
          color: #666;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          body { padding: 0; }
          .room { page-break-inside: avoid; }
          .signatures { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <h1>Wohnungsübergabeprotokoll</h1>
      <div class="type-badge"><span>${typeLabel}</span></div>
      
      <div class="header-info">
        <div class="header-info-box">
          <h4>Objekt</h4>
          <strong>${protocol.unit?.building?.name || "—"}</strong><br>
          ${protocol.unit?.building?.address || ""}<br>
          ${protocol.unit?.building?.postal_code || ""} ${protocol.unit?.building?.city || ""}<br>
          <strong>Einheit:</strong> ${protocol.unit?.unit_number || "—"}
        </div>
        <div class="header-info-box">
          <h4>Mieter</h4>
          ${protocol.tenant ? `
            <strong>${protocol.tenant.first_name} ${protocol.tenant.last_name}</strong><br>
            ${protocol.tenant.email || ""}<br>
            ${protocol.tenant.phone || ""}
          ` : "—"}
        </div>
        <div class="header-info-box">
          <h4>Übergabedatum</h4>
          <strong>${formatDateTime(protocol.scheduled_at)}</strong>
        </div>
        <div class="header-info-box">
          <h4>Status</h4>
          <strong>${protocol.status === "signed" ? "Unterschrieben" : protocol.status === "completed" ? "Abgeschlossen" : "In Bearbeitung"}</strong>
        </div>
      </div>

      <div class="section">
        <h2>Räume</h2>
        ${roomsHtml || "<p>Keine Räume dokumentiert.</p>"}
      </div>

      ${defectsHtml}
      ${keysHtml}
      ${signaturesHtml}

      <div class="footer">
        <p>Erstellt am ${formatDateTime(protocol.created_at)} | Protokoll-ID: ${protocol.id.slice(0, 8)}</p>
      </div>
    </body>
    </html>
  `;
}
