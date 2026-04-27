/**
 * Manti ERP - Financial Data Repair Utility
 * Retroactively generates missing journal entries for legacy Purchases and Expenses
 */

function repairFinancialData() {
    console.log("Starting financial data repair...");
    
    const records = JSON.parse(localStorage.getItem('manti_order_records') || '[]');
    const expenses = JSON.parse(localStorage.getItem('manti_expenses') || '[]');
    let journals = JSON.parse(localStorage.getItem('manti_journal_entries') || '[]');
    const accounts = JSON.parse(localStorage.getItem('manti_bank_accounts') || '[]');
    let payments = JSON.parse(localStorage.getItem('manti_payments_made') || '[]');
    
    // Default account for legacy sync (first available cash/bank account)
    const defaultAccount = accounts.length > 0 ? accounts[0].name : 'Cash';
    
    let repairCount = 0;
    
    // --- DEDUPLICATION LOGIC ---
    let dedupCount = 0;
    
    function deduplicate(arr, keyFn) {
        const seen = new Set();
        return arr.filter(item => {
            const k = keyFn(item);
            if (seen.has(k)) { dedupCount++; return false; }
            seen.add(k);
            return true;
        });
    }

    // 1. Deduplicate Orders (by ID and then by exact match of date+vendor+amount)
    const cleanOrders = deduplicate(records, r => r.id ? r.id : `${r.type}-${r.date}-${r.vendor}-${r.amount}`);
    if (cleanOrders.length < records.length) {
        localStorage.setItem('manti_order_records', JSON.stringify(cleanOrders));
    }

    // 2. Deduplicate Expenses
    const cleanExpenses = deduplicate(expenses, e => e.id ? e.id : `${e.date}-${e.vendor}-${e.amount}`);
    if (cleanExpenses.length < expenses.length) {
        localStorage.setItem('manti_expenses', JSON.stringify(cleanExpenses));
    }

    // 3. Deduplicate Payments
    const cleanPayments = deduplicate(payments, p => p.id ? p.id : `${p.date}-${p.vendor}-${p.amount}`);
    if (cleanPayments.length < payments.length) {
        localStorage.setItem('manti_payments_made', JSON.stringify(cleanPayments));
    }

    // 4. Deduplicate Journal Entries (critical: prevents Postgres upsert conflict)
    const cleanJournals = deduplicate(journals, j => j.id || j.no || `${j.date}-${j.reference}-${j.total}`);
    if (cleanJournals.length < journals.length) {
        console.log(`Deduped ${journals.length - cleanJournals.length} duplicate journal entries from memory.`);
        journals = cleanJournals;
        // Write back the clean array immediately (don't wait for repairCount > 0)
        localStorage.setItem('manti_journal_entries', JSON.stringify(journals));
    }
    
    if (dedupCount > 0) {
        console.log(`Deduplicated ${dedupCount} records.`);
        if (window.syncKeyToSupabase) {
            window.syncKeyToSupabase('manti_order_records', cleanOrders);
            window.syncKeyToSupabase('manti_expenses', cleanExpenses);
            window.syncKeyToSupabase('manti_payments_made', cleanPayments);
        }
    }
    // --- END DEDUPLICATION ---

    let newJournals = [];

    // 1. Purchases (Credits AP)
    cleanOrders.filter(r => r.type === 'Purchase Order').forEach(rec => {
        const totalAmount = parseFloat(rec.amount) || 0;
        if (totalAmount <= 0) return;

        let debitAccount = 'Inventory';
        if (rec.category === 'Assets') debitAccount = 'Fixed Assets';
        else if (rec.category === 'Consumables' || rec.category === 'Others') debitAccount = 'Expenses';

        newJournals.push({
            id: 'PUR-' + rec.id,
            date: rec.date,
            reference: rec.id,
            notes: `Purchase ${rec.id} from ${rec.vendor}`,
            total: totalAmount,
            lines: [
                { account: debitAccount, desc: `Purchase ${rec.id}`, contact: rec.vendor, debit: totalAmount, credit: 0 },
                { account: 'Accounts Payable', desc: `Purchase ${rec.id}`, contact: rec.vendor, debit: 0, credit: totalAmount }
            ],
            timestamp: new Date(rec.date).toISOString()
        });

        // If it was paid immediately without a separate PMT record
        const isPaid = rec.paidAmount && parseFloat(rec.paidAmount) >= totalAmount;
        // Wait, Payments Made handles all explicit payments. Let's ONLY add PMT journals 
        // if paidThrough is explicitly not Accounts Payable (direct bank payment without PMT record).
        if (rec.paidThrough && rec.paidThrough !== 'Accounts Payable' && rec.paidThrough !== '') {
            newJournals.push({
                id: 'DIR-PMT-' + rec.id,
                date: rec.date,
                reference: rec.id,
                notes: `Direct Payment for ${rec.id}`,
                total: totalAmount,
                lines: [
                    { account: 'Accounts Payable', desc: `Payment for ${rec.id}`, contact: rec.vendor, debit: totalAmount, credit: 0 },
                    { account: rec.paidThrough, desc: `Payment for ${rec.id}`, contact: rec.vendor, debit: 0, credit: totalAmount }
                ],
                timestamp: new Date(rec.date).toISOString()
            });
        }
    });

    // 2. Expenses (Credits AP)
    cleanExpenses.forEach(rec => {
        const totalAmount = parseFloat(rec.total) || 0;
        if (totalAmount <= 0 || rec.status === 'Draft') return;

        const payAccount = rec.paidThrough || 'Accounts Payable';
        newJournals.push({
            id: 'JV-' + rec.id,
            date: rec.date,
            reference: rec.reference || rec.id,
            notes: `Expense: ${rec.account}`,
            total: totalAmount,
            lines: [
                { account: rec.account, desc: rec.notes, contact: rec.vendor, debit: parseFloat(rec.amount) || 0, credit: 0 },
                ...(parseFloat(rec.gstAmount) > 0 ? [{ account: 'GST Input Tax', desc: 'GST on Expenses', contact: rec.vendor, debit: parseFloat(rec.gstAmount), credit: 0 }] : []),
                { account: payAccount, desc: rec.notes, contact: rec.vendor, debit: 0, credit: totalAmount }
            ],
            timestamp: new Date(rec.date).toISOString()
        });
    });

    // 3. Explicit Payments Made (Debits AP)
    cleanPayments.forEach(pmt => {
        const totalAmt = parseFloat(pmt.amount) || 0;
        if (totalAmt <= 0) return;

        newJournals.push({
            id: 'PMT-REC-' + pmt.id,
            date: pmt.date,
            reference: pmt.reference || pmt.id,
            notes: `Vendor Payment ${pmt.id}`,
            total: totalAmt,
            lines: [
                { account: 'Accounts Payable', desc: `Payment to ${pmt.vendor}`, contact: pmt.vendor, debit: totalAmt, credit: 0 },
                { account: pmt.paidThrough || defaultAccount, desc: `Payment to ${pmt.vendor}`, contact: pmt.vendor, debit: 0, credit: totalAmt }
            ],
            timestamp: new Date(pmt.date).toISOString()
        });
    });

    // Replace all system-generated journals, keeping any user-created Manual Journals
    const manualJournals = journals.filter(j => 
        !j.id.startsWith('PUR-') && 
        !j.id.startsWith('PMT-') && 
        !j.id.startsWith('DIR-PMT-') && 
        !j.id.startsWith('JV-EXP-') && 
        !(j.id.startsWith('JV-') && cleanExpenses.some(e => e.id === j.id.replace('JV-', '')))
    );

    const rebuiltJournals = [...manualJournals, ...newJournals];
    
    // Check if lengths are different, meaning we cleaned up orphans
    if (rebuiltJournals.length !== journals.length || dedupCount > 0) {
        localStorage.setItem('manti_journal_entries', JSON.stringify(rebuiltJournals));
        console.log(`Success! Rebuilt Ledger: Cleaned up orphaned records and restored sync.`);
        
        // Sync to cloud
        if (window.syncKeyToSupabase) {
            window.syncKeyToSupabase('manti_journal_entries', rebuiltJournals);
        }
        
        // Notify UI
        window.dispatchEvent(new CustomEvent('FinancialDataRepaired', { detail: { count: rebuiltJournals.length } }));
    } else {
        console.log("Ledger is completely healthy. No orphans found.");
    }
}

// Auto-run once if integrated, or call manually from console
document.addEventListener('CloudDataLoaded', repairFinancialData);
