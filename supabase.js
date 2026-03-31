// Supabase Initialization and Sync Layer
const SUPABASE_URL = 'https://stcomjtuuuchdafssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

// Initialize the Supabase client
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized Successfully!");

// --- MANUAL CLOUD BACKUP UTILITY ---
// Used to backup the ENTIRE localStorage state to the Supabase snapshots table
window.migrateDataToSupabase = async function() {
    console.log("Starting Full Database Backup to Cloud...");
    
    let allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('manti_')) {
            let val = localStorage.getItem(key);
            try { allData[key] = JSON.parse(val); } 
            catch(e) { allData[key] = val; }
        }
    }

    // Store as a single text payload in the snapshots table
    const snapshot = {
        title: `Manual Cloud Backup - ${new Date().toLocaleDateString('en-IN')}`,
        date: new Date().toISOString(),
        html: JSON.stringify(allData),  // Payload stored in the generic 'html' text column
        type: 'Full System Backup'
    };

    const { error } = await supabase.from('snapshots').insert([snapshot]);
    
    if (error) {
        console.error("Backup Failed:", error);
        alert("Cloud Backup Failed. Please check console for details.");
    } else {
        alert("Success! Your entire database has been backed up to the cloud securely in a single move. You can verify this backup on Supabase any time in the future.");
    }
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

        // 3. Sync Settings and Universal Key-Value Store
        const { data: settingsData, error: setsErr } = await supabase.from('settings').select('*');
        if (!setsErr && settingsData) {
            settingsData.forEach(s => {
                // Safely update localStorage from the cloud backup
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

// --- AUTOMATED UNIVERSAL CLOUD SYNC INTERCEPTOR ---
// Overrides localStorage.setItem to push ALL data into Supabase's `settings` table as JSON live
const originalSetItem = localStorage.setItem;
window.mantiSyncPromises = [];

localStorage.setItem = function(key, value) {
    // 1. Immediately save locally for a fast UI
    originalSetItem.apply(this, arguments);

    // 2. Only sync our app's actual data state keys
    if (key.startsWith('manti_') && key !== 'manti_cloud_migrated') {
        let parsedVal;
        try {
            parsedVal = JSON.parse(value);
        } catch(e) {
            parsedVal = value; // String fallbacks
        }

        // Fire and forget upload to the universal Key-Value store
        const syncPromise = window.supabase.from('settings').upsert(
            { setting_key: key, setting_value: parsedVal, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
        ).then(({error}) => {
            if (error) console.error("Universal Cloud Sync Error for key:", key, error);
            else console.log(`✓ Live Sync: Saved ${key} to Supabase`);
        });

        window.mantiSyncPromises.push(syncPromise);
    }
};

window.awaitPendingSyncs = async function() {
    if (window.mantiSyncPromises.length > 0) {
        console.log(`Waiting for ${window.mantiSyncPromises.length} cloud syncs to finish...`);
        try {
            await Promise.all(window.mantiSyncPromises);
        } catch (e) {
            console.error("Some syncs failed:", e);
        }
        window.mantiSyncPromises = [];
    }
};

window.navigateAfterSync = async function(url) {
    if (window.mantiSyncPromises.length > 0) {
        document.body.style.opacity = '0.7';
        document.body.style.pointerEvents = 'none';
        let loadingEl = document.createElement('div');
        loadingEl.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#5454d4;color:white;padding:10px 20px;border-radius:20px;z-index:99999;font-weight:600;font-size:0.85rem;';
        loadingEl.textContent = 'Syncing to Cloud...';
        document.body.appendChild(loadingEl);
        await window.awaitPendingSyncs();
    }
    window.location.href = url;
};

// Initial sync on page load
document.addEventListener('DOMContentLoaded', () => {
    // Short delay to ensure Supabase client initializes
    setTimeout(window.syncDownFromSupabase, 200);
});
