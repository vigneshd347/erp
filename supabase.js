// Supabase Initialization and Sync Layer
const SUPABASE_URL = 'https://stcomjtuuuchdafhssgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0Y29tanR1dXVjaGRhZmhzc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg2NDYsImV4cCI6MjA5MDM3NDY0Nn0.scmi8txiJEd334girnUK3EXGLFM6vvqPekRzE2DDaC0';

// Initialize the Supabase client
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Client Initialized Successfully!");

// --- DATA MIGRATION UTILITY ---
// Used once to migrate existing localStorage data to Supabase
window.migrateDataToSupabase = async function () {
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
        if (error) console.error("Error migrating orders:", error);
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
        if (error) console.error("Error migrating job works:", error);
        else successCount++;
    }

    // Set migration flag so sync down knows it's safe to load empty cloud data
    localStorage.setItem('manti_cloud_migrated', 'true');

    alert("Migration complete! " + successCount + " collections migrated to Supabase. Your database is now leading.");
};

// --- OFFLINE-FIRST SYNC LAYER ---
// Pulls down authoritative cloud data and overrides localStorage to update the UI
// --- OPTION B: FULL CLOUD MIGRATION (EPHEMERAL RAM CACHE) ---
// The user requested NO DATA STORED ON DEVICE.
// We intercept all localStorage calls, reroute them to a RAM Map,
// clear the physical disk, and force a cloud fetch on every single page load.

// 1. Wipe all local data to guarantee compliance with "no data stored on device"
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('manti_')) {
        localStorage.removeItem(key);
    }
});

// 2. In-Memory Ephemeral Storage
window.ERP_MEMORY = new Map();
window.mantiSyncPromises = [];

const originalGetItem = Storage.prototype.getItem;
const originalSetItem = Storage.prototype.setItem;

function updateSyncIndicator() {
    let indicator = document.getElementById('manti-sync-indicator');
    if (window.mantiSyncPromises.length > 0) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'manti-sync-indicator';
            indicator.innerHTML = '<style>@keyframes spin { 100% { transform: rotate(360deg); } }</style><div style="width: 16px; height: 16px; border: 2px solid #e0e7ff; border-top-color: #5454d4; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;"></div><span style="vertical-align: middle;">Syncing to Cloud...</span>';
            indicator.style = 'position: fixed; bottom: 20px; right: 20px; background: white; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: Inter, sans-serif; font-size: 0.9rem; font-weight: 600; color: #5454d4; z-index: 999999; border: 1px solid #e0e7ff; transition: opacity 0.3s ease;';
            if (document.body) document.body.appendChild(indicator);
        } else {
            indicator.style.opacity = '1';
        }
    } else {
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => { if (window.mantiSyncPromises.length === 0 && indicator) indicator.remove(); }, 300);
        }
    }
}

window.addEventListener('beforeunload', (e) => {
    if (window.mantiSyncPromises && window.mantiSyncPromises.length > 0) {
        e.preventDefault();
        e.returnValue = 'Syncing data to cloud. Please wait...';
        return 'Syncing data to cloud. Please wait...';
    }
});

Storage.prototype.getItem = function (key) {
    if (key.startsWith('manti_')) {
        return window.ERP_MEMORY.get(key) || null;
    }
    return originalGetItem.call(this, key);
};

Storage.prototype.setItem = function (key, value) {
    if (key === 'manti_cloud_migrated' || key.startsWith('manti_scroll_') || key.startsWith('manti_val_')) {
        return originalSetItem.call(this, key, value);
    }
    if (key.startsWith('manti_')) {
        // Save to RAM only
        window.ERP_MEMORY.set(key, value);

        try {
            const parsedData = JSON.parse(value);
            const promise = syncKeyToSupabase(key, parsedData);
            window.mantiSyncPromises.push(promise);
            updateSyncIndicator();
            promise.finally(() => {
                window.mantiSyncPromises = window.mantiSyncPromises.filter(p => p !== promise);
                updateSyncIndicator();
            });
        } catch (e) {
            console.error("Failed to parse data for cloud push", e);
        }
        return;
    }
    originalSetItem.call(this, key, value);
};

window.awaitPendingSyncs = async function () {
    if (window.mantiSyncPromises.length > 0) {
        document.body.style.opacity = '0.5';
        document.body.style.pointerEvents = 'none';
        try { await Promise.allSettled(window.mantiSyncPromises); } catch (e) { }
        document.body.style.opacity = '1';
        document.body.style.pointerEvents = 'auto';
    }
};

