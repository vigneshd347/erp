let records = [];

        function updatePOKPIs() {
            const pos = records.filter(o => o.type === 'Purchase Order');
            document.getElementById('kpi-po-total').textContent = pos.length;
            document.getElementById('kpi-po-open').textContent = pos.filter(o => {
                const s = o.status || 'Open';
                if(s === 'Completed' || s === 'Cancelled') return false;
                const amt = parseFloat(o.amount || 0);
                const paid = parseFloat(o.paidAmount || 0);
                return (amt - paid) > 0.001 || amt === 0;
            }).length;
            document.getElementById('kpi-po-completed').textContent = pos.filter(o => o.status === 'Completed').length;
            document.getElementById('kpi-po-assets').textContent = pos.filter(o => o.category === 'Assets').length;
        }

        document.addEventListener('CloudDataLoaded', () => {
            // Reload records from cloud-populated RAM
            records = JSON.parse(localStorage.getItem('manti_order_records') || '[]');
            updatePOKPIs();

            // Load rates
            const savedRates = localStorage.getItem('manti_metal_rates');
            if (savedRates) {
                const rates = JSON.parse(savedRates);
                const goldRateEl = document.getElementById('p-gold-rate-header');
                if (goldRateEl) goldRateEl.textContent = '₹ ' + (rates.pureGold || 0).toLocaleString();

                const silverRateEl = document.getElementById('p-silver-rate-header');
                if (silverRateEl) silverRateEl.textContent = '₹ ' + (rates.pureSilver || 0).toLocaleString();
            }

            const isFixedCb = document.getElementById('ord-is-fixed');
            const mainMetalSelect = document.getElementById('ord-main-metal-type');
            const typeSelect = document.getElementById('ord-type');
            const qtyInput = document.getElementById('ord-qty');

            // Load Suppliers for Dropdown
            const vendorSelect = document.getElementById('ord-vendor');
            const vendors = JSON.parse(localStorage.getItem('manti_supplier_kyc_records')) || [];
            if (vendors.length === 0) {
                const opt = document.createElement('option');
                opt.value = "";
                opt.textContent = "No suppliers found. Please add in KYC.";
                opt.disabled = true;
                vendorSelect.appendChild(opt);
            } else {
                vendors.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.id;
                    opt.textContent = v.name ? `${v.name} (${v.id})` : v.id;
                    vendorSelect.appendChild(opt);
                });
            }

            // Multi-Item PO Table Logic
            const poItemsBody = document.getElementById('po-items-body');
            const addPoItemBtn = document.getElementById('add-po-item');
            
            function addPORow(itemData = {}) {
                const tr = document.createElement('tr');
                tr.classList.add('po-item-row');
                const rowCount = poItemsBody.rows.length + 1;
                
                tr.innerHTML = `
                    <td class="item-details-cell" style="padding: 12px; vertical-align: top;">
                        <div style="display: flex; gap: 16px; align-items: flex-start;">
                            <div class="po-detail-image-upload-wrapper" style="position: relative; width: 64px; height: 64px; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                <div class="po-detail-preview-container" style="display: ${itemData.detailImageUrl ? 'block' : 'none'}; width: 100%; height: 100%;">
                                    <img src="${itemData.detailImageUrl || ''}" class="po-detail-preview" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div class="upload-placeholder" style="display: ${itemData.detailImageUrl ? 'none' : 'block'}; color: #9ca3af;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                </div>
                                <input type="file" class="po-detail-photo" accept="image/*" style="opacity: 0; position: absolute; inset: 0; cursor: pointer; width: 100%; height: 100%;" title="Upload Detail Image">
                            </div>
                            
                            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px;">
                                <textarea class="po-desc input-wrapper" placeholder="Add a description to your item" style="width: 100%; border: none; background: transparent; padding: 4px; min-height: 48px; font-size: 0.95rem; resize: none; color: #1f2937;">${itemData.desc || ''}</textarea>
                                <input type="hidden" class="po-detail-imageUrl" value="${itemData.detailImageUrl || ''}">
                                <div class="po-detail-status" style="font-size: 0.72rem; color: #0284c7; font-weight: 600;"></div>
                            </div>
                        </div>
                    </td>
                    <td class="design-img-cell" style="display: none; padding: 12px; vertical-align: top; width: 140px;">
                        <div class="po-design-preview-container" style="display: ${itemData.designImageUrl ? 'block' : 'none'}; margin-bottom: 8px;">
                            <img src="${itemData.designImageUrl || ''}" class="po-design-preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        </div>
                        <input type="file" class="po-design-photo" accept="image/*" style="font-size: 0.7rem; width: 100%; margin-bottom: 4px;" title="Change Design">
                        <input type="hidden" class="po-design-imageUrl" value="${itemData.designImageUrl || ''}">
                        <div class="po-design-status" style="font-size: 0.7rem; color: #0284c7; font-weight: 600;"></div>
                    </td>
                    <td class="design-size-cell" style="display: none; padding: 12px; vertical-align: middle; width: 100px;">
                        <input type="text" class="po-design-size input-wrapper" placeholder="Size (e.g. 14)" value="${itemData.designSize || ''}" style="width: 100%; text-align: center; border:1px solid #d1d5db; background: #fff; padding: 6px; font-size: 0.8rem; border-radius:4px;">
                    </td>
                    <td class="design-wt-cell" style="display: none; padding: 12px; vertical-align: middle; width: 100px;">
                        <input type="number" step="0.01" class="po-design-wt input-wrapper" placeholder="Wt (g)" value="${itemData.designWt || ''}" style="width: 100%; text-align: center; border: 1px solid #d1d5db; background: #fff; padding: 6px; font-size: 0.8rem; border-radius:4px;">
                    </td>
                    <td class="qty-cell" style="padding: 12px; vertical-align: middle;">
                        <input type="number" step="0.001" class="po-qty input-wrapper" placeholder="0.000" value="${itemData.qty || ''}" style="width: 100%; text-align: center; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: middle;">
                        <input type="number" step="0.01" class="po-rate input-wrapper" placeholder="0.00" value="${itemData.rate || ''}" style="width: 100%; text-align: center; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: middle;">
                        <input type="number" step="0.1" class="po-gst input-wrapper" placeholder="3" value="${itemData.gst || '3'}" style="width: 100%; text-align: center; border: none; background: transparent; padding: 0;">
                    </td>
                    <td style="padding: 12px; vertical-align: middle;">
                        <input type="text" class="po-row-amount input-wrapper" placeholder="0.00" readonly style="width: 100%; text-align: center; border: none; background: transparent; padding: 0; font-weight: 600;">
                    </td>
                    <td style="padding: 12px; vertical-align: middle; text-align: center;">
                        <button type="button" class="btn-remove-sm" onclick="this.closest('tr').remove(); calculatePOTotals();">×</button>
                    </td>
                `;
                
                poItemsBody.appendChild(tr);
                
                // Add calculation listeners
                tr.querySelectorAll('input, textarea').forEach(input => {
                    input.addEventListener('input', calculatePOTotals);
                });
                
                const fileInput = tr.querySelector('.po-design-photo');
                const urlInput = tr.querySelector('.po-design-imageUrl');
                const statusDiv = tr.querySelector('.po-design-status');
                
                if (fileInput) {
                    fileInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const objectUrl = URL.createObjectURL(file);
                        const previewContainer = tr.querySelector('.po-design-preview-container');
                        const previewImg = tr.querySelector('.po-design-preview');
                        if (previewContainer && previewImg) {
                            previewImg.src = objectUrl;
                            previewContainer.style.display = 'block';
                        }
                        
                        statusDiv.textContent = 'Pending save & upload';
                        statusDiv.style.color = '#ca8a04';
                    });
                }
                
                const detailFileInput = tr.querySelector('.po-detail-photo');
                const detailStatusDiv = tr.querySelector('.po-detail-status');

                if (detailFileInput) {
                    detailFileInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const objectUrl = URL.createObjectURL(file);
                        const previewContainer = tr.querySelector('.po-detail-preview-container');
                        const previewImg = tr.querySelector('.po-detail-preview');
                        if (previewContainer && previewImg) {
                            previewImg.src = objectUrl;
                            previewContainer.style.display = 'block';
                            const placeholder = tr.querySelector('.upload-placeholder');
                            if (placeholder) placeholder.style.display = 'none';
                        }
                        
                        if(detailStatusDiv) {
                            detailStatusDiv.textContent = 'Pending save & upload';
                            detailStatusDiv.style.color = '#ca8a04';
                        }
                    });
                }
                

                // Show size conditionally immediately if creating from data
                const ordCat = document.getElementById('ord-category');
                const ordSubCat = document.getElementById('ord-design-sub-category');
                if (ordCat && ordCat.value === 'Design') {
                    tr.querySelector('.design-img-cell').style.display = 'table-cell';
                    tr.querySelector('.design-wt-cell').style.display = 'table-cell';
                    tr.querySelector('.item-details-cell').style.display = 'table-cell';
                    tr.querySelector('.qty-cell').style.display = 'none';
                    tr.querySelector('.po-qty').value = tr.querySelector('.po-qty').value || '1';
                    tr.querySelector('.po-desc').value = tr.querySelector('.po-desc').value || ordSubCat?.value || 'Design Item';
                    if (ordSubCat && ['Ring', 'Bangle', 'Bracelet'].includes(ordSubCat.value)) {
                        tr.querySelector('.design-size-cell').style.display = 'table-cell';
                    }
                } else {
                    tr.querySelector('.po-desc').required = true;
                    tr.querySelector('.po-qty').required = true;
                }


                
                calculatePOTotals();
            }

            function calculatePOTotals(sourceInput = null) {
                let subtotal = 0;
                let gstTotal = 0;
                
                const rows = poItemsBody.querySelectorAll('.po-item-row');
                rows.forEach(row => {
                    const qty = parseFloat(row.querySelector('.po-qty').value) || 0;
                    const rate = parseFloat(row.querySelector('.po-rate').value) || 0;
                    const gstPercent = parseFloat(row.querySelector('.po-gst').value) || 0;
                    
                    const rowSubtotal = qty * rate;
                    const rowGst = rowSubtotal * (gstPercent / 100);
                    const rowTotal = rowSubtotal + rowGst;
                    
                    row.querySelector('.po-row-amount').value = rowTotal.toFixed(2);
                    
                    subtotal += rowSubtotal;
                    gstTotal += rowGst;
                });
                
                const discPercentInput = document.getElementById('po-discount-percent');
                const discAmountInput = document.getElementById('po-discount-amount');
                let discountAmount = 0;

                if (discPercentInput && discAmountInput) {
                    if (sourceInput === discPercentInput) {
                        const pct = parseFloat(discPercentInput.value) || 0;
                        discountAmount = subtotal * (pct / 100);
                        if (discPercentInput.value !== '') {
                            discAmountInput.value = discountAmount.toFixed(2);
                        } else {
                            discAmountInput.value = '';
                            discountAmount = 0;
                        }
                    } else if (sourceInput === discAmountInput) {
                        discountAmount = parseFloat(discAmountInput.value) || 0;
                        if (subtotal > 0 && discAmountInput.value !== '') {
                            discPercentInput.value = ((discountAmount / subtotal) * 100).toFixed(2);
                        } else {
                            discPercentInput.value = '';
                        }
                    } else {
                        discountAmount = parseFloat(discAmountInput.value) || 0;
                        if (subtotal > 0 && discAmountInput.value !== '') {
                            discPercentInput.value = ((discountAmount / subtotal) * 100).toFixed(2);
                        } else if (discPercentInput.value !== '') {
                            const pct = parseFloat(discPercentInput.value) || 0;
                            discountAmount = subtotal * (pct / 100);
                            discAmountInput.value = discountAmount.toFixed(2);
                        }
                    }
                }
                
                const grandTotal = subtotal - discountAmount + gstTotal;
                
                document.getElementById('po-sub-total').textContent = subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                document.getElementById('po-gst-total').textContent = gstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                document.getElementById('po-grand-total').textContent = grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
            }

            if (addPoItemBtn) {
                addPoItemBtn.addEventListener('click', () => addPORow());
            }

            // Order Management Logic
            const form = document.getElementById('order-form');
            const toggleBtn = document.getElementById('add-order-btn');
            const cancelBtn = document.getElementById('cancel-order');
            const tbody = document.getElementById('orders-body');

            // Removed SO Fixed Amount logic as POs now use multi-item table
            function calculateFixedAmount() {
                // Legacy for SO - removal in progress
            }

            if (isFixedCb && qtyInput) {
                [isFixedCb, document.getElementById('ord-main-metal-type'), qtyInput].forEach(el => {
                    if (el) {
                        el.addEventListener('input', calculateFixedAmount);
                        el.addEventListener('change', calculateFixedAmount);
                    }
                });
            }

            function generateOrderId(type) {
                let prefix = type === 'Purchase Order' ? 'PO-' : 'SO-';
                let maxId = 0;
                records.forEach(rec => {
                    if (rec.id && rec.id.startsWith(prefix)) {
                        const num = parseInt(rec.id.replace(prefix, ''), 10);
                        if (!isNaN(num) && num > maxId) {
                            maxId = num;
                        }
                    }
                });
                return prefix + ((maxId + 1).toString().padStart(4, '0'));
            }

            function toggleTypeDetails() {
                const poCategoryContainer = document.getElementById('po-category-container');
                const ordCategory = document.getElementById('ord-category');
                const metalTypeContainer = document.getElementById('ord-metal-type-container');

                if (poCategoryContainer) poCategoryContainer.style.display = 'block';
                
                const designSubCategoryContainer = document.getElementById('ord-design-sub-category-container');
                const designSubCatEl = document.getElementById('ord-design-sub-category');

                if (ordCategory && ordCategory.value === 'Design') {
                    if (designSubCategoryContainer) designSubCategoryContainer.style.display = 'block';
                    if (designSubCatEl) designSubCatEl.required = true;
                    if (metalTypeContainer) metalTypeContainer.style.display = 'none';
                    if (document.getElementById('ord-asset-type-container')) document.getElementById('ord-asset-type-container').style.display = 'none';
                    document.getElementById('ord-main-metal-type').required = false;
                    
                    document.querySelectorAll('.design-wt-col, .design-wt-cell').forEach(el => el.style.display = 'table-cell');
                    document.querySelectorAll('.item-details-col, .item-details-cell').forEach(el => el.style.display = 'table-cell');
                    document.querySelectorAll('.qty-col, .qty-cell').forEach(el => el.style.display = 'none');
                    
                    document.querySelectorAll('.po-qty').forEach(el => { el.required = false; if(!el.value) el.value = '1'; });
                    document.querySelectorAll('.po-desc').forEach(el => { 
                        el.required = false; 
                        if(!el.value || el.value === 'Design Item') el.value = designSubCatEl?.value || 'Design Item'; 
                    });
                    
                    const showSize = designSubCatEl && ['Ring', 'Bangle', 'Bracelet'].includes(designSubCatEl.value);
                    document.querySelectorAll('.design-size-col, .design-size-cell').forEach(el => el.style.display = showSize ? 'table-cell' : 'none');
                } else {
                    if (designSubCategoryContainer) designSubCategoryContainer.style.display = 'none';
                    if (designSubCatEl) { designSubCatEl.required = false; designSubCatEl.value = ''; }
                    document.querySelectorAll('.design-wt-col, .design-wt-cell, .design-size-col, .design-size-cell').forEach(el => el.style.display = 'none');
                    
                    document.querySelectorAll('.item-details-col, .item-details-cell').forEach(el => el.style.display = 'table-cell');
                    document.querySelectorAll('.qty-col, .qty-cell').forEach(el => el.style.display = 'table-cell');
                    document.querySelectorAll('.po-desc').forEach(el => { el.required = true; });
                    document.querySelectorAll('.po-qty').forEach(el => { el.required = true; });
                }

                if (ordCategory && ordCategory.value === 'Stock') {
                    if (metalTypeContainer) metalTypeContainer.style.display = 'block';
                    mainMetalSelect.required = true;
                } else if (ordCategory && ordCategory.value === 'Assets') {
                    if (metalTypeContainer) metalTypeContainer.style.display = 'none';
                    if (document.getElementById('ord-asset-type-container')) {
                        document.getElementById('ord-asset-type-container').style.display = 'block';
                    }
                    mainMetalSelect.required = false;
                    mainMetalSelect.value = '';
                } else {
                    if (metalTypeContainer) metalTypeContainer.style.display = 'none';
                    if (document.getElementById('ord-asset-type-container')) {
                        document.getElementById('ord-asset-type-container').style.display = 'none';
                    }
                    mainMetalSelect.required = false;
                    mainMetalSelect.value = '';
                }
            }

            // Listen for Category changes to toggle Metal Type
            if (document.getElementById('ord-category')) {
                document.getElementById('ord-category').addEventListener('change', (e) => {
                    localStorage.setItem('manti_last_ord_category', e.target.value);
                    toggleTypeDetails();
                });
            }
            if (document.getElementById('ord-design-sub-category')) {
                document.getElementById('ord-design-sub-category').addEventListener('change', () => {
                    toggleTypeDetails();
                });
            }


            if (typeSelect) {
                typeSelect.value = 'Purchase Order';
                typeSelect.disabled = true;
                typeSelect.style.background = '#f3f4f6';
            }

            let currentPOFilter = 'All';

            window.filterPOTab = function(btn) {
                document.querySelectorAll('.po-tab').forEach(t => {
                    t.style.background = '#fff';
                    t.style.color = 'var(--text-muted)';
                });
                btn.style.background = 'var(--primary)';
                btn.style.color = '#fff';
                currentPOFilter = btn.getAttribute('data-filter');
                renderTable();
            };

            window.filterPOTable = function() { renderTable(); };

            function renderTable() {
                tbody.innerHTML = '';
                const search = (document.getElementById('search-purchases')?.value || '').toLowerCase();
                const emptyState = document.getElementById('po-empty-state');

                const vendorMap = {};
                vendors.forEach(v => vendorMap[v.id] = v.name);

                const filtered = records.filter(rec => {
                    if (rec.type !== 'Purchase Order') return false;
                    let derivedStatus = rec.status || 'Open';
                    if (derivedStatus === 'Open') {
                        const amt = parseFloat(rec.amount || 0);
                        const paid = parseFloat(rec.paidAmount || 0);
                        if (amt > 0 && (amt - paid) <= 0.001) derivedStatus = 'Paid';
                        else derivedStatus = 'Payment Pending';
                    }
                    if (currentPOFilter !== 'All' && derivedStatus !== currentPOFilter) return false;
                    if (search) {
                        const haystack = [rec.id, rec.vendor, rec.date, rec.dueDate, rec.billNo, rec.category,
                            rec.mainMetalType, rec.remark,
                            ...(rec.items || []).map(i => i.desc)].join(' ').toLowerCase();
                        if (!haystack.includes(search)) return false;
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    if (emptyState) emptyState.style.display = 'block';
                    return;
                }
                if (emptyState) emptyState.style.display = 'none';

                filtered.forEach((rec) => {
                    const index = records.indexOf(rec);
                    let derivedStatus = rec.status || 'Open';
                    
                    const amt = parseFloat(rec.amount || 0);
                    const paid = parseFloat(rec.paidAmount || 0);
                    const due = amt - paid;

                    if (derivedStatus === 'Open') {
                        if (due <= 0.001 && amt > 0) derivedStatus = 'Paid';
                        else derivedStatus = 'Payment Pending';
                    }

                    // Status chip colors
                    const statusStyles = {
                        'Payment Pending': { bg: '#fee2e2', color: '#ef4444', dot: '#ef4444' },
                        'Paid':            { bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
                        'Completed':       { bg: '#e0e7ff', color: '#4f46e5', dot: '#4f46e5' },
                        'Cancelled':       { bg: '#f3f4f6', color: '#6b7280', dot: '#6b7280' }
                    };
                    const sc = statusStyles[derivedStatus] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };

                    // Items summary
                    let itemsSummary = '', totalQty = 0, imageHtml = '';
                    if (rec.items && rec.items.length > 0) {
                        itemsSummary = rec.items.map(it => it.desc).filter(Boolean).join(' · ');
                        if (itemsSummary.length > 45) itemsSummary = itemsSummary.substring(0, 42) + '…';
                        totalQty = rec.items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
                        
                        const images = rec.items.map(it => it.detailImageUrl || it.designImageUrl).filter(Boolean);
                        if (images.length > 0) {
                            imageHtml = '<div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">';
                            images.slice(0, 3).forEach(img => {
                                imageHtml += `<a href="${img}" target="_blank"><img src="${img}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05);" title="View Image"></a>`;
                            });
                            if (images.length > 3) {
                                imageHtml += `<div style="width:36px; height:36px; border-radius:4px; background:#f3f4f6; border:1px solid #e5e7eb; color:#6b7280; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700;">+${images.length - 3}</div>`;
                            }
                            imageHtml += '</div>';
                        }
                    } else {
                        itemsSummary = rec.product || '—';
                        totalQty = parseFloat(rec.qty) || 0;
                    }

                    // Amount + payment status
                    const amt = parseFloat(rec.amount || 0);
                    const paid = parseFloat(rec.paidAmount || 0);
                    const due = amt - paid;
                    let payBadge = '';
                    if (amt > 0) {
                        if (due <= 0.001) payBadge = `<span style="font-size:0.7rem;color:#16a34a;font-weight:700;"> ✓ Paid</span>`;
                    }

                    // Category + metal badges
                    let catBadge = '';
                    if (rec.category) catBadge += `<span style="font-size:0.7rem;background:#e0e7ff;color:#4338ca;padding:1px 6px;border-radius:4px;font-weight:700;margin-left:4px;">${rec.category}</span>`;
                    if (rec.mainMetalType) catBadge += `<span style="font-size:0.7rem;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-weight:700;margin-left:4px;">${rec.mainMetalType}</span>`;

                    const tr = document.createElement('tr');
                    tr.setAttribute('data-status', derivedStatus);
                    tr.innerHTML = `
                        <td style="padding:13px 16px;">
                            <div style="font-weight:700;color:#0284c7;font-size:0.9rem;">${rec.id || '—'}</div>
                            ${rec.billNo ? `<div style="font-size:0.72rem;color:#9ca3af;margin-top:2px;">Bill: ${rec.billNo}</div>` : ''}
                            ${rec.billImageUrl ? `<div style="margin-top:4px;"><a href="${rec.billImageUrl}" target="_blank" style="font-size:0.7rem;color:#0ea5e9;text-decoration:underline;display:inline-flex;align-items:center;gap:3px;"><i data-lucide="paperclip" style="width:10px;height:10px;"></i> View Bill</a></div>` : ''}
                        </td>
                        <td style="padding:13px 16px;">
                            <div style="font-size:0.85rem;color:#374151;">${rec.date || '—'}</div>
                            ${rec.dueDate ? `<div style="font-size:0.72rem;color:#9ca3af;margin-top:2px;">Due: ${rec.dueDate}</div>` : ''}
                        </td>
                        <td style="padding:13px 16px;">
                            <div style="font-weight:600;color:#1f2937;font-size:0.9rem;">${vendorMap[rec.vendor] || rec.vendor || '—'}</div>
                        </td>
                        <td style="padding:13px 16px;max-width:220px;">
                            <div style="font-size:0.85rem;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${itemsSummary.replace(/"/g, '&quot;')}">${itemsSummary}</div>
                            ${imageHtml}
                            <div style="margin-top:5px;">${catBadge}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:right;">
                            <div style="font-weight:700;color:#111827;font-size:0.9rem;">${totalQty > 0 ? totalQty.toFixed(3) : '—'}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:right;">
                            <div style="font-weight:700;color:#059669;font-size:0.9rem;">${amt > 0 ? '₹' + amt.toLocaleString('en-IN', {minimumFractionDigits:2}) : '—'}</div>
                            <div>${payBadge}</div>
                        </td>
                        <td style="padding:13px 16px;text-align:center;">
                            <span class="po-status-chip" style="background:${sc.bg};color:${sc.color};">
                                <span style="width:6px;height:6px;border-radius:50%;background:${sc.dot};display:inline-block;"></span>
                                ${derivedStatus}
                            </span>
                        </td>
                        <td style="padding:13px 16px;text-align:center;">
                            <div style="display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;">
                                ${(derivedStatus === 'Payment Pending' || derivedStatus === 'Paid') ? `<button onclick="receiveOrder(${index})" style="padding:4px 10px;font-size:0.75rem;background:#10b981;color:#fff;border-radius:6px;border:none;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:3px;" title="Mark Received"><i data-lucide="check" style="width:12px;height:12px;"></i> Receive</button>` : ''}
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

            window.editRecord = function (index) {
                const rec = records[index];
                document.getElementById('ord-type').value = rec.type;
                document.getElementById('ord-id').value = rec.id || '';
                document.getElementById('ord-date').value = rec.date;
                document.getElementById('ord-due-date').value = rec.dueDate;
                document.getElementById('ord-vendor').value = rec.vendor;
                document.getElementById('ord-bill-no').value = rec.billNo || '';

                const billPhotoInput = document.getElementById('ord-bill-photo');
                const billUrlInput = document.getElementById('ord-bill-imageUrl');
                const billPreviewContainer = document.getElementById('ord-bill-preview-container');
                const billPreview = document.getElementById('ord-bill-preview');
                const billStatus = document.getElementById('ord-bill-status');
                
                if (billPhotoInput) billPhotoInput.value = '';
                if (billStatus) billStatus.textContent = '';
                if (billUrlInput) billUrlInput.value = rec.billImageUrl || '';
                if (billPreviewContainer && billPreview) {
                    if (rec.billImageUrl) {
                        billPreview.src = rec.billImageUrl;
                        billPreviewContainer.style.display = 'block';
                    } else {
                        billPreview.src = '';
                        billPreviewContainer.style.display = 'none';
                    }
                }
                
                if (document.getElementById('ord-category')) {
                    document.getElementById('ord-category').value = rec.category || '';
                }
                if (document.getElementById('ord-design-sub-category')) {
                    document.getElementById('ord-design-sub-category').value = rec.designSubCategory || '';
                }
                
                document.getElementById('ord-main-metal-type').value = rec.mainMetalType || '';
                document.getElementById('ord-remark').value = rec.remark || '';
                document.getElementById('ord-status').value = rec.status || 'Open';

                const discPercentInput = document.getElementById('po-discount-percent');
                const discAmountInput = document.getElementById('po-discount-amount');
                if (discPercentInput) discPercentInput.value = rec.discountPercent || '';
                if (discAmountInput) discAmountInput.value = rec.discountAmount || '';

                // Reload items into table
                poItemsBody.innerHTML = '';
                if (rec.items && rec.items.length > 0) {
                    rec.items.forEach(it => addPORow(it));
                } else {
                    // Legacy single item support
                    addPORow({
                        desc: rec.product,
                        qty: rec.qty,
                        rate: (parseFloat(rec.amount) / parseFloat(rec.qty)) || 0,
                        gst: 3
                    });
                }

                editIndex = index;
                form.style.display = 'block';
                toggleTypeDetails();
            };

            window.deleteRecord = function (index) {
                const rec = records[index];

                // Safegaurd: Prevent deletion if linked stock/asset still exists
                if (rec.status === 'Completed') {
                    if (rec.category === 'Assets') {
                        const assets = JSON.parse(localStorage.getItem('manti_assets')) || [];
                        const hasAsset = assets.some(a => a.notes && a.notes.includes(rec.id));
                        if (hasAsset) {
                            alert("Cannot delete this completed Purchase Order. You must first delete the corresponding auto-created Asset(s) from the Asset Management page.");
                            return;
                        }
                    } else if (rec.category === 'Stock') {
                        const history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
                        const hasStock = history.some(h => (h.note && h.note.includes(rec.id)) || (h.details && h.details.includes(rec.id)));
                        if (hasStock) {
                            alert("Cannot delete this completed Purchase Order. You must first delete the corresponding Stock entry from the Stock Management page.");
                            return;
                        }
                    }
                }

                if (confirm("Delete this order?")) {
                    if (rec && rec.id && window.supabase) {
                        window.supabase.from('orders').delete().match({ order_number: rec.id })
                            .then(({error}) => { if (error) console.error("Cloud delete error", error); });
                    }
                    records.splice(index, 1);
                    localStorage.setItem('manti_order_records', JSON.stringify(records));
                    renderTable();
                }
            };

            function syncCompletedPO(rec) {
                if (rec.status !== 'Completed') return;

                if (rec.category === 'Design' && rec.items && rec.items.length > 0) {
                    let designs = JSON.parse(localStorage.getItem('manti_designs')) || [];
                    const noteStr = 'Auto-added from PO: ' + rec.id;
                    
                    // Prevent duplicate sync
                    // We don't have a remarks/notes field per design natively in the schema, but we can store it or check if items exist.
                    // For safety, let's look if a design with this generated ID or source note exists.
                    if (designs.some(d => d._sourcePO === rec.id)) {
                        return; // already synced
                    }

                    let addedCount = 0;
                    
                    rec.items.forEach((it) => {
                        const q = parseInt(it.qty, 10) || 1;
                        for(let k = 0; k < q; k++) {
                            // Find next ID based on category prefixes (DSG, BG, RG, ER, NK...)
                            const subCat = rec.designSubCategory || 'Other';
                            
                            let prefix = 'DSG';
                            if (subCat === 'Bangle' || subCat === 'Bracelet') prefix = 'BG';
                            else if (subCat === 'Ring') prefix = 'RG';
                            else if (subCat === 'Earring') prefix = 'ER';
                            else if (subCat === 'Necklace') prefix = 'NK';
                            else if (subCat === 'Mix') prefix = 'MX';

                            let maxIdNum = 0;
                            designs.forEach(d => {
                                if (d.id && d.id.startsWith(prefix)) {
                                    const match = d.id.match(new RegExp(`^${prefix}(\\d+)`));
                                    if (match) {
                                        const num = parseInt(match[1], 10);
                                        if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
                                    }
                                }
                            });

                            const countStr = (maxIdNum + 1).toString().padStart(2, '0');
                            let idStr = `${prefix}${countStr}`;
                            
                            const wt = parseFloat(it.designWt) || 0;
                            if (wt > 0) idStr += `-${wt}`;
                            if (it.designSize) idStr += `-${it.designSize}`;

                            designs.unshift({
                                id: idStr,
                                category: subCat === 'Bracelet' ? 'Bangle' : subCat, // Map bracelet to Bangle or keep it? Mapped to subCat.
                                subCategory: subCat === 'Ring' ? 'Ladies ring' : null, // Default
                                weight: wt,
                                size: it.designSize || '',
                                imageUrl: it.detailImageUrl || it.designImageUrl || '',
                                _sourcePO: rec.id 
                            });
                            addedCount++;
                        }
                    });

                    if (addedCount > 0) {
                        localStorage.setItem('manti_designs', JSON.stringify(designs));
                        alert(`${addedCount} new Design(s) routed to Design Book!`);
                        if(window.supabase && window.syncKeyToSupabase) {
                            window.syncKeyToSupabase('manti_designs', designs);
                        }
                    }

                } else if (rec.category === 'Assets' && rec.items && rec.items.length > 0) {
                    let assets = JSON.parse(localStorage.getItem('manti_assets')) || [];
                    const noteStr = 'Auto-added from PO: ' + rec.id;
                    
                    // Prevent duplicate execution if this PO has already been synced
                    if (assets.some(a => a.notes && a.notes.includes(noteStr))) {
                        return;
                    }

                    let addedCount = 0;
                    
                    rec.items.forEach((it) => {
                        const q = parseInt(it.qty, 10) || 1;
                        const perItemTotal = (parseFloat(it.total) || 0) / q;
                        
                        // For each unit in quantity, create an individual asset
                        for(let k = 0; k < q; k++) {
                            // Find next valid ID starting from 0001
                            let maxId = 0;
                            assets.forEach(a => {
                                if (a.id && a.id.startsWith('AST-')) {
                                    let num = parseInt(a.id.replace('AST-', ''), 10);
                                    if (!isNaN(num) && num > maxId) maxId = num;
                                }
                            });
                            let newAssetId = 'AST-' + (maxId + 1).toString().padStart(4, '0');

                            if (perItemTotal > 0) {
                                assets.push({
                                    id: newAssetId,
                                    name: it.desc + (q > 1 ? ` (#${k + 1})` : ''),
                                    category: rec.assetType || 'Other',     
                                    status: 'Pending Approval',
                                    date: rec.date,
                                    value: perItemTotal.toFixed(2),
                                    notes: noteStr,
                                    imageUrl: it.detailImageUrl || it.designImageUrl || ''
                                });
                                addedCount++;
                            }
                        }
                    });
                    
                    if (addedCount > 0) {
                        localStorage.setItem('manti_assets', JSON.stringify(assets));
                        alert(`${addedCount} new Asset(s) routed to Asset Management for Approval!`);
                        
                        // Force cloud push for newly auto-generated assets
                        if(window.supabase && window.syncKeyToSupabase) {
                            window.syncKeyToSupabase('manti_assets', assets);
                        }
                    }
                } else if (rec.category === 'Stock') {
                    const mainMetal = rec.mainMetalType || 'Gold';
                    const mappedMetal = mainMetal === 'Silver' ? 'silver_925' : 'gold_22k';
                    
                    const history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
                    const noteStr = 'Auto PO: ' + rec.id;
                    
                    // Prevent duplicate stock addition
                    if (!history.some(h => (h.note && h.note.includes(rec.id)) || (h.details && h.details.includes(rec.id)))) {
                        const balances = JSON.parse(localStorage.getItem('manti_stock_balances')) || {
                            pure_gold: 0, gold_22k: 0, pure_silver: 0, silver_925: 0
                        };

                        const weightToAdd = parseFloat(rec.qty) || 0;
                        if (weightToAdd > 0) {
                            balances[mappedMetal] = (balances[mappedMetal] || 0) + weightToAdd;
                            history.push({
                                date: new Date().toISOString().split('T')[0],
                                type: 'Buy',
                                metal: mappedMetal,
                                weight: weightToAdd,
                                details: noteStr,
                                note: noteStr
                            });
                            localStorage.setItem('manti_stock_balances', JSON.stringify(balances));
                            localStorage.setItem('manti_stock_history', JSON.stringify(history));
                            alert(`${weightToAdd}g added to ${mappedMetal.replace('_', ' ').toUpperCase()} Stock automatically.`);
                        }
                    }
                }
            }

            window.receiveOrder = function (index) {
                const rec = records[index];
                if (rec.type === 'Purchase Order' && !rec.billNo) {
                    const billNo = prompt("Please enter the Bill No. to complete this sequence:");
                    if (!billNo || billNo.trim() === "") {
                        alert("Bill No. is required to mark a Purchase Order as Completed.");
                        return;
                    }
                    rec.billNo = billNo.trim();
                }

                if (confirm("Mark this order as Received / Completed? This will add the items to your Assets/Inventory if applicable.")) {
                    records[index].status = 'Completed';
                    // Auto-Add to Assets/Stock
                    syncCompletedPO(records[index]);

                    localStorage.setItem('manti_order_records', JSON.stringify(records));
                    renderTable();
                }
            };

            const billPhotoInputListener = document.getElementById('ord-bill-photo');
            if (billPhotoInputListener) {
                billPhotoInputListener.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const objectUrl = URL.createObjectURL(file);
                    const previewContainer = document.getElementById('ord-bill-preview-container');
                    const previewImg = document.getElementById('ord-bill-preview');
                    if (previewContainer && previewImg) {
                        previewImg.src = objectUrl;
                        previewContainer.style.display = 'block';
                    }
                    const statusDiv = document.getElementById('ord-bill-status');
                    if(statusDiv) {
                        statusDiv.textContent = 'Pending save & upload';
                        statusDiv.style.color = '#ca8a04';
                    }
                });
            }

            toggleBtn.addEventListener('click', () => {
                form.reset();

                if (isFixedCb) isFixedCb.checked = false;

                const billPreviewContainer = document.getElementById('ord-bill-preview-container');
                if (billPreviewContainer) billPreviewContainer.style.display = 'none';
                const billStatus = document.getElementById('ord-bill-status');
                if (billStatus) billStatus.textContent = '';
                const billUrlInput = document.getElementById('ord-bill-imageUrl');
                if (billUrlInput) billUrlInput.value = '';

                document.getElementById('ord-date').valueAsDate = new Date();
                
                poItemsBody.innerHTML = '';
                addPORow(); // Start with one empty row
                
                const discPercentInput = document.getElementById('po-discount-percent');
                const discAmountInput = document.getElementById('po-discount-amount');
                if (discPercentInput) discPercentInput.value = '';
                if (discAmountInput) discAmountInput.value = '';

                // Reset ID Generation
                document.getElementById('ord-type').value = 'Purchase Order';
                document.getElementById('ord-id').value = generateOrderId('Purchase Order');
                
                const lastCat = localStorage.getItem('manti_last_ord_category');
                if (lastCat && document.getElementById('ord-category')) {
                    document.getElementById('ord-category').value = lastCat;
                }

                document.getElementById('ord-status').value = 'Open';

                let tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 7);
                document.getElementById('ord-due-date').valueAsDate = tomorrow;

                editIndex = -1;
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
                toggleTypeDetails();
            });

            cancelBtn.addEventListener('click', () => {
                form.style.display = 'none';
                editIndex = -1;
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const ordType = document.getElementById('ord-type').value;
                const ordStatus = document.getElementById('ord-status').value || 'Open';
                const mainMetal = document.getElementById('ord-main-metal-type').value;
                const billNo = document.getElementById('ord-bill-no').value;
                let categoryVal = '';
                if (document.getElementById('ord-category')) {
                    categoryVal = document.getElementById('ord-category').value;
                }

                // Enforce Bill No for Completed Purchase Orders
                if (ordType === 'Purchase Order' && ordStatus === 'Completed' && (!billNo || billNo.trim() === "")) {
                    alert('Please enter a Bill No. before marking this Purchase Order as Completed.');
                    document.getElementById('ord-bill-no').focus();
                    return;
                }

                // Enforce metal type for Sales Orders, or POs if 'Stock' is selected
                if (ordType === 'Sales Order' && !mainMetal) {
                    alert('Please select a Metal Type for this Sales Order.');
                    document.getElementById('ord-main-metal-type').focus();
                    return;
                }
                
                if (ordType === 'Purchase Order' && categoryVal === 'Stock' && !mainMetal) {
                    alert('Please select a Metal Type when purchasing Stock.');
                    document.getElementById('ord-main-metal-type').focus();
                    return;
                }

                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.style.pointerEvents = 'none';
                    submitBtn.style.opacity = '0.7';
                }

                // Upload pending Bill Image
                const billPhotoInput = document.getElementById('ord-bill-photo');
                const billUrlInput = document.getElementById('ord-bill-imageUrl');
                const billStatus = document.getElementById('ord-bill-status');
                try {
                    if (billPhotoInput && billPhotoInput.files && billPhotoInput.files.length > 0) {
                        const file = billPhotoInput.files[0];
                        if (billStatus) {
                            billStatus.textContent = 'Uploading...';
                            billStatus.style.color = '#0284c7';
                        }
                        
                        const fileExt = file.name.split('.').pop();
                        const fileName = `bill_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `uploads/${fileName}`;

                        const { data, error } = await window.supabase.storage.from('designs').upload(filePath, file);
                        if (error) throw error;
                        
                        const { data: urlData } = window.supabase.storage.from('designs').getPublicUrl(filePath);
                        if (billUrlInput) billUrlInput.value = urlData.publicUrl;
                        if (billStatus) {
                            billStatus.textContent = 'Uploaded ✓';
                            billStatus.style.color = '#16a34a';
                        }
                        billPhotoInput.value = ''; // clear input so we don't upload again if form errors later
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    alert("Error uploading bill image: " + err.message);
                    if (submitBtn) {
                        submitBtn.style.pointerEvents = 'auto';
                        submitBtn.style.opacity = '1';
                    }
                    return;
                }

                // Upload pending images
                const rows = poItemsBody.querySelectorAll('.po-item-row');
                try {
                    for (let row of rows) {
                        const fileInput = row.querySelector('.po-design-photo');
                        const urlInput = row.querySelector('.po-design-imageUrl');
                        const statusDiv = row.querySelector('.po-design-status');
                        
                        if (fileInput && fileInput.files && fileInput.files.length > 0) {
                            const file = fileInput.files[0];
                            statusDiv.textContent = 'Uploading...';
                            statusDiv.style.color = '#0284c7';
                            
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                            const filePath = `uploads/${fileName}`;

                            const { data, error } = await window.supabase.storage.from('designs').upload(filePath, file);
                            if (error) throw error;
                            
                            const { data: urlData } = window.supabase.storage.from('designs').getPublicUrl(filePath);
                            urlInput.value = urlData.publicUrl;
                            statusDiv.textContent = 'Uploaded ✓';
                            statusDiv.style.color = '#16a34a';
                            
                            fileInput.value = ''; // clear input so we don't upload again if form errors later
                        }

                        // Detailed Image Upload
                        const detailFileInput = row.querySelector('.po-detail-photo');
                        const detailUrlInput = row.querySelector('.po-detail-imageUrl');
                        const detailStatusDiv = row.querySelector('.po-detail-status');
                        
                        if (detailFileInput && detailFileInput.files && detailFileInput.files.length > 0) {
                            const detailFile = detailFileInput.files[0];
                            if(detailStatusDiv) {
                                detailStatusDiv.textContent = 'Uploading...';
                                detailStatusDiv.style.color = '#0284c7';
                            }
                            
                            const fileExt = detailFile.name.split('.').pop();
                            const fileName = `detail_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                            const filePath = `uploads/${fileName}`;

                            const { data, error } = await window.supabase.storage.from('designs').upload(filePath, detailFile);
                            if (error) throw error;
                            
                            const { data: urlData } = window.supabase.storage.from('designs').getPublicUrl(filePath);
                            if (detailUrlInput) detailUrlInput.value = urlData.publicUrl;
                            if(detailStatusDiv) {
                                detailStatusDiv.textContent = 'Uploaded ✓';
                                detailStatusDiv.style.color = '#16a34a';
                            }
                            
                            detailFileInput.value = ''; // clear input
                        }
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    alert("Error uploading design image: " + err.message);
                    if (submitBtn) {
                        submitBtn.style.pointerEvents = 'auto';
                        submitBtn.style.opacity = '1';
                    }
                    return;
                }

                // Collect items from table
                const items = [];
                let rowSumWithoutGst = 0;
                let rowGstSum = 0;
                let totalQty = 0;
                
                rows.forEach(row => {
                    const it = {
                        desc: row.querySelector('.po-desc').value,
                        qty: row.querySelector('.po-qty').value,
                        rate: row.querySelector('.po-rate').value,
                        gst: row.querySelector('.po-gst').value,
                        total: row.querySelector('.po-row-amount').value,
                        designWt: row.querySelector('.po-design-wt')?.value || '',
                        designSize: row.querySelector('.po-design-size')?.value || '',
                        designImageUrl: row.querySelector('.po-design-imageUrl')?.value || '',
                        detailImageUrl: row.querySelector('.po-detail-imageUrl')?.value || ''
                    };
                    items.push(it);
                    
                    const qty = parseFloat(it.qty) || 0;
                    const rate = parseFloat(it.rate) || 0;
                    const gstPct = parseFloat(it.gst) || 0;
                    const rt = qty * rate;
                    rowSumWithoutGst += rt;
                    rowGstSum += rt * (gstPct/100);
                    totalQty += qty;
                });

                if (items.length === 0) {
                    alert('Please add at least one item.');
                    return;
                }

                const dPercent = document.getElementById('po-discount-percent')?.value || '';
                const dAmount = document.getElementById('po-discount-amount')?.value || '';
                const da = parseFloat(dAmount) || 0;
                let totalAmount = rowSumWithoutGst - da + rowGstSum;

                const rec = {
                    id: document.getElementById('ord-id').value || generateOrderId('Purchase Order'),
                    type: 'Purchase Order',
                    date: document.getElementById('ord-date').value,
                    dueDate: document.getElementById('ord-due-date').value,
                    vendor: document.getElementById('ord-vendor').value,
                    billNo: document.getElementById('ord-bill-no').value,
                    billImageUrl: document.getElementById('ord-bill-imageUrl')?.value || '',
                    category: categoryVal,
                    assetType: document.getElementById('ord-asset-type')?.value || 'Other',
                    designSubCategory: document.getElementById('ord-design-sub-category')?.value || '',
                    
                    discountPercent: dPercent,
                    discountAmount: dAmount,

                    items: items,
                    qty: totalQty,
                    amount: totalAmount.toFixed(2),
                    remark: document.getElementById('ord-remark').value,
                    mainMetalType: mainMetal,
                    status: ordStatus
                };

                if (editIndex >= 0) {
                    records[editIndex] = rec;
                } else {
                    records.unshift(rec);
                }

                // Safe check & add for assets/stocks on save
                syncCompletedPO(rec);

                localStorage.setItem('manti_order_records', JSON.stringify(records));
                form.style.display = 'none';
                
                if (submitBtn) {
                    submitBtn.style.pointerEvents = 'auto';
                    submitBtn.style.opacity = '1';
                }
                
                renderTable();
            });

            renderTable();
        });