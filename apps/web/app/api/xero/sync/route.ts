import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { adminSupabase, getValidXeroConnection, xeroApi } from '@/lib/xero';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { connectionId, propertyId, direction = 'push', since } = await req.json();
    const admin = adminSupabase();
    let connId = connectionId;
    if (!connId && propertyId) {
      const { data } = await admin.from('xero_connections').select('id').eq('user_id', user.id).eq('property_id', propertyId).eq('status', 'active').maybeSingle();
      connId = data?.id;
    }
    if (!connId) return NextResponse.json({ error: 'No Xero connection found' }, { status: 400 });

    const { conn } = await getValidXeroConnection(connId);
    if (conn.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!conn.tenant_id) return NextResponse.json({ error: 'Xero tenant not linked' }, { status: 400 });

    const result: any = { pushed: 0, pulled: 0, errors: [] };

    if (direction === 'push' || direction === 'two_way') {
      // Push HomeHub expenses as Xero spend money/bills-like records (simplified as Invoices type ACCPAY via API pattern)
      let q = admin.from('expenses').select('id,title,amount_cents,created_at,property_id,category').limit(50);
      if (propertyId || conn.property_id) q = q.eq('property_id', propertyId || conn.property_id);
      if (since) q = q.gte('created_at', since);
      const { data: expenses } = await q;
      for (const e of expenses || []) {
        try {
          await xeroApi(conn.access_token, conn.tenant_id, '/Invoices', {
            method: 'POST',
            body: JSON.stringify({
              Invoices: [{
                Type: 'ACCPAY',
                Contact: { Name: 'HomeHub Vendor' },
                Date: (e.created_at || new Date().toISOString()).split('T')[0],
                DueDate: (e.created_at || new Date().toISOString()).split('T')[0],
                LineAmountTypes: 'NoTax',
                LineItems: [{ Description: e.title || 'Expense', Quantity: 1, UnitAmount: ((e.amount_cents || 0) / 100), AccountCode: process.env.XERO_EXPENSE_ACCOUNT_CODE || '400' }],
                Reference: `homehub-expense-${e.id}`,
                Status: 'DRAFT',
              }]
            })
          });
          result.pushed++;
        } catch (err: any) {
          // Xero rejects duplicates by reference in some flows? keep going
          result.errors.push({ id: e.id, error: err?.message || String(err) });
        }
      }
    }

    if (direction === 'pull' || direction === 'two_way') {
      // Pull recent payments/contacts as a foundation (store in sync_cursor / log; full mapping is app-specific)
      try {
        const payments = await xeroApi(conn.access_token, conn.tenant_id, '/Payments?page=1');
        result.pulled = (payments?.Payments || []).length;
        await admin.from('xero_connections').update({ last_sync_at: new Date().toISOString(), sync_cursor: { last_pull: new Date().toISOString(), payments_count: result.pulled } }).eq('id', conn.id);
      } catch (err: any) {
        result.errors.push({ pull: true, error: err?.message || String(err) });
      }
    }

    if (direction === 'push') {
      await admin.from('xero_connections').update({ last_sync_at: new Date().toISOString() }).eq('id', conn.id);
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Xero sync failed' }, { status: 500 });
  }
}
