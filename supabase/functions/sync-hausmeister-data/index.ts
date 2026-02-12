import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get user's org
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Keine Organisation gefunden" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "sync_building":
        return await syncBuilding(admin, orgId, body.building_id);

      case "sync_tasks":
        return await syncTasks(admin, orgId, body.building_id);

      case "check_user":
        return await checkUser(admin, body.email);

      case "get_status":
        return await getStatus(admin, orgId, body.building_id);

      default:
        return new Response(JSON.stringify({ error: "Unbekannte Aktion" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── SYNC BUILDING ──────────────────────────────────────────────
async function syncBuilding(admin: any, orgId: string, buildingId: string) {
  // Get org info for company mapping
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .single();

  // Get building with units
  const { data: building } = await admin
    .from("buildings")
    .select("id, name, address, city, postal_code, building_type, total_area, notes")
    .eq("id", buildingId)
    .single();

  if (!building) {
    return jsonResponse({ error: "Gebäude nicht gefunden" }, 404);
  }

  const { data: units } = await admin
    .from("units")
    .select("id, unit_number, floor, area, rooms, unit_type, rent_amount_cents, status")
    .eq("building_id", buildingId);

  // Upsert company in HausmeisterPro (companies table)
  let companyRemoteId: string;
  const { data: existingCompanyMap } = await admin
    .from("hausmeister_sync_map")
    .select("remote_id")
    .eq("organization_id", orgId)
    .eq("entity_type", "company")
    .eq("local_id", orgId)
    .maybeSingle();

  if (existingCompanyMap?.remote_id) {
    // Update existing company
    await admin
      .from("companies")
      .update({ name: org.name, updated_at: new Date().toISOString() })
      .eq("id", existingCompanyMap.remote_id);
    companyRemoteId = existingCompanyMap.remote_id;
  } else {
    // Create new company
    const { data: newCompany, error: companyErr } = await admin
      .from("companies")
      .insert({ name: org.name })
      .select("id")
      .single();

    if (companyErr) {
      return jsonResponse({ error: `Firma konnte nicht erstellt werden: ${companyErr.message}` }, 500);
    }
    companyRemoteId = newCompany.id;

    // Save mapping
    await admin.from("hausmeister_sync_map").insert({
      organization_id: orgId,
      entity_type: "company",
      local_id: orgId,
      remote_id: companyRemoteId,
      sync_direction: "push",
    });
  }

  // Upsert building in HausmeisterPro
  let buildingRemoteId: string;
  const { data: existingBuildingMap } = await admin
    .from("hausmeister_sync_map")
    .select("remote_id")
    .eq("organization_id", orgId)
    .eq("entity_type", "building")
    .eq("local_id", buildingId)
    .maybeSingle();

  const buildingData = {
    company_id: companyRemoteId,
    name: building.name,
    address: building.address,
    city: building.city,
    postal_code: building.postal_code,
    updated_at: new Date().toISOString(),
  };

  if (existingBuildingMap?.remote_id) {
    await admin.from("buildings").update(buildingData).eq("id", existingBuildingMap.remote_id);
    buildingRemoteId = existingBuildingMap.remote_id;
  } else {
    // Check if building already exists in HausmeisterPro by company + name
    const { data: existingBuilding } = await admin
      .from("buildings")
      .select("id")
      .eq("company_id", companyRemoteId)
      .eq("name", building.name)
      .maybeSingle();

    if (existingBuilding) {
      buildingRemoteId = existingBuilding.id;
      await admin.from("buildings").update(buildingData).eq("id", buildingRemoteId);
    } else {
      const { data: newBuilding, error: buildingErr } = await admin
        .from("buildings")
        .insert({ ...buildingData, created_at: new Date().toISOString() })
        .select("id")
        .single();

      if (buildingErr) {
        return jsonResponse({ error: `Gebäude konnte nicht synchronisiert werden: ${buildingErr.message}` }, 500);
      }
      buildingRemoteId = newBuilding.id;
    }

    await admin.from("hausmeister_sync_map").upsert({
      organization_id: orgId,
      entity_type: "building",
      local_id: buildingId,
      remote_id: buildingRemoteId,
      sync_direction: "push",
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "organization_id,entity_type,local_id" });
  }

  // Sync units
  const unitResults: any[] = [];
  for (const unit of (units ?? [])) {
    const { data: existingUnitMap } = await admin
      .from("hausmeister_sync_map")
      .select("remote_id")
      .eq("organization_id", orgId)
      .eq("entity_type", "unit")
      .eq("local_id", unit.id)
      .maybeSingle();

    const unitData = {
      building_id: buildingRemoteId,
      name: unit.unit_number || `Einheit ${unit.floor || ""}`,
      floor: unit.floor,
      area_sqm: unit.area,
      updated_at: new Date().toISOString(),
    };

    if (existingUnitMap?.remote_id) {
      await admin.from("units").update(unitData).eq("id", existingUnitMap.remote_id);
      unitResults.push({ local_id: unit.id, remote_id: existingUnitMap.remote_id, action: "updated" });
    } else {
      const { data: newUnit } = await admin
        .from("units")
        .insert({ ...unitData, created_at: new Date().toISOString() })
        .select("id")
        .single();

      if (newUnit) {
        await admin.from("hausmeister_sync_map").insert({
          organization_id: orgId,
          entity_type: "unit",
          local_id: unit.id,
          remote_id: newUnit.id,
          sync_direction: "push",
        });
        unitResults.push({ local_id: unit.id, remote_id: newUnit.id, action: "created" });
      }
    }
  }

  // Update last_synced_at for building
  await admin
    .from("hausmeister_sync_map")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("organization_id", orgId)
    .eq("entity_type", "building")
    .eq("local_id", buildingId);

  return jsonResponse({
    success: true,
    company_id: companyRemoteId,
    building_id: buildingRemoteId,
    units_synced: unitResults.length,
    unit_results: unitResults,
  });
}

// ─── SYNC TASKS ─────────────────────────────────────────────────
async function syncTasks(admin: any, orgId: string, buildingId: string) {
  // Get the remote building ID
  const { data: buildingMap } = await admin
    .from("hausmeister_sync_map")
    .select("remote_id")
    .eq("organization_id", orgId)
    .eq("entity_type", "building")
    .eq("local_id", buildingId)
    .maybeSingle();

  if (!buildingMap?.remote_id) {
    return jsonResponse({ error: "Gebäude wurde noch nicht synchronisiert. Bitte zuerst Gebäude synchronisieren." }, 400);
  }

  // Get tasks assigned to caretakers for this building
  const { data: localTasks } = await admin
    .from("tasks")
    .select("id, title, description, status, priority, due_date, created_at, updated_at")
    .eq("building_id", buildingId)
    .eq("organization_id", orgId);

  const pushed: any[] = [];
  const pulled: any[] = [];

  // Push: Vermietify -> HausmeisterPro
  for (const task of (localTasks ?? [])) {
    const { data: taskMap } = await admin
      .from("hausmeister_sync_map")
      .select("remote_id, last_synced_at")
      .eq("organization_id", orgId)
      .eq("entity_type", "task")
      .eq("local_id", task.id)
      .maybeSingle();

    const taskData = {
      building_id: buildingMap.remote_id,
      title: task.title,
      description: task.description,
      status: mapStatusToHausmeister(task.status),
      priority: task.priority || "medium",
      due_date: task.due_date,
    };

    if (taskMap?.remote_id) {
      // Check if remote task was updated after last sync (pull)
      const { data: remoteTask } = await admin
        .from("tasks")
        .select("id, status, updated_at")
        .eq("id", taskMap.remote_id)
        .maybeSingle();

      if (remoteTask && remoteTask.updated_at > (taskMap.last_synced_at || "")) {
        // Pull remote status back to Vermietify
        const mappedStatus = mapStatusFromHausmeister(remoteTask.status);
        if (mappedStatus !== task.status) {
          await admin.from("tasks").update({ status: mappedStatus }).eq("id", task.id);
          pulled.push({ local_id: task.id, remote_id: taskMap.remote_id, new_status: mappedStatus });
        }
      }

      // Update remote task
      await admin.from("tasks").update({ ...taskData, updated_at: new Date().toISOString() }).eq("id", taskMap.remote_id);
      await admin.from("hausmeister_sync_map").update({ last_synced_at: new Date().toISOString() })
        .eq("organization_id", orgId).eq("entity_type", "task").eq("local_id", task.id);
      pushed.push({ local_id: task.id, remote_id: taskMap.remote_id, action: "updated" });
    } else {
      // Create task in HausmeisterPro
      const { data: newTask } = await admin
        .from("tasks")
        .insert({ ...taskData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select("id")
        .single();

      if (newTask) {
        await admin.from("hausmeister_sync_map").insert({
          organization_id: orgId,
          entity_type: "task",
          local_id: task.id,
          remote_id: newTask.id,
          sync_direction: "both",
        });
        pushed.push({ local_id: task.id, remote_id: newTask.id, action: "created" });
      }
    }
  }

  return jsonResponse({
    success: true,
    tasks_pushed: pushed.length,
    tasks_pulled: pulled.length,
    pushed,
    pulled,
  });
}

// ─── CHECK USER ─────────────────────────────────────────────────
async function checkUser(admin: any, email: string) {
  if (!email) {
    return jsonResponse({ error: "E-Mail erforderlich" }, 400);
  }

  // Check if user exists in auth
  const { data: users } = await admin.auth.admin.listUsers();
  const existingUser = users?.users?.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  );

  return jsonResponse({
    exists: !!existingUser,
    user_id: existingUser?.id || null,
  });
}

// ─── GET STATUS ─────────────────────────────────────────────────
async function getStatus(admin: any, orgId: string, buildingId: string) {
  const { data: mappings } = await admin
    .from("hausmeister_sync_map")
    .select("*")
    .eq("organization_id", orgId);

  const buildingMapping = mappings?.find(
    (m: any) => m.entity_type === "building" && m.local_id === buildingId
  );

  const companyMapping = mappings?.find(
    (m: any) => m.entity_type === "company"
  );

  const unitMappings = mappings?.filter(
    (m: any) => m.entity_type === "unit"
  ) ?? [];

  const taskMappings = mappings?.filter(
    (m: any) => m.entity_type === "task"
  ) ?? [];

  return jsonResponse({
    is_synced: !!buildingMapping,
    building: buildingMapping || null,
    company: companyMapping || null,
    units_synced: unitMappings.length,
    tasks_synced: taskMappings.length,
    last_synced_at: buildingMapping?.last_synced_at || null,
  });
}

// ─── HELPERS ────────────────────────────────────────────────────
function mapStatusToHausmeister(status: string): string {
  const map: Record<string, string> = {
    open: "open",
    todo: "open",
    in_progress: "in_progress",
    done: "completed",
    completed: "completed",
    cancelled: "completed",
  };
  return map[status] || "open";
}

function mapStatusFromHausmeister(status: string): string {
  const map: Record<string, string> = {
    open: "open",
    in_progress: "in_progress",
    completed: "done",
  };
  return map[status] || "open";
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "application/json",
    },
  });
}
