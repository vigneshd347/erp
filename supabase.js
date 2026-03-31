// Supabase Initialization and Sync Layer
const SUPABASE_URL = 'https://stcomjtuuuchdafssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

// Initialize the Supabase client
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized Successfully!");

// --- DATA MIGRATION UTILITY ---
// Used once to migrate existing localStorage data to Supabase
window.migrateDataToSupabase = async function() {
    console.log("Starting Data Migration to Supabase...");
    let successCount = 0;
    
    // 1. Migrate Orders
    const orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    if (orders.length > 0) {
        // Map local format to DB format
        const dbOrders = orders.map(o => ({
            order_number: o.id,
            type: o.type,
            date: o.date,
            customer_name: o.customer,
            product_name: o.product,
            total_weight: parseFloat(o.weight),
            weight_unit: o.unit || 'g',
            remark: o.remark || '-'
        }));
        const { error } = await supabase.from('orders').upsert(dbOrders, { onConflict: 'order_number' });
        if(error) console.error("Error migrating orders:", error);
        else successCount++;
    }

    // 2. Migrate Job Works
    const jobs = JSON.parse(localStorage.getItem('manti_jobwork_records')) || [];
    if (jobs.length > 0) {
        const dbJobs = jobs.map(j => ({
            job_no: j.jobNo,
            date: j.date,
            worker_id: j.workerId,
            worker_name: j.workerName,
            item_name: j.itemName,
            process: j.process,
            issue_wt: parseFloat(j.issueWt) || null,
            receive_wt: parseFloat(j.receiveWt) || null
        }));
        await supabase.from('job_works').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
        const { error } = await supabase.from('job_works').insert(dbJobs);
        if(error) console.error("Error migrating job works:", error);
        else successCount++;
    }
    
    // Set migration flag so sync down knows it's safe to load empty cloud data
    localStorage.setItem('manti_cloud_migrated', 'true');

    alert("Migration complete! " + successCount + " collections migrated to Supabase. Your database is now leading.");
};

// --- OFFLINE-FIRST SYNC LAYER ---
// Pulls down authoritative cloud data and overrides localStorage to update the UI
window.syncDownFromSupabase = async function() {
    console.log("Starting Supabase Sync Down...");
    const isMigrated = localStorage.getItem('manti_cloud_migrated') === 'true';
    
    try {
        // 1. Sync Orders
        const { data: ordersData, error: ordersErr } = await supabase.from('orders').select('*');
        if (!ordersErr && ordersData) {
            // SAFEGUARD: Don't wipe local data with an empty cloud DB if migration hasn't happened
            if (ordersData.length > 0 || isMigrated) {
                const mappedOrders = ordersData.map(o => ({
                    id: o.order_number, type: o.type, date: o.date, dueDate: o.due_date, 
                    customer: o.customer_name, product: o.product_name, weight: o.total_weight, 
                    unit: o.weight_unit, remark: o.remark, timestamp: o.created_at
                }));
                // Bypass proxy to prevent infinite sync loops
                originalSetItem.call(localStorage, 'manti_order_records', JSON.stringify(mappedOrders));
            }
        }

        // 2. Sync Job Works
        const { data: jobsData, error: jobsErr } = await supabase.from('job_works').select('*');
        if (!jobsErr && jobsData) {
            // SAFEGUARD: Don't wipe local data with an empty cloud DB if migration hasn't happened
            if (jobsData.length > 0 || isMigrated) {
                const mappedJobs = jobsData.map(j => ({
                    jobNo: j.job_no, date: j.date, workerId: j.worker_id, workerName: j.worker_name,
                    itemName: j.item_name, process: j.process, issueWt: j.issue_wt, receiveWt: j.receive_wt
                }));
                originalSetItem.call(localStorage, 'manti_jobwork_records', JSON.stringify(mappedJobs));
            }
        }

        // 3. Sync Settings
        const { data: settingsData, error: setsErr } = await supabase.from('settings').select('*');
        if (!setsErr && settingsData) {
            settingsData.forEach(s => {
                localStorage.setItem(s.setting_key, JSON.stringify(s.setting_value));
            });
        }
        
        // 4. Sync Invoices
        const { data: invoicesData, error: invErr } = await supabase.from('invoices').select('*');
        if (!invErr && invoicesData && invoicesData.length > 0) {
            // Reconstruct the object map { "INV-1001": {...} }
            const invoiceMap = {};
            invoicesData.forEach(inv => {
                invoiceMap[inv.invoice_number] = {
                    invoiceData: { invoiceNum: inv.invoice_number, date: inv.date },
                    customerData: inv.customer_data,
                    items: inv.items,
                    totals: { subtotal: inv.subtotal, taxRate: inv.tax_rate, grandTotal: inv.total_amount },
                    paymentStatus: inv.payment_status
                };
            });
            localStorage.setItem('manti_saved_invoices', JSON.stringify(invoiceMap));
        }
        
        console.log("Supabase Sync Complete.");
        
        // Safely trigger UI re-renders if the functions exist
        if (typeof window.loadTable === 'function') setTimeout(window.loadTable, 100);
        if (typeof window.loadReport === 'function' && window._currentReportType) setTimeout(() => window.loadReport(window._currentReportType), 100);
        if (typeof window.loadJobData === 'function') setTimeout(window.loadJobData, 100);
    } catch(e) {
        console.error("Sync Failure:", e);
    }
};

// --- AUTOMATED CLOUD SYNC INTERCEPTOR (DISABLED) ---
// The user requested to remove automatic cloud database sync.
// We no longer proxy localStorage.setItem.

window.mantiSyncPromises = [];

window.awaitPendingSyncs = async function() {
    // No-op
};

window.navigateAfterSync = async function(url) {
    // Auto-sync is removed, simply navigate immediately
    window.location.href = url;
};

// Removed originalSetItem override to stop automatic syncing.

// Initial sync on page load
document.addEventListener('DOMContentLoaded', () => {
    // Short delay to ensure Supabase client initializes
    setTimeout(window.syncDownFromSupabase, 200);
});
