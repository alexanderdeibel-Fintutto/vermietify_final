import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MatchRequest {
  // Single match
  transactionId?: string;
  // Bulk match
  bulk?: boolean;
  transactionIds?: string[];
  // Shared fields
  tenantId?: string;
  leaseId?: string;
  transactionType?: string;
  buildingId?: string;
  createRule?: boolean;
  ruleConditions?: Array<{ field: string; operator: string; value: string }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const body = await req.json() as MatchRequest;

    // Determine IDs to process
    const ids: string[] = body.bulk && body.transactionIds
      ? body.transactionIds
      : body.transactionId
        ? [body.transactionId]
        : [];

    if (ids.length === 0) throw new Error('No transaction IDs provided');

    // Build update payload – only set fields that are provided
    const updatePayload: Record<string, unknown> = {
      match_status: 'manual',
      match_confidence: 1.0,
      matched_at: new Date().toISOString(),
      matched_by: user.id,
    };

    if (body.tenantId) updatePayload.matched_tenant_id = body.tenantId;
    if (body.leaseId) updatePayload.matched_lease_id = body.leaseId;
    if (body.transactionType) updatePayload.transaction_type = body.transactionType;
    if (body.buildingId) updatePayload.matched_building_id = body.buildingId;

    // Process in batches of 100 to stay within Supabase limits
    const BATCH = 100;
    let updated = 0;

    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);

      // Verify ownership: all transactions must belong to user's org
      const { data: txs, error: verifyErr } = await supabase
        .from('bank_transactions')
        .select('id, account:bank_accounts!inner(connection:finapi_connections!inner(organization_id))')
        .in('id', batch);

      if (verifyErr) throw verifyErr;

      const validIds = (txs || [])
        .filter((t: any) => t.account.connection.organization_id === profile.organization_id)
        .map((t: any) => t.id);

      if (validIds.length > 0) {
        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update(updatePayload)
          .in('id', validIds);

        if (updateError) throw updateError;
        updated += validIds.length;
      }
    }

    // Create rule if requested
    let newRule = null;
    if (body.createRule && body.ruleConditions && body.ruleConditions.length > 0) {
      // Determine action type and config
      let actionType = 'book_as';
      let actionConfig: Record<string, unknown> = {};

      if (body.tenantId) {
        actionType = 'assign_tenant';
        actionConfig = { tenant_id: body.tenantId, lease_id: body.leaseId };
      }
      if (body.transactionType) {
        if (actionType === 'assign_tenant') {
          // Combined: tenant + type
          actionConfig.type = body.transactionType;
        } else {
          actionType = 'book_as';
          actionConfig = { type: body.transactionType };
        }
      }
      if (body.buildingId) {
        actionConfig.building_id = body.buildingId;
      }

      const ruleName = body.ruleConditions
        .map(c => c.value)
        .join(' + ');

      const { data: rule, error: ruleError } = await supabase
        .from('transaction_rules')
        .insert({
          organization_id: profile.organization_id,
          name: `Regel: ${ruleName}`,
          conditions: body.ruleConditions,
          action_type: actionType,
          action_config: actionConfig,
          match_count: updated,
          last_match_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!ruleError) newRule = rule;
    }

    return new Response(JSON.stringify({
      success: true,
      updated,
      rule: newRule,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error matching transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
