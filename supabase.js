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
            setTimeout(() => { if(window.mantiSyncPromises.length === 0 && indicator) indicator.remove(); }, 300);
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

Storage.prototype.getItem = function(key) {
    if (key.startsWith('manti_')) {
        return window.ERP_MEMORY.get(key) || null;
    }
    return originalGetItem.call(this, key);
};

Storage.prototype.setItem = function(key, value) {
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

window.awaitPendingSyncs = async function() {
    if (window.mantiSyncPromises.length > 0) {
        document.body.style.opacity = '0.5';
        document.body.style.pointerEvents = 'none';
        try { await Promise.allSettled(window.mantiSyncPromises); } catch (e) {}
        document.body.style.opacity = '1';
        document.body.style.pointerEvents = 'auto';
    }
};

window.navigateAfterSync = async function(url) {
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
            const dbOrders = data.map(o => ({
                order_number: o.id, type: o.type, date: o.date, due_date: o.dueDate || null,
                customer_name: o.vendor || o.customer || '', product_name: o.product || '',
                total_weight: parseFloat(o.qty || o.weight) || 0, weight_unit: 'g', remark: o.remark || '-'
            }));
            if (dbOrders.length > 0) await supabase.from('orders').upsert(dbOrders, { onConflict: 'order_number' });
        } else if (key === 'manti_jobwork_records') {
            const dbJobs = data.map(j => ({
                job_no: j.jobNo || j.jobnum, date: j.date, worker_id: j.workerId || '', worker_name: j.workerName || '',
                item_name: j.itemName || j.product || '', process: j.process, issue_wt: parseFloat(j.issueWt) || null,
                receive_wt: parseFloat(j.receiveWt) || null
            }));
            if (dbJobs.length > 0) {
                await supabase.from('job_works').delete().neq('worker_id', 'NON_EXISTENT_MAGIC_STRING'); 
                await supabase.from('job_works').insert(dbJobs);
            }
        } else if (key === 'manti_saved_invoices') {
            const dbInvoices = Object.values(data).map(inv => ({
                invoice_number: inv.invoiceData.invoiceNum, date: inv.invoiceData.date, customer_data: inv.customerData || {},
                items: inv.items || [], subtotal: parseFloat(inv.totals?.subtotal?.replace(/[^0-9.-]+/g,"")) || 0,
                tax_rate: parseFloat(inv.totals?.taxRate) || 0, total_amount: parseFloat(inv.totals?.grandTotal?.replace(/[^0-9.-]+/g,"")) || 0,
                payment_status: inv.paymentStatus || 'Unpaid'
            }));
            if (dbInvoices.length > 0) await supabase.from('invoices').upsert(dbInvoices, { onConflict: 'invoice_number' });
        } else if (key === 'manti_vendor_kyc_records') {
            const dbVendors = data.map(v => ({
                id: v.id, date: v.date || null, name: v.name || '', mobile: v.mobile || '', email: v.email || null,
                company_type: v.type || null, address: v.address || null, city: v.city || null, state: v.state || null,
                pin: v.pin || null, gst: v.gst || null, pan: v.pan || null, msme: v.msme || null, bank_name: v.bankName || null,
                bank_branch: v.bankBranch || null, bank_acc: v.bankAcc || null, bank_ifsc: v.bankIfsc || null, bank_upi: v.bankUpi || null
            }));
            if (dbVendors.length > 0) await supabase.from('vendor_kyc').upsert(dbVendors, { onConflict: 'id' });
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
            if (dbStaff.length > 0) await supabase.from('staff_records').upsert(dbStaff, { onConflict: 'id' });
        } else if (key === 'manti_assets') {
            const dbAssets = data.map(a => ({
                id: a.id, name: a.name || '', category: a.category || '', purchase_date: a.purchaseDate || null,
                value: parseFloat(a.value) || 0, status: a.status || '', data: a
            }));
            if (dbAssets.length > 0) await supabase.from('assets').upsert(dbAssets, { onConflict: 'id' });
        } else if (key === 'manti_delivery_challan_records') {
            const dbChallans = data.map(c => ({
                id: c.id, date: c.date, customer_name: c.customer || '', status: c.status || 'Draft',
                total_amount: parseFloat(c.total) || 0, items: c.items || []
            }));
            if (dbChallans.length > 0) await supabase.from('delivery_challans').upsert(dbChallans, { onConflict: 'id' });
        } else if (key === 'manti_payments_made') {
            const dbPayments = data.map(p => ({
                vendor: p.vendor || '', date: p.date, amount: parseFloat(p.amount) || 0,
                mode: p.mode || '', reference: p.reference || '', applications: p.applications || []
            }));
            if (dbPayments.length > 0) {
                await supabase.from('payments_made').delete().neq('vendor', 'NON_EXISTENT');
                await supabase.from('payments_made').insert(dbPayments);
            }
        } else if (key === 'manti_journal_entries') {
            const dbJournals = data.map(j => ({
                date: j.date, amount: parseFloat(j.amount) || 0, description: j.description || '', lines: j.lines || []
            }));
            if (dbJournals.length > 0) {
                await supabase.from('journal_entries').delete().neq('date', '1900-01-01');
                await supabase.from('journal_entries').insert(dbJournals);
            }
        } else if (key === 'manti_bank_accounts') {
            const dbAccounts = data.map(a => ({
                account_name: a.name, opening_balance: parseFloat(a.openingBalance) || 0, opening_date: a.openingDate || null
            }));
            if (dbAccounts.length > 0) await supabase.from('bank_accounts').upsert(dbAccounts, { onConflict: 'account_name' });
        } else if (key === 'manti_stock_history') {
            const dbStock = data.map(s => ({
                date: s.date, type: s.type || '', details: s.details || '', qty: parseFloat(s.qty) || 0,
                weight: parseFloat(s.weight) || 0, metal_type: s.metal || ''
            }));
            if (dbStock.length > 0) {
                await supabase.from('stock_history').delete().neq('type', 'NON_EXISTENT');
                await supabase.from('stock_history').insert(dbStock);
            }
        } else {
            await supabase.from('settings').upsert({
                setting_key: key, setting_value: data, updated_at: new Date().toISOString()
            }, { onConflict: 'setting_key' });
        }
    } catch (e) { 
        console.error(`Failed to sync ${key}:`, e); 
        alert(`Cloud Sync Error for ${key}: ` + e.message + ".\nPlease ensure internet stability or check database configuration.");
    }
}

