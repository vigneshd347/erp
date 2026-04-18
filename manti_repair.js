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
    
    // Default account for legacy sync (first available cash/bank account)
    const defaultAccount = accounts.length > 0 ? accounts[0].name : 'Cash';
    
    let repairCount = 0;

    // 1. Repair Purchases
    records.filter(r => r.type === 'Purchase Order').forEach(rec => {
        const totalAmount = parseFloat(rec.amount) || 0;
        if (totalAmount <= 0) return;

        // Check for Purchase Journal (PUR-)
        if (!journals.some(j => j.id === 'PUR-' + rec.id)) {
            let debitAccount = 'Inventory';
            if (rec.category === 'Assets') debitAccount = 'Fixed Assets';
            else if (rec.category === 'Consumables' || rec.category === 'Others') debitAccount = 'Expenses';

            journals.push({
                id: 'PUR-' + rec.id,
                date: rec.date,
                reference: rec.id,
                notes: `Purchase ${rec.id} from ${rec.vendor} (Retro-sync)`,
                total: totalAmount,
                lines: [
                    { account: debitAccount, desc: `Purchase ${rec.id}`, contact: rec.vendor, debit: totalAmount, credit: 0 },
                    { account: 'Accounts Payable', desc: `Purchase ${rec.id}`, contact: rec.vendor, debit: 0, credit: totalAmount }
                ],
                timestamp: new Date().toISOString()
            });
            repairCount++;
        }

        // Check for Payment Journal (PMT-) if it's paid
        const isPaid = rec.paidAmount && parseFloat(rec.paidAmount) >= totalAmount;
        if (isPaid && !journals.some(j => j.id === 'PMT-' + rec.id)) {
            const payAccount = rec.paidThrough || defaultAccount;
            journals.push({
                id: 'PMT-' + rec.id,
                date: rec.date,
                reference: rec.id,
                notes: `Payment for Purchase ${rec.id} (Retro-sync)`,
                total: totalAmount,
                lines: [
                    { account: 'Accounts Payable', desc: `Payment for ${rec.id}`, contact: rec.vendor, debit: totalAmount, credit: 0 },
                    { account: payAccount, desc: `Payment for ${rec.id}`, contact: rec.vendor, debit: 0, credit: totalAmount }
                ],
                timestamp: new Date().toISOString()
            });
            repairCount++;
        }
    });

    // 2. Repair Expenses
    expenses.forEach(rec => {
        const totalAmount = parseFloat(rec.total) || 0;
        if (totalAmount <= 0) return;

        if (!journals.some(j => j.id === 'JV-' + rec.id)) {
            const payAccount = rec.paidThrough || defaultAccount;
            journals.push({
                id: 'JV-' + rec.id,
                date: rec.date,
                reference: rec.id,
                notes: `Expense: ${rec.account} (Retro-sync)`,
                total: totalAmount,
                lines: [
                    { account: rec.account, desc: rec.notes, contact: rec.vendor, debit: parseFloat(rec.amount) || 0, credit: 0 },
                    ...(parseFloat(rec.gstAmount) > 0 ? [{ account: 'GST Input Tax', desc: 'GST on Expenses', contact: rec.vendor, debit: parseFloat(rec.gstAmount), credit: 0 }] : []),
                    { account: payAccount, desc: rec.notes, contact: rec.vendor, debit: 0, credit: totalAmount }
                ],
                timestamp: new Date().toISOString()
            });
            repairCount++;
        }
    });

    if (repairCount > 0) {
        localStorage.setItem('manti_journal_entries', JSON.stringify(journals));
        console.log(`Success! Fixed ${repairCount} missing financial entries.`);
        
        // Broadcast completion for any open module (like Banking or Reports)
        window.dispatchEvent(new CustomEvent('FinancialDataRepaired', { detail: { count: repairCount } }));
        
        // Sync to cloud if available
        if (window.syncKeyToSupabase) {
            window.syncKeyToSupabase('manti_journal_entries', journals);
        }
    } else {
        console.log("No missing entries found. Ledger is healthy.");
    }
}

// Auto-run once if integrated, or call manually from console
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', repairFinancialData);
} else {
    repairFinancialData();
}
