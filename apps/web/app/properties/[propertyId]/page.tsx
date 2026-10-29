'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toCsv, downloadCsv, parseCsv } from '@homehub/shared';
import { useMembership } from '@/lib/useMembership';
import { NotificationsBell } from '@/components/NotificationsBell';

type Tab = 'overview' | 'bills' | 'inventory' | 'maintenance' | 'messages' | 'tenancy' | 'chores' | 'rules';

export default function PropertyPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [tab, setTab] = useState<Tab>('overview');
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('properties').select('*').eq('id', propertyId).single()
      .then(({ data }: { data: any }) => setProperty(data));
  }, [propertyId]);

  const tabs: Tab[] = ['overview', 'bills', 'inventory', 'maintenance', 'messages', 'tenancy', 'chores', 'rules'];

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <a href="/dashboard" className="text-sm text-slate-600 underline">← Back</a>
          <h1 className="text-2xl font-bold mt-2">{property?.name ?? 'Property'}</h1>
        </div>
        <NotificationsBell />
      </div>
      <p className="text-slate-600 mb-4">{property?.address}</p>

      <nav className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-slate-900 font-semibold' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <OverviewTab propertyId={propertyId} />}
      {tab === 'bills' && <BillsTab propertyId={propertyId} />}
      {tab === 'inventory' && <InventoryTab propertyId={propertyId} />}
      {tab === 'maintenance' && <MaintenanceTab propertyId={propertyId} />}
      {tab === 'messages' && <MessagesTab propertyId={propertyId} />}
      {tab === 'tenancy' && <TenancyTab propertyId={propertyId} />}
      {tab === 'chores' && <ChoresTab propertyId={propertyId} />}
      {tab === 'rules' && <RulesTab propertyId={propertyId} />}
    </main>
  );
}

function OverviewTab({ propertyId }: { propertyId: string }) {
  return <p className="text-slate-500">Overview — members, recent activity, and quick actions.</p>;
}

function BillsTab({ propertyId }: { propertyId: string }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('expenses').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setExpenses(data ?? []);
  }
  useEffect(() => { load(); }, [propertyId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('expenses').insert({
      property_id: propertyId, title, amount_cents: Math.round(Number(amount) * 100), created_by: user.id,
    });
    if (error) { alert(error.message); return; }
    setTitle(''); setAmount('');
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="border rounded p-2 flex-1" placeholder="Bill title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="border rounded p-2 w-32" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button className="bg-slate-900 text-white rounded px-4">Add bill</button>
      </form>
      <ul className="divide-y border rounded">
        {expenses.map((x) => (
          <li key={x.id} className="p-3 flex justify-between">
            <span>{x.title}</span>
            <span className="font-mono">${(x.amount_cents / 100).toFixed(2)} {x.status}</span>
          </li>
        ))}
        {expenses.length === 0 && <li className="p-3 text-slate-500">No bills yet.</li>}
      </ul>
    </div>
  );
}