window.navigateAfterSync = async function (url) {
    const btn = document.activeElement;
    if (btn && btn.tagName === 'BUTTON') {
        btn.disabled = true;
        btn.innerText = 'Syncing to Cloud...';
    }
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 4000));
    await Promise.race([window.awaitPendingSyncs(), timeoutPromise]);
    window.location.href = url;
};

// Map Local Data to SQL Schema and Upload (Unchanged from before)
async function syncKeyToSupabase(key, data) {
    if (!data) return;
    try {
        if (key === 'manti_order_records') {
            const dbOrders = data.map(o => {
                const extendedData = {
                    items: o.items || [],
                    category: o.category || '',
                    assetType: o.assetType || '',
                    mainMetalType: o.mainMetalType || '',
                    billNo: o.billNo || '',
                    mcPercent: o.mcPercent || '',
                    mcAmount: o.mcAmount || '',
                    remark: o.remark || '-'
                };
                return {
                    order_number: o.id, type: o.type, date: o.date, due_date: o.dueDate || null,
                    customer_name: o.customer || '', vendor_id: o.vendor || '', product_name: o.product || '',
                    total_weight: parseFloat(o.qty || o.weight) || 0, weight_unit: 'g', remark: JSON.stringify(extendedData),
                    total_amount: parseFloat(o.amount) || 0, paid_amount: parseFloat(o.paidAmount) || 0,
                    status: o.status || 'Draft'
                };
            });
            if (dbOrders.length > 0) {
                const { error } = await supabase.from('orders').upsert(dbOrders, { onConflict: 'order_number' });
                if (error) { console.error("Orders Sync Error:", error); alert("Failed to save Orders to Cloud: " + error.message); }
            }
        } else if (key === 'manti_jobwork_records') {
            const dbJobs = data.map(j => ({
                job_no: j.jobNo || j.jobnum, date: j.date, worker_id: j.workerId || '', worker_name: j.workerName || '',
                item_name: j.itemName || j.product || '', process: j.process, issue_wt: parseFloat(j.issueWt) || null,
                receive_wt: parseFloat(j.receiveWt) || null
            }));
            if (dbJobs.length > 0) {
                const { error: delErr } = await supabase.from('job_works').delete().neq('worker_id', 'NON_EXISTENT_MAGIC_STRING');
                if (delErr) { console.error("Job Works Sync Error:", delErr); alert("Failed to clear Job Works for sync: " + delErr.message); }
                const { error } = await supabase.from('job_works').insert(dbJobs);
                if (error) { console.error("Job Works Sync Error:", error); alert("Failed to save Job Works to Cloud: " + error.message); }
            }
        } else if (key === 'manti_saved_invoices') {
            const dbInvoices = Object.values(data).map(inv => ({
                invoice_number: inv.invoiceData.invoiceNum, date: inv.invoiceData.date, customer_data: inv.customerData || {},
                items: inv.items || [], subtotal: parseFloat(inv.totals?.subtotal?.replace(/[^0-9.-]+/g, "")) || 0,
                tax_rate: parseFloat(inv.totals?.taxRate) || 0, total_amount: parseFloat(inv.totals?.grandTotal?.replace(/[^0-9.-]+/g, "")) || 0,
                payment_status: inv.paymentStatus || 'Unpaid'
            }));
            if (dbInvoices.length > 0) {
                const { error } = await supabase.from('invoices').upsert(dbInvoices, { onConflict: 'invoice_number' });
                if (error) { console.error("Invoices Sync Error:", error); alert("Failed to save Invoices to Cloud: " + error.message); }
            }
        } else if (key === 'manti_vendor_kyc_records') {
            const dbVendors = data.map(v => ({
                id: v.id, date: v.date || null, name: v.name || '', mobile: v.mobile || '', email: v.email || null,
                company_type: v.type || null, address: v.address || null, city: v.city || null, state: v.state || null,
                pin: v.pin || null, gst: v.gst || null, pan: v.pan || null, msme: v.msme || null, bank_name: v.bankName || null,
                bank_branch: v.bankBranch || null, bank_acc: v.bankAcc || null, bank_ifsc: v.bankIfsc || null, bank_upi: v.bankUpi || null
            }));
            if (dbVendors.length > 0) {
                const { error } = await supabase.from('vendor_kyc').upsert(dbVendors, { onConflict: 'id' });
                if (error) { console.error("Vendor KYC Sync Error:", error); alert("Failed to save Vendor KYC to Cloud: " + error.message); }
            }
        } else if (key === 'manti_supplier_kyc_records') {
            const dbSuppliers = data.map(v => ({
                id: v.id, date: v.date || null, name: v.name || '', mobile: v.mobile || '', email: v.email || null,
                company_type: v.type || null, address: v.address || null, city: v.city || null, state: v.state || null,
                pin: v.pin || null, gst: v.gst || null, pan: v.pan || null, msme: v.msme || null, bank_name: v.bankName || null,
                bank_branch: v.bankBranch || null, bank_acc: v.bankAcc || null, bank_ifsc: v.bankIfsc || null, bank_upi: v.bankUpi || null
            }));
            if (dbSuppliers.length > 0) {
                const { error } = await supabase.from('supplier_kyc').upsert(dbSuppliers, { onConflict: 'id' });
                if (error) {
                    console.error("Supplier KYC Sync Error:", error);
                    alert("Failed to save Supplier KYC to Cloud: " + error.message + " (Check if the table exists in Supabase)");
                }
            }
        } else if (key === 'manti_staff_records') {
            const dbStaff = data.map(s => ({
                id: s.id, name: s.name || '', type: s.type || '', mobile: s.mobile || null,
                email: s.email || null, data: s
            }));
            if (dbStaff.length > 0) {
                const { error } = await supabase.from('staff_records').upsert(dbStaff, { onConflict: 'id' });
                if (error) { console.error("Staff Records Sync Error:", error); alert("Failed to save Staff Records to Cloud: " + error.message); }
            }
        } else if (key === 'manti_assets') {
            const dbAssets = data.map(a => ({
                id: a.id, name: a.name || '', category: a.category || '', purchase_date: a.purchaseDate || null,
                value: parseFloat(a.value) || 0, status: a.status || '', data: a
            }));
            if (dbAssets.length > 0) {
                const { error } = await supabase.from('assets').upsert(dbAssets, { onConflict: 'id' });
                if (error) { console.error("Assets Sync Error:", error); alert("Failed to save Assets to Cloud: " + error.message); }
            }
        } else if (key === 'manti_delivery_challan_records') {
            const dbChallans = data.map(c => ({
                id: c.id, date: c.date, customer_name: c.customer || '', status: c.status || 'Draft',
                total_amount: parseFloat(c.total) || 0, items: c.items || []
            }));
            if (dbChallans.length > 0) {
                const { error } = await supabase.from('delivery_challans').upsert(dbChallans, { onConflict: 'id' });
                if (error) { console.error("Delivery Challans Sync Error:", error); alert("Failed to save Delivery Challans to Cloud: " + error.message); }
            }
        } else if (key === 'manti_payments_made') {
            const dbPayments = data.map(p => ({
                vendor: p.vendor || '', date: p.date, amount: parseFloat(p.amount) || 0,
                mode: p.mode || '', reference: p.reference || '', applications: p.applications || [], bill_url: p.billUrl || null
            }));
            if (dbPayments.length > 0) {
                const { error: delErr } = await supabase.from('payments_made').delete().neq('vendor', 'NON_EXISTENT');
                if (delErr) { console.error("Payments Sync Error:", delErr); alert("Failed to clear Payments for sync: " + delErr.message); }
                const { error } = await supabase.from('payments_made').insert(dbPayments);
                if (error) { console.error("Payments Sync Error:", error); alert("Failed to save Payments to Cloud: " + error.message); }
            }
        } else if (key === 'manti_expenses') {
            const dbExpenses = data.map(e => ({
                id: e.id, date: e.date, expense_account: e.account || '', amount: parseFloat(e.amount) || 0,
                paid_through: e.paidThrough || '', vendor: e.vendor || null,
                gst_percent: e.gstPercent || null, gst_amount: e.gstAmount || null,
                reference: e.reference || '', notes: e.notes || '', bill_url: e.billUrl || null,
                items: e.items || []
            }));
            if (dbExpenses.length > 0) {
                const { error } = await supabase.from('expenses').upsert(dbExpenses, { onConflict: 'id' });
                if (error) { console.error("Expenses Sync Error:", error); alert("Failed to save Expenses to Cloud: " + error.message); }
            }
        } else if (key === 'manti_journal_entries') {
            const dbJournals = data.map(j => ({
                id: j.id || j.no, date: j.date, amount: parseFloat(j.amount) || 0, description: j.description || j.notes || '', lines: j.lines || []
            }));
            if (dbJournals.length > 0) {
                const { error } = await supabase.from('journal_entries').upsert(dbJournals, { onConflict: 'id' });
                if (error) { console.error("Journal Entries Sync Error:", error); alert("Failed to save Journal Entries to Cloud: " + error.message); }
            }
        } else if (key === 'manti_bank_accounts') {
            const dbAccounts = data.map(a => ({
                id: a.id, account_name: a.name, type: a.type || 'Bank', bank_name: a.bankName || '', "number": a.number || '',
                loan_number: a.loanNumber || '', emi_amount: parseFloat(a.emiAmount) || 0,
                opening_balance: parseFloat(a.openingBalance) || 0, opening_date: a.openingDate || null
            }));
            
            if (dbAccounts.length > 0) {
                const idList = dbAccounts.map(a => `"${a.id}"`).join(',');
                await supabase.from('bank_accounts').delete().not('id', 'in', `(${idList})`);
                const { error } = await supabase.from('bank_accounts').upsert(dbAccounts, { onConflict: 'id' });
                if (error) { console.error("Bank Accounts Sync Error:", error); alert("Failed to save Bank Accounts to Cloud: " + error.message); }
            } else {
                await supabase.from('bank_accounts').delete().neq('id', 'NON_EXISTENT');
            }
        } else if (key === 'manti_stock_history') {
            const dbStock = data.map(s => ({
                date: s.date, type: s.type || '', details: s.details || '', qty: parseFloat(s.qty) || 0,
                weight: parseFloat(s.weight) || 0, metal_type: s.metal || ''
            }));
            if (dbStock.length > 0) {
                const { error: delErr } = await supabase.from('stock_history').delete().neq('type', 'NON_EXISTENT');
                if (delErr) { console.error("Stock History Sync Error:", delErr); alert("Failed to clear Stock History for sync: " + delErr.message); }
                const { error } = await supabase.from('stock_history').insert(dbStock);
                if (error) { console.error("Stock History Sync Error:", error); alert("Failed to save Stock History to Cloud: " + error.message); }
            }
        } else if (key === 'manti_report_snapshots') {
            const dbSnaps = data.map(s => ({
                id: s.id, title: s.title, date: s.date, html: s.html, type: s.type
            }));
            if (dbSnaps.length > 0) {
                const { error } = await supabase.from('snapshots').upsert(dbSnaps, { onConflict: 'id' });
                if (error) { console.error("Snapshots Sync Error:", error); alert("Failed to save Snapshots to Cloud: " + error.message); }
            }
        } else {
            const { error } = await supabase.from('settings').upsert({
                setting_key: key, setting_value: data, updated_at: new Date().toISOString()
            }, { onConflict: 'setting_key' });
            if (error) { console.error(`Settings Sync Error for ${key}:`, error); alert(`Failed to save ${key} to Cloud Settings: ` + error.message); }
        }
    } catch (e) {
        console.error(`Failed to sync ${key}:`, e);
        alert(`Cloud Sync Error for ${key}: ` + e.message + ".\nPlease ensure internet stability or check database configuration.");
    }
}

