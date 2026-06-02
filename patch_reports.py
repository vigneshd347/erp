import re

with open('reports.html', 'r') as f:
    content = f.read()

po_block = """                else if (type === 'purchase-orders') {
                    const filterYear = document.getElementById('report-year-filter').value;
                    const filterMonth = document.getElementById('report-month-filter').value;
                    const isYearlyMode = !isNaN(parseInt(filterYear)) && filterMonth === 'all';
                    const targetYear = parseInt(filterYear);

                    reportTitle.textContent = isYearlyMode ? `${targetYear} Yearly Purchase Orders Report` : `Purchase Orders Report`;
                    if (!isYearlyMode) document.getElementById('report-subtitle').textContent = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });
                    else document.getElementById('report-subtitle').textContent = '';

                    const allOrders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
                    const suppliers = JSON.parse(localStorage.getItem('manti_supplier_kyc_records') || '[]');
                    const supplierMap = {}; suppliers.forEach(s => supplierMap[s.id] = s.name);

                    const pos = allOrders.filter(o => o.type === 'Purchase Order' && o.status !== 'Draft' && isWithinDateFilter(o.date));

                    const totalPOs    = pos.length;
                    const openPOs     = pos.filter(o => (o.status||'Open') === 'Open').length;
                    const completedPOs= pos.filter(o => o.status === 'Completed').length;
                    const cancelledPOs= pos.filter(o => o.status === 'Cancelled').length;
                    const grandTotalAmt = pos.filter(o => o.status !== 'Cancelled').reduce((s,o) => s+(parseFloat(o.amount)||0), 0);

                    const cats = ['Stock','Assets','Consumables','Others'];
                    const catData = {}; cats.forEach(c => catData[c] = { count:0, amount:0 });
                    pos.forEach(o => {
                        const cat = cats.includes(o.category) ? o.category : 'Others';
                        catData[cat].count++; catData[cat].amount += parseFloat(o.amount)||0;
                    });

                    const statusStyle = {
                        'Open':      { bg:'#fef9c3', color:'#92400e', dot:'#d97706' },
                        'Completed': { bg:'#dcfce7', color:'#166534', dot:'#16a34a' },
                        'Cancelled': { bg:'#fee2e2', color:'#991b1b', dot:'#dc2626' }
                    };
                    const catStyle = {
                        'Stock':       { bg:'#e0f2fe', color:'#0369a1' },
                        'Assets':      { bg:'#ede9fe', color:'#7c3aed' },
                        'Consumables': { bg:'#fef3c7', color:'#92400e' },
                        'Others':      { bg:'#f3f4f6', color:'#374151' }
                    };

                    if (pos.length === 0) {
                        reportHead.innerHTML = `<tr><th>Notice</th></tr>`;
                        reportBody.innerHTML = `<tr><td style="text-align:center;padding:48px;color:#9ca3af;">No purchase orders found for this period.</td></tr>`;
                    } else if (isYearlyMode) {
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        let monthlyData = {};
                        for (let i = 0; i < 12; i++) {
                            monthlyData[i] = { pos: [], count: 0, totalAmount: 0 };
                        }
                        
                        pos.forEach(o => {
                            const d = new Date(o.date);
                            if (isNaN(d.getTime())) return;
                            const m = d.getMonth();
                            monthlyData[m].pos.push(o);
                            monthlyData[m].count++;
                            if (o.status !== 'Cancelled') {
                                monthlyData[m].totalAmount += parseFloat(o.amount) || 0;
                            }
                        });

                        let summaryHtml = `
                            <div style="margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <h3 style="margin-top: 0; margin-bottom: 10px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">${targetYear} Monthly Purchase Summary</h3>
                                <table width="100%" data-no-filter="true" style="border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="border-bottom: 1px solid #cbd5e1; color: #475569;">
                                            <th style="padding: 8px;">Month</th>
                                            <th style="padding: 8px;">Total POs</th>
                                            <th style="padding: 8px;">Amount (₹) (Excl. Cancelled)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        
                        let totalYearlyCount = 0;
                        let totalYearlyAmount = 0;
                        
                        for (let i = 0; i < 12; i++) {
                            const data = monthlyData[i];
                            const now = new Date();
                            const isPastOrCurrentMonth = (targetYear < now.getFullYear()) || (targetYear === now.getFullYear() && i <= now.getMonth());
                            
                            if (isPastOrCurrentMonth || data.count > 0) {
                                summaryHtml += `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 8px; font-weight: 500;">${monthNames[i]}</td>
                                        <td style="padding: 8px;">${data.count}</td>
                                        <td style="padding: 8px; font-weight: 600; color: #059669;">${data.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                `;
                                totalYearlyCount += data.count;
                                totalYearlyAmount += data.totalAmount;
                            }
                        }
                        
                        summaryHtml += `
                                    <tr style="background: #e2e8f0; font-weight: bold;">
                                        <td style="padding: 8px;">YEAR TOTAL</td>
                                        <td style="padding: 8px;">${totalYearlyCount}</td>
                                        <td style="padding: 8px; color: #047857;">${totalYearlyAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            <h3 style="margin-top: 0; margin-bottom: 10px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">${targetYear} Detailed Purchase Orders</h3>
                        `;
                        
                        reportHead.innerHTML = `<tr><td colspan="9" style="padding: 0;">${summaryHtml}</td></tr>`;
                        
                        let bodyHtml = '';
                        for (let i = 0; i < 12; i++) {
                            const data = monthlyData[i];
                            if (data.count === 0) continue; 
                            
                            bodyHtml += `
                                <tr style="background: #f1f5f9;">
                                    <td colspan="9" style="padding: 12px 10px; font-weight: bold; color: #0f172a; font-size: 1.05rem; border-left: 4px solid #0ea5e9;">
                                        ${monthNames[i]} ${targetYear}
                                    </td>
                                </tr>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">PO #</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Date</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Supplier</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Category</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Items</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Bill No.</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;text-align:right;">Amount (₹)</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;text-align:center;">Status</th>
                                    <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Remark</th>
                                </tr>
                            `;
                            
                            data.pos.sort((a,b) => new Date(a.date)-new Date(b.date)).forEach(o => {
                                const status = o.status || 'Open';
                                const sc = statusStyle[status] || { bg:'#f3f4f6', color:'#374151', dot:'#9ca3af' };
                                const cat = cats.includes(o.category) ? o.category : (o.category || '—');
                                const cs = catStyle[cat] || { bg:'#f3f4f6', color:'#374151' };
                                const supplierName = supplierMap[o.vendor] || o.vendor || '—';
                                const amt = parseFloat(o.amount) || 0;

                                let itemsSummary = '—';
                                if (o.items && o.items.length > 0) {
                                    itemsSummary = o.items.map(it => it.desc).filter(Boolean).join(', ');
                                    if (itemsSummary.length > 50) itemsSummary = itemsSummary.slice(0,47) + '…';
                                } else if (o.product) { itemsSummary = o.product; }

                                bodyHtml += `
                                    <tr class="po-rpt-row" data-po-status="${status}" style="border-bottom:1px solid #f3f4f6;">
                                        <td style="padding:13px 14px;font-weight:700;color:#0284c7;">${o.id||'—'}</td>
                                        <td style="padding:13px 14px;color:#374151;">${o.date||'—'}</td>
                                        <td style="padding:13px 14px;font-weight:600;color:#1f2937;">${supplierName}</td>
                                        <td style="padding:13px 14px;">${cat!=='-'?'<span style="background:'+cs.bg+';color:'+cs.color+';font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:20px;">'+cat+'</span>':'—'}</td>
                                        <td style="padding:13px 14px;color:#374151;font-size:0.84rem;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemsSummary}</td>
                                        <td style="padding:13px 14px;color:#6b7280;font-size:0.82rem;">${o.billNo||'—'}</td>
                                        <td style="padding:13px 14px;text-align:right;font-weight:700;color:#059669;">${amt>0?'₹ '+amt.toLocaleString('en-IN',{minimumFractionDigits:2}):'—'}</td>
                                        <td style="padding:13px 14px;text-align:center;">
                                            <span style="display:inline-flex;align-items:center;gap:4px;background:${sc.bg};color:${sc.color};font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:20px;">
                                                <span style="width:6px;height:6px;border-radius:50%;background:${sc.dot};flex-shrink:0;"></span>${status}
                                            </span>
                                        </td>
                                        <td style="padding:13px 14px;color:#6b7280;font-size:0.82rem;">${o.remark||'—'}</td>
                                    </tr>`;
                            });
                            
                            bodyHtml += `
                                <tr style="background: #f8fafc; font-weight: bold;">
                                    <td colspan="6" style="text-align: right; color: #475569;">${monthNames[i]} Total (Excl. Cancelled):</td>
                                    <td style="color: #059669;">₹ ${data.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    <td colspan="2"></td>
                                </tr>
                            `;
                        }
                        reportBody.innerHTML = bodyHtml;
                        window._poStatusFilter = 'All';
                    } else {
                        reportHead.innerHTML = `
                    <tr><td colspan="9" style="padding:0;border:none;">
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px 20px 14px;">
                            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
                                <div style="font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Total POs</div>
                                <div style="font-size:1.8rem;font-weight:800;color:#111827;">${totalPOs}</div>
                                <div style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">₹ ${grandTotalAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
                            </div>
                            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;">
                                <div style="font-size:0.7rem;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Open</div>
                                <div style="font-size:1.8rem;font-weight:800;color:#d97706;">${openPOs}</div>
                                <div style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">Pending receipt</div>
                            </div>
                            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;">
                                <div style="font-size:0.7rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Completed</div>
                                <div style="font-size:1.8rem;font-weight:800;color:#16a34a;">${completedPOs}</div>
                                <div style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">Received &amp; closed</div>
                            </div>
                            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;">
                                <div style="font-size:0.7rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Cancelled</div>
                                <div style="font-size:1.8rem;font-weight:800;color:#dc2626;">${cancelledPOs}</div>
                                <div style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">Voided orders</div>
                            </div>
                        </div>

                        <div style="padding:0 20px 14px;">
                            <div style="font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Category Breakdown</div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                                ${cats.map(cat => `
                                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;background:#fafafa;">
                                    <span style="background:${catStyle[cat].bg};color:${catStyle[cat].color};font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:20px;">${cat}</span>
                                    <div style="font-size:1.2rem;font-weight:800;color:#111827;margin-top:8px;">${catData[cat].count} <span style="font-size:0.72rem;color:#9ca3af;font-weight:400;">orders</span></div>
                                    <div style="font-size:0.8rem;color:#059669;font-weight:600;margin-top:2px;">₹ ${catData[cat].amount.toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
                                </div>`).join('')}
                            </div>
                        </div>

                        <div style="padding:0 20px 0;display:flex;align-items:center;gap:0;border-bottom:2px solid #f3f4f6;padding-bottom:12px;">
                            <span style="font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-right:14px;">Filter:</span>
                            ${['All','Open','Completed','Cancelled'].map((s,i) => `
                            <button onclick="window._poStatusFilter='${s}';document.querySelectorAll('.po-rpt-tab').forEach(b=>{b.style.background='#fff';b.style.color='#6b7280';b.style.fontWeight='500'});this.style.background='var(--primary)';this.style.color='#fff';this.style.fontWeight='700';document.querySelectorAll('.po-rpt-row').forEach(r=>{r.style.display=('${s}'==='All'||r.dataset.poStatus==='${s}')?'':'none'})"
                                class="po-rpt-tab"
                                style="padding:6px 16px;font-size:0.82rem;font-weight:${i===0?'700':'500'};border:1px solid #e5e7eb;border-left:${i===0?'1px':'0'} solid #e5e7eb;background:${i===0?'var(--primary)':'#fff'};color:${i===0?'#fff':'#6b7280'};cursor:pointer;${i===0?'border-radius:6px 0 0 6px;':i===3?'border-radius:0 6px 6px 0;':''}">${s}</button>`).join('')}
                        </div>
                    </td></tr>
                    <tr style="background:#f8fafc;">
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">PO #</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Date</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Supplier</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Category</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Items</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Bill No.</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;text-align:right;">Amount (₹)</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;text-align:center;">Status</th>
                        <th style="padding:11px 14px;font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Remark</th>
                    </tr>`;

                        let bodyHtml = '';
                        let totalExclCancelled = 0;
                        pos.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(o => {
                            const status = o.status || 'Open';
                            const sc = statusStyle[status] || { bg:'#f3f4f6', color:'#374151', dot:'#9ca3af' };
                            const cat = cats.includes(o.category) ? o.category : (o.category || '—');
                            const cs = catStyle[cat] || { bg:'#f3f4f6', color:'#374151' };
                            const supplierName = supplierMap[o.vendor] || o.vendor || '—';
                            const amt = parseFloat(o.amount) || 0;
                            if (status !== 'Cancelled') totalExclCancelled += amt;

                            let itemsSummary = '—';
                            if (o.items && o.items.length > 0) {
                                itemsSummary = o.items.map(it => it.desc).filter(Boolean).join(', ');
                                if (itemsSummary.length > 50) itemsSummary = itemsSummary.slice(0,47) + '…';
                            } else if (o.product) { itemsSummary = o.product; }

                            bodyHtml += `<tr class="po-rpt-row" data-po-status="${status}" style="border-bottom:1px solid #f3f4f6;">
                                <td style="padding:13px 14px;font-weight:700;color:#0284c7;">${o.id||'—'}</td>
                                <td style="padding:13px 14px;color:#374151;">${o.date||'—'}</td>
                                <td style="padding:13px 14px;font-weight:600;color:#1f2937;">${supplierName}</td>
                                <td style="padding:13px 14px;">${cat!=='-'?'<span style="background:'+cs.bg+';color:'+cs.color+';font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:20px;">'+cat+'</span>':'—'}</td>
                                <td style="padding:13px 14px;color:#374151;font-size:0.84rem;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemsSummary}</td>
                                <td style="padding:13px 14px;color:#6b7280;font-size:0.82rem;">${o.billNo||'—'}</td>
                                <td style="padding:13px 14px;text-align:right;font-weight:700;color:#059669;">${amt>0?'₹ '+amt.toLocaleString('en-IN',{minimumFractionDigits:2}):'—'}</td>
                                <td style="padding:13px 14px;text-align:center;">
                                    <span style="display:inline-flex;align-items:center;gap:4px;background:${sc.bg};color:${sc.color};font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:20px;">
                                        <span style="width:6px;height:6px;border-radius:50%;background:${sc.dot};flex-shrink:0;"></span>${status}
                                    </span>
                                </td>
                                <td style="padding:13px 14px;color:#6b7280;font-size:0.82rem;">${o.remark||'—'}</td>
                            </tr>`;
                        });

                        bodyHtml += `<tr style="background:#f8fafc;border-top:2px solid #e5e7eb;">
                            <td colspan="6" style="padding:14px;text-align:right;font-weight:700;color:#374151;">Grand Total (excl. Cancelled):</td>
                            <td style="padding:14px;text-align:right;font-weight:800;color:#059669;font-size:1rem;">₹ ${totalExclCancelled.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                            <td colspan="2"></td>
                        </tr>`;
                        reportBody.innerHTML = bodyHtml;
                        window._poStatusFilter = 'All';
                    }
                }
"""

# Extract the existing purchase-orders block from reports.html
start_idx = content.find("                else if (type === 'purchase-orders') {")
end_idx = content.find("                else if (type === 'finance-summary') {")
if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + po_block + content[end_idx:]
    with open('reports.html', 'w') as f:
        f.write(new_content)
    print("Patched reports.html")
else:
    print("Could not find the bounds for patching.")