function InventoryTab({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('inventory_items').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [propertyId]);

  async function scan() {
    if (!file) return;
    setScanning(true);
    try {
      const supabase = createClient();
      const path = `scans/${crypto.randomUUID()}-${file.name}`;
      await supabase.storage.from('inventory').upload(path, file);
      const { data: scan } = await supabase.from('inventory_scans').insert({ property_id: propertyId, storage_path: path }).select().single() as { data: any };
      await supabase.functions.invoke('scan-inventory', { body: { scanId: scan.id } });
      let done = false;
      for (let i = 0; i < 30 && !done; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const { data: s } = await supabase.from('inventory_scans').select('status,result').eq('id', scan.id).single() as { data: any };
        if (s?.status === 'done') {
          done = true;
          const detected = (s.result?.items ?? []) as any[];
          const { data: { user } } = await supabase.auth.getUser();
          for (const it of detected) {
            await supabase.from('inventory_items').insert({
              property_id: propertyId, name: it.name, brand: it.brand, model_number: it.modelNumber,
              serial_number: it.serialNumber, category: it.category, condition: it.condition,
              replacement_value_cents: it.estimatedReplacementValueCents, ai_confidence: it.confidence,
              ai_raw: it, created_by: user?.id,
            });
          }
          load();
          alert(`Scan complete: ${detected.length} items added as drafts.`);
        } else if (s?.status === 'failed') {
          throw new Error(s.result?.error ?? 'scan failed');
        }
      }
      if (!done) alert('Scan timed out; check back later.');
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setScanning(false);
      setFile(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={scan} disabled={!file || scanning} className="bg-slate-900 text-white rounded px-4 py-2 disabled:opacity-50">
          {scanning ? 'Scanning…' : 'AI Scan photo'}
        </button>
        <button onClick={() => {
          const rows = items.map((it) => ({
            name: it.name, brand: it.brand ?? '', modelNumber: it.model_number ?? '',
            serialNumber: it.serial_number ?? '', category: it.category, condition: it.condition,
            replacementValueCents: it.replacement_value_cents ?? 0, tags: (it.tags ?? []).join(';'),
          }));
          downloadCsv('homehub-inventory.csv', toCsv(rows));
        }} className="border rounded px-3 py-2 text-sm">Export CSV</button>
        <button onClick={() => {
          const rows = items.map((it) => ({
            itemName: it.name, brand: it.brand ?? '', model: it.model_number ?? '',
            serial: it.serial_number ?? '', category: it.category, condition: it.condition,
            replacementCost: ((it.replacement_value_cents ?? 0) / 100).toFixed(2),
            purchaseDate: it.purchase_date ?? '', warrantyExpiry: it.warranty_expiry ?? '',
          }));
          downloadCsv('homehub-insurance-claim.csv', toCsv(rows));
        }} className="border rounded px-3 py-2 text-sm">Export claim CSV</button>
        <button onClick={async () => {
          const supabase = createClient();
          const { data, error } = await supabase.functions.invoke('generate-claim-pdf', { body: { propertyId } });
          if (error) { alert(error.message); return; }
          const blob = new Blob([data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'homehub-claim.pdf'; a.click();
          URL.revokeObjectURL(url);
        }} className="border rounded px-3 py-2 text-sm">Generate claim PDF</button>
        <label className="border rounded px-3 py-2 text-sm cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const text = await f.text();
            const rows = parseCsv(text);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            let n = 0;
            for (const r of rows) {
              const { error } = await supabase.from('inventory_items').insert({
                property_id: propertyId,
                name: r.name || r.Name,
                brand: r.brand || r.Brand || null,
                model_number: r.modelNumber || r.model_number || null,
                serial_number: r.serialNumber || r.serial_number || null,
                category: (r.category || r.Category || 'other'),
                condition: (r.condition || r.Condition || 'good'),
                replacement_value_cents: Number(r.replacementValueCents || r.replacement_value_cents || 0),
                created_by: user?.id,
              });
              if (!error) n++;
            }
            alert(`Imported ${n} of ${rows.length} rows.`);
            load();
            e.target.value = '';
          }} />
        </label>
      </div>
      <ul className="divide-y border rounded">
        {items.map((it) => (
          <li key={it.id} className="p-3">
            <div className="font-semibold">{it.name} {it.brand ? `· ${it.brand}` : ''}</div>
            <div className="text-sm text-slate-600">
              {it.category} · {it.condition} · ${((it.replacement_value_cents ?? 0) / 100).toFixed(2)} est. replacement
              {it.model_number ? ` · model ${it.model_number}` : ''}
              {it.serial_number ? ` · SN ${it.serial_number}` : ''}
              {it.purchase_price_cents ? ` · purchased $${(it.purchase_price_cents/100).toFixed(2)}` : ''}
              {it.warranty_expiry ? ` · warranty ${new Date(it.warranty_expiry).toLocaleDateString()}${new Date(it.warranty_expiry) < new Date(Date.now() + 30*86400000) ? ' ⚠️' : ''}` : ''}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-3 text-slate-500">No inventory yet. Scan a photo to start.</li>}
      </ul>
    </div>
  );
}

function MaintenanceTab({ propertyId }: { propertyId: string }) {
  const { role } = useMembership(propertyId);
  const [tickets, setTickets] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [quoteAmount, setQuoteAmount] = useState<Record<string, string>>({});
  const [invoiceAmount, setInvoiceAmount] = useState<Record<string, string>>({});

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('maintenance_tickets').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setTickets(data ?? []);
  }
  useEffect(() => { load(); }, [propertyId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: t, error } = await supabase.from('maintenance_tickets').insert({
      property_id: propertyId, title, description: desc, raised_by: user.id,
    }).select().single() as { data: any; error: any };
    if (error) { alert(error.message); return; }
    // trigger AI diagnosis via edge function (fire-and-forget)
    supabase.functions.invoke('diagnose-damage', { body: { ticketId: t.id } }).catch(() => {});
    setTitle(''); setDesc('');
    setTickets((prev) => [t, ...prev]);
  }

  async function updateStatus(ticketId: string, status: string, extra: Record<string, any> = {}) {
    const supabase = createClient();
    await supabase.from('maintenance_tickets').update({ status, ...extra }).eq('id', ticketId);
    load();
  }

  async function submitQuote(ticketId: string) {
    const amt = quoteAmount[ticketId];
    if (!amt) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('ticket_quotes').insert({
      ticket_id: ticketId, contractor_id: user.id, amount_cents: Math.round(Number(amt) * 100),
    });
    if (error) { alert(error.message); return; }
    await updateStatus(ticketId, 'quoted');
    setQuoteAmount((p) => ({ ...p, [ticketId]: '' }));
  }

  async function submitInvoice(ticketId: string) {
    const amt = invoiceAmount[ticketId];
    if (!amt) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const cents = Math.round(Number(amt) * 100);
    const { error } = await supabase.from('ticket_invoices').insert({
      ticket_id: ticketId, contractor_id: user.id, amount_cents: cents, total_cents: cents,
    });
    if (error) { alert(error.message); return; }
    await updateStatus(ticketId, 'invoiced');
    setInvoiceAmount((p) => ({ ...p, [ticketId]: '' }));
  }

  async function approveInvoice(invoiceId: string, ticketId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ticket_invoices').update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() }).eq('id', invoiceId);
    load();
  }

  async function checkin(ticketId: string, type: 'checkin' | 'checkout') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let location: any = null;
    try {
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      location = `POINT(${pos.coords.longitude} ${pos.coords.latitude})`;
    } catch { /* no geo */ }
    await supabase.from('ticket_checkins').insert({
      ticket_id: ticketId, contractor_id: user.id, type, location, notes: type,
    });
    if (type === 'checkin') await updateStatus(ticketId, 'in_progress', { started_at: new Date().toISOString() });
    else await updateStatus(ticketId, 'completed', { completed_at: new Date().toISOString() });
  }

  const isManager = role === 'landlord' || role === 'agent';
  const isContractor = role === 'contractor';

  return (
    <div>
      <form onSubmit={add} className="space-y-2 mb-4">
        <input className="w-full border rounded p-2" placeholder="Issue title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="w-full border rounded p-2" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button className="bg-slate-900 text-white rounded px-4 py-2">Raise ticket</button>
      </form>
      <ul className="divide-y border rounded">
        {tickets.map((t) => (
          <li key={t.id} className="p-3">
            <div className="font-semibold">{t.title} <span className="text-xs text-slate-500">· {t.status} · {t.priority}</span></div>
            <div className="text-sm text-slate-600">{t.description}</div>
            {t.ai_severity && <div className="text-xs text-indigo-600 mt-1">AI: {t.ai_severity} · {t.ai_trade_suggestion} · ${(t.ai_cost_min_cents/100).toFixed(0)}–${(t.ai_cost_max_cents/100).toFixed(0)}</div>}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {isManager && t.status === 'open' && <button onClick={() => updateStatus(t.id, 'triaged')} className="border rounded px-2 py-1">Triage</button>}
              {isManager && t.status === 'quoted' && <button onClick={() => updateStatus(t.id, 'approved')} className="border rounded px-2 py-1">Approve quote</button>}
              {isManager && (t.status === 'approved' || t.status === 'scheduled') && <button onClick={() => updateStatus(t.id, 'scheduled')} className="border rounded px-2 py-1">Schedule</button>}
              {isContractor && (t.status === 'approved' || t.status === 'open' || t.status === 'triaged') && (
                <>
                  <input className="border rounded px-2 py-1 w-24" placeholder="Quote $" value={quoteAmount[t.id] ?? ''} onChange={(e) => setQuoteAmount((p) => ({ ...p, [t.id]: e.target.value }))} />
                  <button onClick={() => submitQuote(t.id)} className="border rounded px-2 py-1">Submit quote</button>
                </>
              )}
              {isContractor && t.status === 'scheduled' && <button onClick={() => checkin(t.id, 'checkin')} className="border rounded px-2 py-1">Check in</button>}
              {isContractor && t.status === 'in_progress' && <button onClick={() => checkin(t.id, 'checkout')} className="border rounded px-2 py-1">Check out</button>}
              {isContractor && t.status === 'completed' && (
                <>
                  <input className="border rounded px-2 py-1 w-24" placeholder="Invoice $" value={invoiceAmount[t.id] ?? ''} onChange={(e) => setInvoiceAmount((p) => ({ ...p, [t.id]: e.target.value }))} />
                  <button onClick={() => submitInvoice(t.id)} className="border rounded px-2 py-1">Submit invoice</button>
                </>
              )}
              {isManager && t.status === 'completed' && <button onClick={() => updateStatus(t.id, 'invoiced')} className="border rounded px-2 py-1">Mark invoiced</button>}
              {isManager && t.status === 'invoiced' && <button onClick={() => updateStatus(t.id, 'closed')} className="border rounded px-2 py-1">Close</button>}
            </div>
          </li>
        ))}
        {tickets.length === 0 && <li className="p-3 text-slate-500">No tickets yet.</li>}
      </ul>
    </div>
  );
}

function MessagesTab({ propertyId }: { propertyId: string }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');

  async function loadThreads() {
    const supabase = createClient();
    const { data } = await supabase.from('message_threads').select('*').eq('property_id', propertyId).order('last_message_at', { ascending: false, nullsFirst: false }) as { data: any };
    setThreads(data ?? []);
  }
  useEffect(() => { loadThreads(); }, [propertyId]);

  async function loadMessages(threadId: string) {
    const supabase = createClient();
    const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }) as { data: any };
    setMessages(data ?? []);
  }
  useEffect(() => {
    if (!active) return;
    loadMessages(active);
    const supabase = createClient();
    const channel = supabase.channel(`thread:${active}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${active}` },
        (payload: any) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active]);

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: t } = await supabase.from('message_threads').insert({
      property_id: propertyId, context_type: 'general', title: title || 'General', created_by: user.id,
    }).select().single() as { data: any };
    setTitle('');
    loadThreads();
    if (t) setActive(t.id);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !body.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('messages').insert({ thread_id: active, sender_id: user.id, body });
    setBody('');
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 border rounded p-3">
        <form onSubmit={createThread} className="flex gap-1 mb-3">
          <input className="border rounded p-1 flex-1 text-sm" placeholder="New thread title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="bg-slate-900 text-white rounded px-2 text-sm">+</button>
        </form>
        <ul className="space-y-1">
          {threads.map((t) => (
            <li key={t.id}>
              <button onClick={() => setActive(t.id)} className={`w-full text-left p-2 rounded text-sm ${active === t.id ? 'bg-slate-200 font-semibold' : 'hover:bg-slate-50'}`}>
                {t.title ?? t.context_type}
              </button>
            </li>
          ))}
          {threads.length === 0 && <li className="text-slate-500 text-sm">No threads yet.</li>}
        </ul>
      </div>
      <div className="col-span-2 border rounded p-3 flex flex-col">
        {!active ? <p className="text-slate-500 text-sm">Select or create a thread.</p> : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-96">
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="text-slate-500">{new Date(m.created_at).toLocaleTimeString()} </span>
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <p className="text-slate-500 text-sm">No messages yet.</p>}
            </div>
            <form onSubmit={send} className="flex gap-2">
              <input className="border rounded p-2 flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" />
              <button className="bg-slate-900 text-white rounded px-4">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function TenancyTab({ propertyId }: { propertyId: string }) {
  const [leases, setLeases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [riArea, setRiArea] = useState('');
  const [riItem, setRiItem] = useState('');
  const [riCondition, setRiCondition] = useState('good');
  const [riNotes, setRiNotes] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rent, setRent] = useState('');
  const [selectedLease, setSelectedLease] = useState<string | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);

  async function load() {
    const supabase = createClient();
    const { data: l } = await supabase.from('leases').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setLeases(l ?? []);
    const { data: r } = await supabase.from('condition_reports').select('*').eq('property_id', propertyId).order('conducted_at', { ascending: false }) as { data: any };
    setReports(r ?? []);
  }
  useEffect(() => { load(); }, [propertyId]);
  useEffect(() => {
    if (!selectedReport) { setReportItems([]); return; }
    const supabase = createClient();
    supabase.from('condition_report_items').select('*').eq('report_id', selectedReport).order('created_at')
      .then(({ data }: { data: any }) => setReportItems(data ?? []));
  }, [selectedReport]);

  async function createLease(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from('leases').insert({
      property_id: propertyId, tenant_id: tenantId, start_date: start, end_date: end,
      rent_cents: Math.round(Number(rent) * 100),
    });
    if (error) { alert(error.message); return; }
    setTenantId(''); setStart(''); setEnd(''); setRent('');
    load();
  }

  async function createReport(type: 'move_in' | 'move_out') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('condition_reports').insert({
      property_id: propertyId, type, conducted_by: user?.id,
    });
    if (error) alert(error.message);
    load();
  }

  async function loadLedger(leaseId: string) {
    setSelectedLease(leaseId);
    const supabase = createClient();
    const { data } = await supabase.from('rent_ledger').select('*').eq('lease_id', leaseId).order('due_date') as { data: any };
    setLedger(data ?? []);
  }

  async function runAiDiff() {
    const moveIn = reports.find((r) => r.type === 'move_in');
    const moveOut = reports.find((r) => r.type === 'move_out');
    if (!moveIn || !moveOut) { alert('Need both move-in and move-out reports.'); return; }
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('compare-condition', { body: { moveInReportId: moveIn.id, moveOutReportId: moveOut.id } });
    if (error) { alert(error.message); return; }
    alert('AI diff complete. See move-out report items.');
    load();
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold mb-2">Leases</h2>
        <form onSubmit={createLease} className="flex flex-wrap gap-2 mb-3">
          <input className="border rounded p-2" placeholder="Tenant user UUID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required />
          <input className="border rounded p-2" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          <input className="border rounded p-2" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          <input className="border rounded p-2 w-28" placeholder="Rent $" value={rent} onChange={(e) => setRent(e.target.value)} required />
          <button className="bg-slate-900 text-white rounded px-4">Create lease</button>
        </form>
        <ul className="divide-y border rounded">
          {leases.map((l) => (
            <li key={l.id} className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{l.status} · ${ (l.rent_cents/100).toFixed(2) }/{l.rent_period}</div>
                  <div className="text-xs text-slate-500">{l.start_date} → {l.end_date} · bond ${( (l.bond_cents ?? 0)/100).toFixed(2)} {l.bond_lodged_ref ? `· ref ${l.bond_lodged_ref}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadLedger(l.id)} className="text-xs border rounded px-2 py-1">Ledger</button>
                </div>
              </div>
            </li>
          ))}
          {leases.length === 0 && <li className="p-3 text-slate-500 text-sm">No leases yet.</li>}
        </ul>
        {selectedLease && (
          <div className="mt-3">
            <h3 className="font-semibold text-sm mb-1">Rent ledger</h3>
            <ul className="divide-y border rounded">
              {ledger.map((e) => (
                <li key={e.id} className="p-2 text-sm flex justify-between">
                  <span>{e.due_date}</span>
                  <span>${(e.amount_cents/100).toFixed(2)} · paid ${(e.paid_cents/100).toFixed(2)} · {e.status}</span>
                </li>
              ))}
              {ledger.length === 0 && <li className="p-2 text-slate-500 text-sm">No entries.</li>}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Condition reports</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => createReport('move_in')} className="border rounded px-3 py-1 text-sm">+ Move-in report</button>
          <button onClick={() => createReport('move_out')} className="border rounded px-3 py-1 text-sm">+ Move-out report</button>
          <button onClick={runAiDiff} className="bg-indigo-600 text-white rounded px-3 py-1 text-sm">AI wear vs damage diff</button>
        </div>
        <ul className="divide-y border rounded">
          {reports.map((r) => (
            <li key={r.id} className={`p-3 text-sm cursor-pointer ${selectedReport === r.id ? 'bg-slate-100' : ''}`} onClick={() => setSelectedReport(r.id)}>
              <div className="font-semibold">{r.type} · {r.status} · {new Date(r.conducted_at).toLocaleDateString()}</div>
              {r.ai_summary && <pre className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{JSON.stringify(r.ai_summary, null, 2)}</pre>}
            </li>
          ))}
          {reports.length === 0 && <li className="p-3 text-slate-500 text-sm">No reports yet.</li>}
        </ul>
        {selectedReport && (
          <div className="mt-3 border rounded p-3">
            <h3 className="font-semibold text-sm mb-2">Items for selected report</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const supabase = createClient();
              await supabase.from('condition_report_items').insert({
                report_id: selectedReport, area: riArea, item: riItem, condition: riCondition, notes: riNotes,
              });
              setRiArea(''); setRiItem(''); setRiNotes('');
              const { data } = await supabase.from('condition_report_items').select('*').eq('report_id', selectedReport).order('created_at') as { data: any };
              setReportItems(data ?? []);
            }} className="flex flex-wrap gap-2 mb-3">
              <input className="border rounded p-1 text-sm" placeholder="Area" value={riArea} onChange={(e) => setRiArea(e.target.value)} required />
              <input className="border rounded p-1 text-sm" placeholder="Item" value={riItem} onChange={(e) => setRiItem(e.target.value)} required />
              <select className="border rounded p-1 text-sm" value={riCondition} onChange={(e) => setRiCondition(e.target.value)}>
                <option value="new">new</option><option value="good">good</option><option value="fair">fair</option><option value="poor">poor</option><option value="damaged">damaged</option>
              </select>
              <input className="border rounded p-1 text-sm flex-1" placeholder="Notes" value={riNotes} onChange={(e) => setRiNotes(e.target.value)} />
              <button className="bg-slate-900 text-white rounded px-3 text-sm">Add item</button>
            </form>
            <ul className="divide-y">
              {reportItems.map((it) => (
                <li key={it.id} className="py-1 text-sm">
                  <span className="font-medium">{it.area}</span> — {it.item} · {it.condition}
                  {it.ai_flag && <span className={`ml-2 text-xs ${it.ai_flag === 'damage' ? 'text-red-600' : it.ai_flag === 'wear_and_tear' ? 'text-amber-600' : 'text-green-600'}`}>[{it.ai_flag}]</span>}
                  {it.notes && <span className="text-slate-500"> · {it.notes}</span>}
                </li>
              ))}
              {reportItems.length === 0 && <li className="text-slate-500 text-sm">No items.</li>}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function ChoresTab({ propertyId }: { propertyId: string }) {
  const [chores, setChores] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState('');

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('chores').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setChores(data ?? []);
  }
  useEffect(() => { load(); }, [propertyId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const ids = members.split(',').map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from('chores').insert({
      property_id: propertyId, title, rotation_member_ids: ids, current_assignee: ids[0] ?? null,
    });
    if (error) { alert(error.message); return; }
    setTitle(''); setMembers('');
    load();
  }

  async function complete(choreId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const chore = chores.find((c) => c.id === choreId);
    const ids: string[] = chore?.rotation_member_ids ?? [];
    const idx = ids.indexOf(chore?.current_assignee);
    const next = ids.length ? ids[(idx + 1) % ids.length] : null;
    await supabase.from('chores').update({ status: 'done', completed_by: user?.id, completed_at: new Date().toISOString(), current_assignee: next }).eq('id', choreId);
    load();
  }

  return (
    <div>
      <form onSubmit={add} className="flex flex-wrap gap-2 mb-4">
        <input className="border rounded p-2 flex-1" placeholder="Chore title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="border rounded p-2 flex-1" placeholder="Member UUIDs (comma-separated)" value={members} onChange={(e) => setMembers(e.target.value)} />
        <button className="bg-slate-900 text-white rounded px-4 py-2">Add chore</button>
      </form>
      <ul className="divide-y border rounded">
        {chores.map((c) => (
          <li key={c.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{c.title} <span className="text-xs text-slate-500">· {c.status}</span></div>
              <div className="text-xs text-slate-500">Assignee: {c.current_assignee ?? '—'}</div>
            </div>
            {c.status !== 'done' && <button onClick={() => complete(c.id)} className="border rounded px-2 py-1 text-xs">Mark done</button>}
          </li>
        ))}
        {chores.length === 0 && <li className="p-3 text-slate-500 text-sm">No chores yet.</li>}
      </ul>
    </div>
  );
}

function RulesTab({ propertyId }: { propertyId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [signed, setSigned] = useState<Record<string, boolean>>({});

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('house_rules').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }) as { data: any };
    setRules(data ?? []);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: sigs } = await supabase.from('rule_signatures').select('rule_id').eq('user_id', user.id) as { data: any };
      const map: Record<string, boolean> = {};
      (sigs ?? []).forEach((s: any) => { map[s.rule_id] = true; });
      setSigned(map);
    }
  }
  useEffect(() => { load(); }, [propertyId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('house_rules').insert({ property_id: propertyId, title, body, created_by: user?.id });
    if (error) { alert(error.message); return; }
    setTitle(''); setBody('');
    load();
  }

  async function sign(ruleId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('rule_signatures').insert({ rule_id: ruleId, user_id: user.id });
    if (error) { alert(error.message); return; }
    setSigned((p) => ({ ...p, [ruleId]: true }));
  }

  return (
    <div>
      <form onSubmit={create} className="space-y-2 mb-4">
        <input className="w-full border rounded p-2" placeholder="Rule title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="w-full border rounded p-2" placeholder="Rule body" value={body} onChange={(e) => setBody(e.target.value)} required rows={4} />
        <button className="bg-slate-900 text-white rounded px-4 py-2">Publish rule</button>
      </form>
      <ul className="space-y-3">
        {rules.map((r) => (
          <li key={r.id} className="border rounded p-3">
            <div className="font-semibold">{r.title} <span className="text-xs text-slate-500">v{r.version}</span></div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">{r.body}</p>
            <div className="mt-2">
              {signed[r.id]
                ? <span className="text-xs text-green-600">✓ Signed by you</span>
                : <button onClick={() => sign(r.id)} className="border rounded px-2 py-1 text-xs">Sign</button>}
            </div>
          </li>
        ))}
        {rules.length === 0 && <li className="text-slate-500 text-sm">No house rules yet.</li>}
      </ul>
    </div>
  );
}
