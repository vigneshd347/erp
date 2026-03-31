                (function(){
                    const allOrders = JSON.parse(localStorage.getItem('manti_order_records') || '[]');
                    const sos = allOrders.filter(o => o.type === 'Sales Order');
                    document.getElementById('kpi-so-total').textContent = sos.length;
                    document.getElementById('kpi-so-open').textContent = sos.filter(o => o.status !== 'Completed').length;
                    document.getElementById('kpi-so-completed').textContent = sos.filter(o => o.status === 'Completed').length;
                    document.getElementById('kpi-so-fixed').textContent = sos.filter(o => o.isFixed).length;
                })();
        lucide.createIcons();
        document.addEventListener('CloudDataLoaded', () => {
            // Load rates for Fixed logic
            const savedRates = localStorage.getItem('manti_metal_rates');
            if (savedRates) {
                const rates = JSON.parse(savedRates);
                const gRate = document.getElementById('p-gold-rate');
                const sRate = document.getElementById('p-silver-rate');
                if (gRate) gRate.textContent = '₹ ' + (rates.pureGold || 0).toLocaleString();
                if (sRate) sRate.textContent = '₹ ' + (rates.pureSilver || 0).toLocaleString();
            }

            // Load Customers (Vendors)
            const vendorSelect = document.getElementById('ord-vendor');
            const vendors = JSON.parse(localStorage.getItem('manti_vendor_kyc_records')) || [];
            vendors.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.textContent = v.id;
                vendorSelect.appendChild(opt);
            });

            const form = document.getElementById('order-form');
            const toggleBtn = document.getElementById('add-order-btn');
            const cancelBtn = document.getElementById('cancel-order');
            const tbody = document.getElementById('orders-body');
            
            let records = JSON.parse(localStorage.getItem('manti_order_records')) || [];

            function generateOrderId() {
                let prefix = 'SO-';
                let maxId = 1000;
                records.forEach(rec => {
                    if (rec.id && rec.id.startsWith(prefix)) {
                        const num = parseInt(rec.id.replace(prefix, ''), 10);
                        if (!isNaN(num) && num > maxId) maxId = num;
                    }
                });
                return prefix + (maxId + 1);
            }

            function addSORow(itemData = {}) {
                const tr = document.createElement('tr');
                tr.classList.add('so-item-row');
                
                tr.innerHTML = `
                    <td style="padding: 12px; vertical-align: top;">
                        <textarea class="so-desc input-wrapper" placeholder="Product / Description" required style="width: 100%; border: none; resize: none; background: transparent; padding: 0; min-height: 40px; font-size: 0.9rem;">${itemData.desc || ''}</textarea>
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        <select class="so-metal-type input-wrapper" required style="width: 100%; border: none; background: transparent; padding: 0;">
                            <option value="Gold" ${itemData.metalType === 'Gold' ? 'selected' : ''}>Gold</option>
                            <option value="Silver" ${itemData.metalType === 'Silver' ? 'selected' : ''}>Silver</option>
                            <option value="Others" ${!itemData.metalType || itemData.metalType === 'Others' ? 'selected' : ''}>Others</option>
                        </select>
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        <input type="number" step="0.001" class="so-qty input-wrapper" placeholder="0.000" required value="${itemData.qty || ''}" style="width: 100%; text-align: right; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        <input type="number" step="0.01" class="so-rate input-wrapper" placeholder="0.00" value="${itemData.rate || ''}" style="width: 100%; text-align: right; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        <input type="number" step="0.01" class="so-mc input-wrapper" placeholder="MC %" value="${itemData.mcPercent || ''}" style="width: 100%; text-align: right; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                        <input type="text" class="so-row-amount input-wrapper" placeholder="0.00" readonly style="width: 100%; text-align: right; border: none; background: transparent; padding: 0; font-weight: 600;">
                    </td>
                    <td style="padding: 12px; vertical-align: top; text-align: center;">
                        <button type="button" class="btn-remove-sm" onclick="this.closest('tr').remove(); calculateSOTotals();">×</button>
                    </td>
                `;
                
                document.getElementById('so-items-body').appendChild(tr);
                
                tr.querySelectorAll('input, select, textarea').forEach(input => {
                    input.addEventListener('input', calculateSOTotals);
                    input.addEventListener('change', calculateSOTotals);
                });
                
                calculateSOTotals();
            }

            function calculateSOTotals() {
                let grandTotal = 0;
                let totalWeight = 0;
                const isFixed = document.getElementById('ord-is-fixed').checked;
                const rates = JSON.parse(localStorage.getItem('manti_metal_rates') || '{}');
                
                const rows = document.querySelectorAll('.so-item-row');
                rows.forEach(row => {
                    const qty = parseFloat(row.querySelector('.so-qty').value) || 0;
                    const metalType = row.querySelector('.so-metal-type').value;
                    const mcPercent = parseFloat(row.querySelector('.so-mc').value) || 0;
                    const rateInput = row.querySelector('.so-rate');
                    
                    let rate = parseFloat(rateInput.value) || 0;
                    
                    if (isFixed) {
                        rateInput.readOnly = true;
                        rateInput.style.backgroundColor = '#f3f4f6';
                        if (metalType === 'Gold') rate = rates.gold22k || ((rates.pureGold || 0) / 24 * 22);
                        else if (metalType === 'Silver') rate = rates.silver925 || ((rates.pureSilver || 0) * 0.925);
                        rateInput.value = rate.toFixed(2);
                    } else {
                        rateInput.readOnly = false;
                        rateInput.style.backgroundColor = 'transparent';
                    }
                    
                    const baseAmount = qty * rate;
                    const mcAmt = baseAmount * (mcPercent / 100);
                    const rowTotal = baseAmount + mcAmt;
                    
                    row.querySelector('.so-row-amount').value = rowTotal.toFixed(2);
                    
                    totalWeight += qty;
                    grandTotal += rowTotal;
                });
                
                document.getElementById('so-total-weight').textContent = totalWeight.toFixed(3);
                document.getElementById('so-grand-total').textContent = grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
            }

            document.getElementById('ord-is-fixed').addEventListener('change', calculateSOTotals);

            if (document.getElementById('add-so-item')) {
                document.getElementById('add-so-item').addEventListener('click', () => addSORow());
            }

            let currentSOFilter = 'All';

            window.filterSOTab = function(btn) {
                document.querySelectorAll('.so-tab').forEach(t => {
                    t.style.background = '#fff';
                    t.style.color = 'var(--text-main)';
                });
                btn.style.background = 'var(--primary)';
                btn.style.color = '#fff';
                currentSOFilter = btn.getAttribute('data-filter');
                renderTable();
            };

            window.filterSOTable = function() { renderTable(); };

            window.completeOrder = function(idx) {
                if (confirm("Mark this sales order as Completed?")) {
                    records[idx].status = 'Completed';
                    localStorage.setItem('manti_order_records', JSON.stringify(records));
                    renderTable();
                    
                    // Update KPI numbers
                    const sos = records.filter(o => o.type === 'Sales Order');
                    document.getElementById('kpi-so-total').textContent = sos.length;
                    document.getElementById('kpi-so-open').textContent = sos.filter(o => o.status !== 'Completed').length;
                    document.getElementById('kpi-so-completed').textContent = sos.filter(o => o.status === 'Completed').length;
                    document.getElementById('kpi-so-fixed').textContent = sos.filter(o => o.isFixed).length;
                }
            };

            function renderTable() {
                tbody.innerHTML = '';
                const search = (document.getElementById('search-orders')?.value || '').toLowerCase();
                const emptyState = document.getElementById('so-empty-state');
                const tableEl = document.getElementById('orders-table');

                const filtered = records.filter(rec => {
                    if (rec.type !== 'Sales Order') return false;
                    const status = rec.status || 'Open';
                    if (currentSOFilter !== 'All' && status !== currentSOFilter) return false;
                    if (search) {
                        const haystack = [rec.id, rec.vendor, rec.date, rec.dueDate, rec.product, 
                            rec.mainMetalType, rec.remark].join(' ').toLowerCase();
                        if (!haystack.includes(search)) return false;
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    if (emptyState) emptyState.style.display = 'block';
                    if (tableEl) tableEl.style.display = 'none';
                    return;
                }
                
                if (emptyState) emptyState.style.display = 'none';
                if (tableEl) tableEl.style.display = 'table';

                filtered.forEach((rec) => {
                    const index = records.indexOf(rec);
                    const status = rec.status || 'Open';

                    // Status chip colors
                    const statusStyles = {
                        'Open':      { bg: '#fef9c3', color: '#ca8a04', dot: '#ca8a04' },
                        'Completed': { bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
                        'Cancelled': { bg: '#fee2e2', color: '#dc2626', dot: '#dc2626' }
                    };
                    const sc = statusStyles[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };

                    // Badges
                    let catBadge = '';
                    if (rec.mainMetalType) catBadge += `<span style="font-size:0.7rem;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-weight:700;margin-right:4px;">${rec.mainMetalType}</span>`;
                    if (rec.isFixed) catBadge += `<span style="font-size:0.7rem;background:#fce7f3;color:#be185d;padding:1px 6px;border-radius:4px;font-weight:700;">Fixed Rate</span>`;

                    // Items summary
                    let itemsSummary = '', totalQty = 0;
                    if (rec.items && rec.items.length > 0) {
                        itemsSummary = rec.items.map(it => it.desc).filter(Boolean).join(' · ');
                        if (itemsSummary.length > 45) itemsSummary = itemsSummary.substring(0, 42) + '…';
                        totalQty = rec.items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
                    } else {
                        itemsSummary = rec.product || '—';
                        totalQty = parseFloat(rec.qty) || 0;
                    }

                    const amt = parseFloat(rec.amount || 0);

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="padding:13px 16px;">
                            <div style="font-weight:700;color:#0284c7;font-size:0.9rem;">${rec.id || '—'}</div>
                        </td>
                        <td style="padding:13px 16px;">
                            <div style="font-size:0.85rem;color:#374151;">${rec.date || '—'}</div>
                            ${rec.dueDate ? `<div style="font-size:0.72rem;color:#ef4444;margin-top:2px;font-weight:600;">Due: ${rec.dueDate}</div>` : ''}
                        </td>
                        <td style="padding:13px 16px;">
                            <div style="font-weight:600;color:#1f2937;font-size:0.9rem;">${rec.vendor || '—'}</div>
                        </td>
                        <td style="padding:13px 16px;max-width:220px;">
                            <div style="font-size:0.85rem;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemsSummary}</div>
                            <div style="margin-top:4px;">${catBadge}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:right;">
                            <div style="font-weight:700;color:#111827;font-size:0.9rem;">${totalQty > 0 ? totalQty.toFixed(3) : '—'}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:right;">
                            <div style="font-weight:700;color:#059669;font-size:0.9rem;">${amt > 0 ? '₹' + amt.toLocaleString('en-IN', {minimumFractionDigits:2}) : '—'}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:center;">
                            <span class="so-status-chip" style="background:${sc.bg};color:${sc.color};">
                                <span style="width:6px;height:6px;border-radius:50%;background:${sc.dot};display:inline-block;"></span>
                                ${status}
                            </span>
                        </td>
                        <td style="padding:13px 16px;text-align:center;">
                            <div style="display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;">
                                ${status === 'Open' ? `<button onclick="completeOrder(${index})" style="padding:4px 10px;font-size:0.75rem;background:var(--success);color:#fff;border-radius:6px;border:none;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:3px;" title="Complete"><i data-lucide="check" style="width:12px;height:12px;"></i> Complete</button>` : ''}
                                <button onclick="editRecord(${index})" class="btn-edit" title="Edit">
                                    <svg viewBox="0 0 512 512"><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path></svg>
                                </button>
                                <button onclick="deleteRecord(${index})" class="btn-remove" title="Delete">
                                    <svg viewBox="0 0 448 512" class="del-icon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                lucide.createIcons();
            }

            let editIndex = -1;
            window.editRecord = function(idx) {
                editIndex = idx;
                const rec = records[idx];
                document.getElementById('ord-id').value = rec.id;
                document.getElementById('ord-date').value = rec.date;
                document.getElementById('ord-due-date').value = rec.dueDate || '';
                document.getElementById('ord-vendor').value = rec.vendor;
                document.getElementById('ord-remark').value = rec.remark || '';
                document.getElementById('ord-is-fixed').checked = rec.isFixed || false;
                
                document.getElementById('so-items-body').innerHTML = '';
                if (rec.items && rec.items.length > 0) {
                    rec.items.forEach(it => addSORow(it));
                } else {
                    addSORow({
                        desc: rec.product,
                        metalType: rec.mainMetalType,
                        qty: rec.qty,
                        rate: (parseFloat(rec.amount) / parseFloat(rec.qty)) || 0,
                        mcPercent: rec.mcPercent
                    });
                }
                
                form.style.display = 'block';
                calculateSOTotals();
            };

            window.deleteRecord = function(idx) {
                if (confirm("Delete this sales order?")) {
                    records.splice(idx, 1);
                    localStorage.setItem('manti_order_records', JSON.stringify(records));
                    renderTable();
                }
            };

            toggleBtn.addEventListener('click', () => {
                form.reset();
                editIndex = -1;
                document.getElementById('so-items-body').innerHTML = '';
                addSORow();
                document.getElementById('ord-id').value = generateOrderId();
                document.getElementById('ord-date').valueAsDate = new Date();
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });

            cancelBtn.addEventListener('click', () => {
                form.style.display = 'none';
                editIndex = -1;
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const items = [];
                let totalAmount = 0;
                let totalQty = 0;
                let firstMetalType = '';
                
                const rows = document.querySelectorAll('.so-item-row');
                rows.forEach(row => {
                    const it = {
                        desc: row.querySelector('.so-desc').value,
                        metalType: row.querySelector('.so-metal-type').value,
                        qty: row.querySelector('.so-qty').value,
                        rate: row.querySelector('.so-rate').value,
                        mcPercent: row.querySelector('.so-mc').value,
                        total: row.querySelector('.so-row-amount').value
                    };
                    items.push(it);
                    totalAmount += parseFloat(it.total) || 0;
                    totalQty += parseFloat(it.qty) || 0;
                    if (!firstMetalType) firstMetalType = it.metalType;
                });

                if (items.length === 0) {
                    alert('Please add at least one item to the order.');
                    return;
                }

                const rec = {
                    id: document.getElementById('ord-id').value,
                    type: 'Sales Order',
                    date: document.getElementById('ord-date').value,
                    dueDate: document.getElementById('ord-due-date').value,
                    vendor: document.getElementById('ord-vendor').value,
                    items: items,
                    qty: totalQty.toString(),
                    amount: totalAmount.toFixed(2),
                    remark: document.getElementById('ord-remark').value,
                    isFixed: document.getElementById('ord-is-fixed').checked,
                    mainMetalType: firstMetalType,
                    status: 'Open'
                };

                if (editIndex >= 0) records[editIndex] = rec;
                else records.unshift(rec);

                localStorage.setItem('manti_order_records', JSON.stringify(records));
                form.style.display = 'none';
                renderTable();
            });

            renderTable();
        });
