import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplyRequest {
  ruleId: string;
  transactionIds?: string[]; // if provided, only apply to these; otherwise preview all matches
  preview?: boolean; // if true, just return matching transactions without updating
}

function getFieldValue(transaction: Record<string, unknown>, field: string): string {
  // For matching, also search booking_text as fallback when the primary field is empty
  const primary = String(transaction[field] || '').toLowerCase();
  if (primary) return primary;
  
  // If the field is counterpart_name or purpose, fall back to booking_text
  if (field === 'counterpart_name' || field === 'purpose') {
    return String(transaction['booking_text'] || '').toLowerCase();
  }
  return '';
}

function matchesCondition(
  transaction: Record<string, unknown>,
  condition: { field: string; operator: string; value: string }
): boolean {
  const fieldValue = getFieldValue(transaction, condition.field);
  const matchValue = condition.value.toLowerCase();

  switch (condition.operator) {
    case 'equals':
      // For fallback fields (booking_text), use contains instead of strict equals
      if (!transaction[condition.field] && (condition.field === 'counterpart_name' || condition.field === 'purpose')) {
        return fieldValue.includes(matchValue);
      }
      return fieldValue === matchValue;
    case 'contains':
      return fieldValue.includes(matchValue);
    case 'starts_with':
      return fieldValue.startsWith(matchValue);
    default:
      return false;
  }
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

    const { ruleId, transactionIds, preview } = await req.json() as ApplyRequest;

    // Get the rule
    const { data: rule, error: ruleError } = await supabase
      .from('transaction_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (ruleError || !rule) throw new Error('Rule not found');

    // Fetch unmatched transactions for this org
    const { data: transactions, error: txError } = await supabase
      .from('bank_transactions')
      .select(`
        id, counterpart_name, counterpart_iban, purpose, amount_cents, booking_date, booking_text, match_status, currency,
        account:bank_accounts!inner(
          id, account_name, iban,
          connection:finapi_connections!inner(organization_id)
        )
      `)
      .in('match_status', ['unmatched'])
      .order('booking_date', { ascending: false });

    if (txError) throw txError;

    // Filter by organization
    const orgTransactions = (transactions || []).filter(
      (t: Record<string, unknown>) => {
        const account = t.account as { connection: { organization_id: string } };
        return account.connection.organization_id === profile.organization_id;
      }
    );

    // Apply rule conditions to find matches
    const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
    const matchingTransactions = orgTransactions.filter((t: Record<string, unknown>) =>
      conditions.every(c => matchesCondition(t, c))
    );

    // If specific IDs provided, filter to those
    const finalMatches = transactionIds
      ? matchingTransactions.filter((t: Record<string, unknown>) => transactionIds.includes(t.id as string))
      : matchingTransactions;

    if (preview) {
      return new Response(JSON.stringify({
        success: true,
        matches: finalMatches.map((t: Record<string, unknown>) => ({
          id: t.id,
          counterpart_name: t.counterpart_name,
          purpose: t.purpose,
          amount_cents: t.amount_cents,
          booking_date: t.booking_date,
          booking_text: t.booking_text,
        })),
        total: finalMatches.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply the rule: update all matching transactions
    const actionConfig = rule.action_config as Record<string, string>;
    const updateData: Record<string, unknown> = {
      match_status: 'auto',
      match_confidence: 0.95,
      matched_at: new Date().toISOString(),
      matched_by: user.id,
    };

    if (rule.action_type === 'assign_tenant' && actionConfig.tenant_id) {
      updateData.matched_tenant_id = actionConfig.tenant_id;
      updateData.matched_lease_id = actionConfig.lease_id || null;
      updateData.transaction_type = 'rent';
    } else if (rule.action_type === 'book_as') {
      updateData.transaction_type = actionConfig.type || 'other';
    } else if (rule.action_type === 'ignore') {
      updateData.match_status = 'ignored';
    }

    const matchIds = finalMatches.map((t: Record<string, unknown>) => t.id as string);
    
    if (matchIds.length > 0) {
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update(updateData)
        .in('id', matchIds);

      if (updateError) throw updateError;

      // Update rule match count
      await supabase
        .from('transaction_rules')
        .update({
          match_count: (rule.match_count || 0) + matchIds.length,
          last_match_at: new Date().toISOString(),
        })
        .eq('id', ruleId);
    }

    return new Response(JSON.stringify({
      success: true,
      applied: matchIds.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error applying rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