// Global Cloud Fetcher
window.fetchEverythingFromCloud = async function () {
    console.log("Fetching all data directly from Supabase Cloud...");

    try {
        const [
            ordersRes, jobsRes, invoicesRes, vendorRes,
            supplierRes, staffRes, assetsRes, challansRes,
            paymentsRes, expensesRes, journalsRes, accountsRes,
            stockRes, snapsRes, settingsRes
        ] = await Promise.all([
            supabase.from('orders').select('*'),
            supabase.from('job_works').select('*'),
            supabase.from('invoices').select('*'),
            supabase.from('vendor_kyc').select('*'),
            supabase.from('supplier_kyc').select('*'),
            supabase.from('staff_records').select('*'),
            supabase.from('assets').select('*'),
            supabase.from('delivery_challans').select('*'),
            supabase.from('payments_made').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('journal_entries').select('*'),
            supabase.from('bank_accounts').select('*'),
            supabase.from('stock_history').select('*'),
            supabase.from('snapshots').select('*'),
            supabase.from('settings').select('*')
        ]);

        // 1. Orders
        if (ordersRes.data) {
            const mappedOrders = ordersRes.data.map(o => {
                let extended = {};
                let remark = o.remark;
                if (o.remark && o.remark.startsWith('{')) {
                    try {
                        extended = JSON.parse(o.remark);
                        remark = extended.remark || '-';
                    } catch(e) {}
                }
                return {
                    id: o.order_number, type: o.type, date: o.date, dueDate: o.due_date,
                    customer: o.customer_name, vendor: o.vendor_id, product: o.product_name, 
                    weight: o.total_weight, qty: o.total_weight,
                    amount: o.total_amount, paidAmount: o.paid_amount, status: o.status,
                    unit: o.weight_unit, remark: remark, timestamp: o.created_at,
                    items: extended.items || [],
                    category: extended.category || '',
                    assetType: extended.assetType || '',
                    mainMetalType: extended.mainMetalType || '',
                    billNo: extended.billNo || '',
                    mcPercent: extended.mcPercent || '',
                    mcAmount: extended.mcAmount || ''
                };
            });
            window.ERP_MEMORY.set('manti_order_records', JSON.stringify(mappedOrders));
        }

        // 2. Job Works
        if (jobsRes.data) {
            const mappedJobs = jobsRes.data.map(j => ({
                jobNo: j.job_no, date: j.date, workerId: j.worker_id, workerName: j.worker_name,
                itemName: j.item_name, process: j.process, issueWt: j.issue_wt, receiveWt: j.receive_wt
            }));
            window.ERP_MEMORY.set('manti_jobwork_records', JSON.stringify(mappedJobs));
        }

        // 3. Invoices
        if (invoicesRes.data) {
            const invoiceMap = {};
            invoicesRes.data.forEach(inv => {
                invoiceMap[inv.invoice_number] = {
                    invoiceData: { invoiceNum: inv.invoice_number, date: inv.date },
                    customerData: inv.customer_data, items: inv.items,
                    totals: { subtotal: inv.subtotal, taxRate: inv.tax_rate, grandTotal: inv.total_amount },
                    paymentStatus: inv.payment_status
                };
            });
            window.ERP_MEMORY.set('manti_saved_invoices', JSON.stringify(invoiceMap));
        }

        // 4. Vendor KYC
        if (vendorRes.data && vendorRes.data.length > 0) {
            const mappedVendors = vendorRes.data.map(v => ({
                id: v.id, date: v.date, name: v.name, mobile: v.mobile, email: v.email, type: v.company_type,
                address: v.address, city: v.city, state: v.state, pin: v.pin, gst: v.gst, pan: v.pan, msme: v.msme,
                bankName: v.bank_name, bankBranch: v.bank_branch, bankAcc: v.bank_acc, bankIfsc: v.bank_ifsc, bankUpi: v.bank_upi
            }));
            window.ERP_MEMORY.set('manti_vendor_kyc_records', JSON.stringify(mappedVendors));
        }

        // 5. Supplier KYC
        if (supplierRes.data && supplierRes.data.length > 0) {
            const mappedSuppliers = supplierRes.data.map(v => ({
                id: v.id, date: v.date, name: v.name, mobile: v.mobile, email: v.email, type: v.company_type,
                address: v.address, city: v.city, state: v.state, pin: v.pin, gst: v.gst, pan: v.pan, msme: v.msme,
                bankName: v.bank_name, bankBranch: v.bank_branch, bankAcc: v.bank_acc, bankIfsc: v.bank_ifsc, bankUpi: v.bank_upi
            }));
            window.ERP_MEMORY.set('manti_supplier_kyc_records', JSON.stringify(mappedSuppliers));
        }

        // 6. Staff Records
        if (staffRes.data && staffRes.data.length > 0) {
            window.ERP_MEMORY.set('manti_staff_records', JSON.stringify(staffRes.data.map(s => s.data)));
        }

        // 7. Assets
        if (assetsRes.data && assetsRes.data.length > 0) {
            window.ERP_MEMORY.set('manti_assets', JSON.stringify(assetsRes.data.map(a => a.data)));
        }

        // 8. Delivery Challans
        if (challansRes.data && challansRes.data.length > 0) {
            const mappedChallans = challansRes.data.map(c => ({
                id: c.id, date: c.date, customer: c.customer_name, status: c.status,
                total: c.total_amount, items: c.items
            }));
            window.ERP_MEMORY.set('manti_delivery_challan_records', JSON.stringify(mappedChallans));
        }

        // 9. Payments Made
        if (paymentsRes.data && paymentsRes.data.length > 0) {
            const mappedPayments = paymentsRes.data.map(p => ({
                vendor: p.vendor, date: p.date, amount: p.amount, mode: p.mode,
                reference: p.reference, applications: p.applications, billUrl: p.bill_url
            }));
            window.ERP_MEMORY.set('manti_payments_made', JSON.stringify(mappedPayments));
        }

        // 10. Expenses
        if (expensesRes.data && expensesRes.data.length > 0) {
            const mappedExpenses = expensesRes.data.map(e => ({
                id: e.id, date: e.date, account: e.expense_account, amount: parseFloat(e.amount) || 0,
                paidThrough: e.paid_through, vendor: e.vendor,
                gstPercent: e.gst_percent || null, gstAmount: e.gst_amount || null,
                total: (parseFloat(e.amount) || 0) + (parseFloat(e.gst_amount) || 0),
                reference: e.reference, notes: e.notes, billUrl: e.bill_url, items: e.items || []
            }));
            window.ERP_MEMORY.set('manti_expenses', JSON.stringify(mappedExpenses));
        } else if (expensesRes.error) {
            console.warn("Supabase expenses table missing or error. Skipping...", expensesRes.error);
        }

        // 11. Journal Entries
        if (journalsRes.data && journalsRes.data.length > 0) {
            const mappedJournals = journalsRes.data.map(j => ({
                id: j.id, no: j.id, date: j.date, amount: j.amount, notes: j.description, description: j.description, lines: j.lines
            }));
            window.ERP_MEMORY.set('manti_journal_entries', JSON.stringify(mappedJournals));
        }

        // 12. Bank Accounts
        if (accountsRes.data && accountsRes.data.length > 0) {
            const mappedAccounts = accountsRes.data.map(a => ({
                id: a.id, name: a.account_name, type: a.type, bankName: a.bank_name, number: a.number,
                loanNumber: a.loan_number, emiAmount: a.emi_amount, openingBalance: a.opening_balance, openingDate: a.opening_date
            }));
            window.ERP_MEMORY.set('manti_bank_accounts', JSON.stringify(mappedAccounts));
        }

        // 13. Stock History
        if (stockRes.data && stockRes.data.length > 0) {
            const mappedStock = stockRes.data.map(s => ({
                date: s.date, type: s.type, details: s.details, qty: s.qty, weight: s.weight, metal: s.metal_type
            }));
            window.ERP_MEMORY.set('manti_stock_history', JSON.stringify(mappedStock));
        }

        // 14. Snapshots
        if (snapsRes.data && snapsRes.data.length > 0) {
            const mappedSnaps = snapsRes.data.map(s => ({
                id: s.id, title: s.title, date: s.date, html: s.html, type: s.type
            }));
            window.ERP_MEMORY.set('manti_report_snapshots', JSON.stringify(mappedSnaps));
        }

        // 15. Settings
        if (settingsRes.data) {
            const ignoredKeys = [
                'manti_vendor_kyc_records', 'manti_supplier_kyc_records', 'manti_staff_records',
                'manti_assets', 'manti_delivery_challan_records', 'manti_payments_made',
                'manti_expenses', 'manti_journal_entries', 'manti_bank_accounts', 'manti_stock_history',
                'manti_report_snapshots'
            ];
            settingsRes.data.forEach(s => {
                if (!ignoredKeys.includes(s.setting_key)) {
                    window.ERP_MEMORY.set(s.setting_key, JSON.stringify(s.setting_value));
                }
            });
        }
    } catch (e) {
        console.error("Cloud Fetch Failed!", e);
        // Continue booting the app anyway with locally cached/empty data
    }
    console.log("Cloud data loaded into RAM. Dispatching CloudDataLoaded event.");

    // Boot the main ERP scripts natively
    document.dispatchEvent(new Event('CloudDataLoaded'));
};

// Start the fetch process immediately when DOM is minimally parsed
document.addEventListener('DOMContentLoaded', () => {
    window.fetchEverythingFromCloud();
});
