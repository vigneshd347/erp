// Data sources
        const orders = JSON.parse(localStorage.getItem('manti_order_records') || '[]');
        const sups = JSON.parse(localStorage.getItem('manti_supplier_kyc_records') || '[]');
        const vends = JSON.parse(localStorage.getItem('manti_vendor_kyc_records') || '[]');
        const vendors = sups.concat(vends);
        const allExpenses = JSON.parse(localStorage.getItem('manti_expenses') || '[]');

        let currentVendorOrders = [];

        document.addEventListener('CloudDataLoaded', () => {
            document.getElementById('pay-date').valueAsDate = new Date();

            const vendorList = document.getElementById('supplier-kyc-list');
            if (vendors.length > 0) {
                vendors.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.name ? `${v.name} (${v.id})` : v.id;
                    vendorList.appendChild(opt);
                });
            }

            // Populate Paid Through from actual bank accounts dynamically
            const bankAccounts = JSON.parse(localStorage.getItem('manti_bank_accounts') || '[]');
            const select = document.getElementById('pay-account');
            select.innerHTML = '';
            
            if (bankAccounts.length === 0) {
                select.innerHTML = '<option value="Cash">Petty Cash</option><option value="Bank">Bank Account</option>';
            } else {
                let cashGroup = document.createElement('optgroup');
                cashGroup.label = "Cash Accounts";
                let bankGroup = document.createElement('optgroup');
                bankGroup.label = "Bank & Credit Cards";

                bankAccounts.forEach(acc => {
                    const opt = document.createElement('option');
                    opt.value = acc.name; // Use exact name globally
                    opt.textContent = `${acc.name} (${acc.type || 'Bank'})`;
                    if (acc.type === 'Cash') cashGroup.appendChild(opt);
                    else bankGroup.appendChild(opt);
                });

                if (bankGroup.children.length > 0) select.appendChild(bankGroup);
                if (cashGroup.children.length > 0) select.appendChild(cashGroup);
            }
            
            loadVendorBills();
        });

        function loadVendorBills() {
            let rawVendor = document.getElementById('pay-vendor').value.trim();
            const tbody = document.getElementById('unpaid-bills-body');
            
            const isAllVendors = !rawVendor;

            let vendorId = rawVendor;
            const match = rawVendor.match(/\(([^)]+)\)$/);
            if (match) {
                vendorId = match[1];
            } else {
                const found = vendors.find(v => v.name && v.name.toLowerCase() === rawVendor.toLowerCase());
                if (found) vendorId = found.id;
            }

            const allUnpaid = [];

            // 1. Process Purchase Orders
            orders.forEach(o => {
                try {
                    if (o.type !== 'Purchase Order') return;
                    if (o.status === 'Cancelled') return;
                    
                    let oVid = o.vendor ? String(o.vendor).trim() : '';
                    const m = oVid.match(/\(([^)]+)\)$/);
                    if (m) oVid = m[1];
                    else {
                        const found = vendors.find(v => v.name && String(v.name).toLowerCase() === oVid.toLowerCase());
                        if (found) oVid = found.id;
                    }
                    
                    if (!isAllVendors) {
                        if (oVid !== vendorId && o.vendor !== vendorId && String(o.vendor).trim() !== rawVendor) return;
                    }
                    
                    // Lookup full name for rendering
                    let fullName = o.vendor;
                    let foundVendor = vendors.find(v => v.id === oVid) || vendors.find(v => v.id === o.vendor);
                    if(foundVendor && foundVendor.name) fullName = foundVendor.name;

                    const amt = parseFloat(String(o.amount || 0).replace(/,/g, '')) || 0;
                    const paid = parseFloat(String(o.paidAmount || 0).replace(/,/g, '')) || 0;
                    const due = amt - paid;
                    
                    if (due > 0.001) {
                        allUnpaid.push({
                            date: o.date,
                            id: o.id,
                            billNo: o.billNo || '-',
                            amt: amt,
                            due: due,
                            vendorName: fullName || '—'
                        });
                    }
                } catch(err) {
                    console.error("Skipping corrupted PO:", err);
                }
            });

            // 2. Process Expenses
            allExpenses.forEach(exp => {
                try {
                    let eVid = exp.vendor ? String(exp.vendor).trim() : '';
                    const m = eVid.match(/\(([^)]+)\)$/);
                    if (m) eVid = m[1];
                    else {
                        const found = vendors.find(v => v.name && String(v.name).toLowerCase() === eVid.toLowerCase());
                        if (found) eVid = found.id;
                    }
                    
                    if (!isAllVendors) {
                        if (eVid !== vendorId && exp.vendor !== vendorId && String(exp.vendor).trim() !== rawVendor) return;
                    }

                    // Lookup full name
                    let fullName = exp.vendor;
                    let foundVendor = vendors.find(v => v.id === eVid) || vendors.find(v => v.id === exp.vendor);
                    if(foundVendor && foundVendor.name) fullName = foundVendor.name;

                    const amt = parseFloat(String(exp.total || 0).replace(/,/g, '')) || 0;
                    let paid = parseFloat(String(exp.paidAmount || 0).replace(/,/g, '')) || 0;
                    
                    if (exp.paidAmount === undefined && exp.paidThrough && String(exp.paidThrough).trim() !== '') {
                        paid = amt;
                    }
                    
                    const due = amt - paid;
                    
                    if (due > 0.001) {
                        allUnpaid.push({
                            date: exp.date,
                            id: exp.id,
                            billNo: exp.reference || 'Expense Bill',
                            amt: amt,
                            due: due,
                            vendorName: fullName || '—'
                        });
                    }
                } catch(err) {
                    console.error("Skipping corrupted expense:", err);
                }
            });

            // Sort by Date ascending (FIFO payment matching)
            allUnpaid.sort((a, b) => new Date(a.date) - new Date(b.date));
            currentVendorOrders = allUnpaid;

            if (currentVendorOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">This vendor has no outstanding Purchase Orders or Expenses.</td></tr>';
                calculateSummary();
                return;
            }

            tbody.innerHTML = '';
            currentVendorOrders.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(o.date).toLocaleDateString('en-GB')}</td>
                    <td style="font-weight: 600; color: #334155;">${o.vendorName}</td>
                    <td style="font-weight: 600; color: var(--primary);">${o.id}</td>
                    <td>${o.billNo}</td>
                    <td style="text-align: center;">
                        <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:20px; font-size:0.75rem; font-weight:600; background:#fee2e2;color:#ef4444;">
                            <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
                            Payment Pending
                        </span>
                    </td>
                    <td style="text-align: right;">${o.amt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style="text-align: right; color: var(--danger); font-weight: 600;">${o.due.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td style="text-align: right;">
                        <input type="number" class="payment-cell-input" data-po-id="${o.id}" data-due="${o.due}" placeholder="${isAllVendors ? 'Select Supplier' : '0.00'}" oninput="calculateSummary()" ${isAllVendors ? 'disabled style="background:#f1f5f9; cursor:not-allowed;"' : ''}>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            autoDistributePayment();
        }

        function autoDistributePayment() {
            const amountEntered = parseFloat(document.getElementById('pay-amount').value) || 0;
            let remaining = amountEntered;

            const inputs = document.querySelectorAll('.payment-cell-input');
            
            inputs.forEach(input => {
                const due = parseFloat(input.getAttribute('data-due')) || 0;
                if (remaining > 0) {
                    if (remaining >= due) {
                        input.value = due.toFixed(2);
                        remaining -= due;
                    } else {
                        input.value = remaining.toFixed(2);
                        remaining = 0;
                    }
                } else {
                    input.value = '';
                }
            });

            calculateSummary();
        }

        function calculateSummary() {
            const amountEntered = parseFloat(document.getElementById('pay-amount').value) || 0;
            let amountApplied = 0;

            document.querySelectorAll('.payment-cell-input').forEach(input => {
                let val = parseFloat(input.value) || 0;
                let due = parseFloat(input.getAttribute('data-due')) || 0;

                // Restrict input from exceeding DUE amount
                if (val > due) {
                    input.value = due.toFixed(2);
                    val = due;
                }

                amountApplied += val;
            });

            // Prevent applied being greater than entered (if they manually type large numbers)
            // Wait, standard Zoho allows modifying inputs, and if applied > entered, it shows a warning.
            // But we will allow it and define the 'Entered Amount' as whatever they type.
            
            const excess = amountEntered - amountApplied;

            document.getElementById('sum-entered').textContent = '₹ ' + amountEntered.toLocaleString('en-IN', {minimumFractionDigits: 2});
            document.getElementById('sum-applied').textContent = '₹ ' + amountApplied.toLocaleString('en-IN', {minimumFractionDigits: 2});
            
            const excessEl = document.getElementById('sum-excess');
            excessEl.textContent = '₹ ' + Math.abs(excess).toLocaleString('en-IN', {minimumFractionDigits: 2});

            if (amountApplied > amountEntered && amountEntered > 0) {
                excessEl.previousElementSibling.textContent = "Amount Over-Applied:";
                excessEl.style.color = 'var(--danger)';
            } else if (excess > 0) {
                excessEl.previousElementSibling.textContent = "Amount in Excess:";
                excessEl.style.color = 'var(--success)';
            } else {
                excessEl.previousElementSibling.textContent = "Amount in Excess:";
                excessEl.style.color = 'var(--text-muted)'; // Zero
            }
        }

        function savePayment() {
            let rawVendor = document.getElementById('pay-vendor').value.trim();
            if (!rawVendor) return alert("Please select a supplier.");
            
            let vendorId = rawVendor;
            const match = rawVendor.match(/\(([^)]+)\)$/);
            if (match) {
                vendorId = match[1];
            } else {
                const found = vendors.find(v => v.name && v.name.toLowerCase() === rawVendor.toLowerCase());
                if (found) vendorId = found.id;
            }

            const date = document.getElementById('pay-date').value;
            const account = document.getElementById('pay-account').value;
            const amountEntered = parseFloat(document.getElementById('pay-amount').value) || 0;
            const mode = document.getElementById('pay-mode').value;
            const ref = document.getElementById('pay-ref').value;
            const notes = document.getElementById('pay-notes').value;

            if (!date) return alert("Please select a payment date.");
            if (amountEntered <= 0) return alert("Please enter a valid amount.");

            let amountApplied = 0;
            const applications = [];

            document.querySelectorAll('.payment-cell-input').forEach(input => {
                const val = parseFloat(input.value) || 0;
                if (val > 0) {
                    amountApplied += val;
                    applications.push({
                        id: input.getAttribute('data-po-id'),
                        amount: val
                    });
                }
            });

            if (amountApplied > amountEntered) {
                return alert("You have applied more payment to POs than the total Payment Amount entered.");
            }

            if (amountApplied === 0 && currentVendorOrders.length > 0) {
                if (!confirm("No amount has been applied to specific purchase orders. This will be an open advance payment. Continue?")) {
                    return;
                }
            }

            // 1. Update Purchase Orders and Expenses
            applications.forEach(app => {
                if (app.id.startsWith('EXP-')) {
                    const expIndex = allExpenses.findIndex(e => e.id === app.id);
                    if (expIndex !== -1) {
                        const currentPaid = parseFloat(allExpenses[expIndex].paidAmount) || 0;
                        allExpenses[expIndex].paidAmount = currentPaid + app.amount;
                    }
                } else {
                    const orderIndex = orders.findIndex(o => o.id === app.id);
                    if (orderIndex !== -1) {
                        const currentPaid = parseFloat(orders[orderIndex].paidAmount) || 0;
                        orders[orderIndex].paidAmount = currentPaid + app.amount;
                    }
                }
            });
            localStorage.setItem('manti_order_records', JSON.stringify(orders));
            localStorage.setItem('manti_expenses', JSON.stringify(allExpenses));

            // 2. Generate Journal Entry for Banking Ledger
            const journals = JSON.parse(localStorage.getItem('manti_journal_entries') || '[]');
            const nextId = 'PMT-' + String(journals.length + 1).padStart(4, '0');

            const jvLines = [
                {
                    account: account, // e.g. "Bank" or "Cash" (Credit decreases asset)
                    desc: `Payment to ${rawVendor} via ${mode}`,
                    contact: vendorId,
                    debit: 0,
                    credit: amountEntered
                },
                {
                    account: 'Accounts Payable', // Debit decreases liability
                    desc: `Payment to ${rawVendor} via ${mode}`,
                    contact: vendorId,
                    debit: amountEntered,
                    credit: 0
                }
            ];

            journals.push({
                id: nextId,
                date: date,
                reference: ref,
                notes: notes || `Vendor Payment: ${vendor}`,
                total: amountEntered,
                lines: jvLines,
                timestamp: new Date().toISOString()
            });

            localStorage.setItem('manti_journal_entries', JSON.stringify(journals));

            // 3. Payments Made
            const payments = JSON.parse(localStorage.getItem('manti_payments_made') || '[]');
            const paymentObj = {
                id: (function(){
                    let nextId = 1;
                    payments.forEach(r => {
                        if(r.id && r.id.startsWith('PAY-')) {
                            const n = parseInt(r.id.replace('PAY-', ''), 10);
                            if(!isNaN(n) && n >= nextId) nextId = n + 1;
                        }
                    });
                    return 'PAY-' + nextId.toString().padStart(4, '0');
                })(),
                vendor: vendorId,
                date: date,
                amount: amountEntered,
                mode: mode,
                reference: ref,
                applications: applications,
                account: account,
                notes: notes
            };
            payments.push(paymentObj);
            localStorage.setItem('manti_payments_made', JSON.stringify(payments));

            alert(`Payment of ₹ ${amountEntered.toFixed(2)} recorded successfully.`);
            if (window.navigateAfterSync) window.navigateAfterSync('purchases.html'); else window.location.href = 'purchases.html';
        }