// Global Cloud Fetcher
window.fetchEverythingFromCloud = async function() {
    console.log("Fetching all data directly from Supabase Cloud...");
    
    // Create a blocking UI loader
    const loader = document.createElement('div');
    loader.id = 'cloud-loader';
    loader.innerHTML = '<div style="background: white; padding: 20px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); font-family: Inter, sans-serif; font-weight: 700; color: #5454d4; display: flex; align-items: center; gap: 15px;"><div class="spinner" style="width: 24px; height: 24px; border: 3px solid #e0e7ff; border-top-color: #5454d4; border-radius: 50%; animation: spin 1s linear infinite;"></div> Fetching latest cloud data...</div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>';
    loader.style = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(241, 245, 249, 0.9); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);';
    document.body.appendChild(loader);

    try {
        // 1. Fetch Orders
        const { data: ordersData } = await supabase.from('orders').select('*');
        if (ordersData) {
            const mappedOrders = ordersData.map(o => ({
                id: o.order_number, type: o.type, date: o.date, dueDate: o.due_date, 
                customer: o.customer_name, product: o.product_name, weight: o.total_weight, 
                unit: o.weight_unit, remark: o.remark, timestamp: o.created_at
            }));
            window.ERP_MEMORY.set('manti_order_records', JSON.stringify(mappedOrders));
        }

        // 2. Fetch Job Works
        const { data: jobsData } = await supabase.from('job_works').select('*');
        if (jobsData) {
            const mappedJobs = jobsData.map(j => ({
                jobNo: j.job_no, date: j.date, workerId: j.worker_id, workerName: j.worker_name,
                itemName: j.item_name, process: j.process, issueWt: j.issue_wt, receiveWt: j.receive_wt
            }));
            window.ERP_MEMORY.set('manti_jobwork_records', JSON.stringify(mappedJobs));
        }

        // 3. Fetch Invoices
        const { data: invoicesData } = await supabase.from('invoices').select('*');
        if (invoicesData) {
            const invoiceMap = {};
            invoicesData.forEach(inv => {
                invoiceMap[inv.invoice_number] = {
                    invoiceData: { invoiceNum: inv.invoice_number, date: inv.date },
                    customerData: inv.customer_data, items: inv.items,
                    totals: { subtotal: inv.subtotal, taxRate: inv.tax_rate, grandTotal: inv.total_amount },
                    paymentStatus: inv.payment_status
                };
            });
            window.ERP_MEMORY.set('manti_saved_invoices', JSON.stringify(invoiceMap));
        }

        // 4. Fetch Vendor KYC
        const { data: vendorData } = await supabase.from('vendor_kyc').select('*');
        if (vendorData && vendorData.length > 0) {
            const mappedVendors = vendorData.map(v => ({
                id: v.id, date: v.date, name: v.name, mobile: v.mobile, email: v.email, type: v.company_type,
                address: v.address, city: v.city, state: v.state, pin: v.pin, gst: v.gst, pan: v.pan, msme: v.msme,
                bankName: v.bank_name, bankBranch: v.bank_branch, bankAcc: v.bank_acc, bankIfsc: v.bank_ifsc, bankUpi: v.bank_upi
            }));
            window.ERP_MEMORY.set('manti_vendor_kyc_records', JSON.stringify(mappedVendors));
        }

        // 5. Fetch Supplier KYC
        const { data: supplierData } = await supabase.from('supplier_kyc').select('*');
        if (supplierData && supplierData.length > 0) {
            const mappedSuppliers = supplierData.map(v => ({
                id: v.id, date: v.date, name: v.name, mobile: v.mobile, email: v.email, type: v.company_type,
                address: v.address, city: v.city, state: v.state, pin: v.pin, gst: v.gst, pan: v.pan, msme: v.msme,
                bankName: v.bank_name, bankBranch: v.bank_branch, bankAcc: v.bank_acc, bankIfsc: v.bank_ifsc, bankUpi: v.bank_upi
            }));
            window.ERP_MEMORY.set('manti_supplier_kyc_records', JSON.stringify(mappedSuppliers));
        }

        // 6. Fetch Staff Records
        const { data: staffData } = await supabase.from('staff_records').select('*');
        if (staffData && staffData.length > 0) {
            window.ERP_MEMORY.set('manti_staff_records', JSON.stringify(staffData.map(s => s.data)));
        }

        // 7. Fetch Assets
        const { data: assetsData } = await supabase.from('assets').select('*');
        if (assetsData && assetsData.length > 0) {
            window.ERP_MEMORY.set('manti_assets', JSON.stringify(assetsData.map(a => a.data)));
        }

        // 8. Fetch Delivery Challans
        const { data: challansData } = await supabase.from('delivery_challans').select('*');
        if (challansData && challansData.length > 0) {
            const mappedChallans = challansData.map(c => ({
                id: c.id, date: c.date, customer: c.customer_name, status: c.status,
                total: c.total_amount, items: c.items
            }));
            window.ERP_MEMORY.set('manti_delivery_challan_records', JSON.stringify(mappedChallans));
        }

        // 9. Fetch Payments Made
        const { data: paymentsData } = await supabase.from('payments_made').select('*');
        if (paymentsData && paymentsData.length > 0) {
            const mappedPayments = paymentsData.map(p => ({
                vendor: p.vendor, date: p.date, amount: p.amount, mode: p.mode,
                reference: p.reference, applications: p.applications
            }));
            window.ERP_MEMORY.set('manti_payments_made', JSON.stringify(mappedPayments));
        }

        // 10. Fetch Journal Entries
        const { data: journalsData } = await supabase.from('journal_entries').select('*');
        if (journalsData && journalsData.length > 0) {
            const mappedJournals = journalsData.map(j => ({
                date: j.date, amount: j.amount, description: j.description, lines: j.lines
            }));
            window.ERP_MEMORY.set('manti_journal_entries', JSON.stringify(mappedJournals));
        }

        // 11. Fetch Bank Accounts
        const { data: bankAccountsData } = await supabase.from('bank_accounts').select('*');
        if (bankAccountsData && bankAccountsData.length > 0) {
            const mappedAccounts = bankAccountsData.map(a => ({
                name: a.account_name, openingBalance: a.opening_balance, openingDate: a.opening_date
            }));
            window.ERP_MEMORY.set('manti_bank_accounts', JSON.stringify(mappedAccounts));
        }

        // 12. Fetch Stock History
        const { data: stockHistoryData } = await supabase.from('stock_history').select('*');
        if (stockHistoryData && stockHistoryData.length > 0) {
            const mappedStock = stockHistoryData.map(s => ({
                date: s.date, type: s.type, details: s.details, qty: s.qty, weight: s.weight, metal: s.metal_type
            }));
            window.ERP_MEMORY.set('manti_stock_history', JSON.stringify(mappedStock));
        }

        // 13. Fetch Settings (Generic Rules, Custom DBs)
        const { data: settingsData } = await supabase.from('settings').select('*');
        if (settingsData) {
            const ignoredKeys = [
                'manti_vendor_kyc_records', 'manti_supplier_kyc_records', 'manti_staff_records',
                'manti_assets', 'manti_delivery_challan_records', 'manti_payments_made',
                'manti_journal_entries', 'manti_bank_accounts', 'manti_stock_history'
            ];
            settingsData.forEach(s => {
                // To avoid overwriting dedicated fetches if they accidentally saved in settings earlier
                if (!ignoredKeys.includes(s.setting_key)) {
                    window.ERP_MEMORY.set(s.setting_key, JSON.stringify(s.setting_value));
                }
            });
        }
    } catch(e) {
        console.error("Cloud Fetch Failed!", e);
        loader.innerHTML = '<div style="background: #fee2e2; color: #dc2626; padding: 20px; border-radius: 12px; font-weight: 700;">Could not connect to Supabase Cloud. Please check your internet connection.</div>';
        return; // Halt execution if offline (strict option B)
    }

    loader.remove();
    console.log("Cloud data loaded into RAM. Dispatching CloudDataLoaded event.");
    
    // Boot the main ERP scripts natively
    document.dispatchEvent(new Event('CloudDataLoaded'));
};

// Start the fetch process immediately when DOM is minimally parsed
document.addEventListener('DOMContentLoaded', () => {
    window.fetchEverythingFromCloud();
});
