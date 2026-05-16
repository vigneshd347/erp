// State management
let metalRates = {
    pureGold: 0,
    pureSilver: 0,
    gold22k: 0,
    silver925: 0,
    copper: 0,
    zinc: 0,
    iridium: 0
};

// Global Table Filter function (legacy search bar support)
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const filterText = input.value.toLowerCase().trim();
    const filterTerms = filterText.split(/\s+/).filter(t => t.length > 0);
    const table = document.getElementById(tableId);

    // Safety check if table doesn't exist on page
    if (!table) return;

    // We only filter the tbody rows, not the header
    const tbody = table.querySelector('tbody') || table;
    const tr = tbody.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        if (tr[i].cells.length === 1 && tr[i].cells[0].colSpan > 1) continue;

        let rowText = "";
        const tds = tr[i].getElementsByTagName('td');
        for (let j = 0; j < tds.length; j++) {
            if (tds[j]) rowText += (tds[j].textContent || tds[j].innerText).toLowerCase() + " ";
        }

        let rowMatches = true;
        for (let t = 0; t < filterTerms.length; t++) {
            if (rowText.indexOf(filterTerms[t]) === -1) {
                rowMatches = false;
                break; // Fails global search
            }
        }

        if (filterTerms.length === 0) rowMatches = true;

        // Note: we set a data attribute so the excel filters can be combined with global
        if (rowMatches) {
            tr[i].style.display = "";
            tr[i].dataset.globalMatch = "true";
        } else {
            tr[i].style.display = "none";
            tr[i].dataset.globalMatch = "false";
        }

        // Always trigger an excel re-filter to combine the two
        applyExcelFilters(table);
    }
}

// Excel-Style Header Filtering
function applyExcelFilters(table) {
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.getElementsByTagName('tr');
    const filterInputs = table.querySelectorAll('.excel-filter-input');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) continue;

        // If it already failed the global search bar, keep it hidden
        if (row.dataset.globalMatch === "false") {
            row.style.display = "none";
            continue;
        }

        let isRowMatch = true;

        filterInputs.forEach((input) => {
            const filterVal = input.value.toLowerCase().trim();
            if (filterVal === "") return; // Skip empty filters

            const colIndex = parseInt(input.dataset.colIndex);
            const cell = row.cells[colIndex];
            if (cell) {
                const cellText = (cell.textContent || cell.innerText).toLowerCase();
                if (cellText.indexOf(filterVal) === -1) {
                    isRowMatch = false; // Failed this column's criteria
                }
            }
        });

        row.style.display = isRowMatch ? "" : "none";
    }

    // Trigger report totals calculation if it exists on the page
    if (typeof window.calculateReportTotals === 'function') {
        window.calculateReportTotals();
    }
    
    if (typeof updateTableTotals === 'function') {
        updateTableTotals(table);
    }
}

function attachExcelFilters() {
    console.log("Attaching Excel Filters...");
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        if (table.dataset.noFilter === "true") {
            const existingFilterRow = table.querySelector('.excel-filter-row');
            if (existingFilterRow) existingFilterRow.remove();
            return;
        }
        const thead = table.querySelector('thead');
        if (!thead) return;

        const headerRow = thead.querySelector('tr');
        if (!headerRow) return;

        // Find or create the filter row
        let filterRow = thead.querySelector('.excel-filter-row');
        const isNewRow = !filterRow;

        if (isNewRow) {
            filterRow = document.createElement('tr');
            filterRow.className = 'excel-filter-row';
        }

        const ths = headerRow.getElementsByTagName('th');
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.getElementsByTagName('tr');

        // Extract unique values for each column to build datalists
        const columnData = {};
        for (let i = 0; i < ths.length; i++) {
            columnData[i] = new Set();
        }

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (row.cells.length === 1 && row.cells[0].colSpan > 1) continue; // Skip "no records" row

            for (let c = 0; c < row.cells.length; c++) {
                if (columnData[c]) {
                    let cellText = (row.cells[c].textContent || row.cells[c].innerText).trim();
                    // Clean internal whitespace/newlines so dropdown values are proper
                    cellText = cellText.replace(/\s+/g, ' '); 
                    if (cellText) columnData[c].add(cellText);
                }
            }
        }

        for (let i = 0; i < ths.length; i++) {
            const headerText = (ths[i].textContent || ths[i].innerText).trim().toLowerCase();

            // Reuse existing cell or create new
            let td = isNewRow ? document.createElement('th') : filterRow.cells[i];
            if (!td) {
                td = document.createElement('th');
                filterRow.appendChild(td);
            }

            td.style.padding = "4px 8px";
            td.style.background = "var(--primary-light)"; // subtle blue

            // Only add/update filters if not an action column
            if (headerText !== "action" && headerText !== "actions" && headerText !== "edit" && headerText !== "delete") {
                const uniqueTableId = table.id || Math.random().toString(36).substr(2, 9);
                const dataListId = `filter-list-${uniqueTableId}-${i}`;

                // Create or Get Datalist
                let dataList = td.querySelector('datalist');
                if (!dataList) {
                    dataList = document.createElement('datalist');
                    dataList.id = dataListId;
                    td.appendChild(dataList);
                }
                dataList.innerHTML = ''; // Clear for refresh

                const sortedValues = Array.from(columnData[i]).sort((a, b) => a.localeCompare(b));
                sortedValues.forEach(val => {
                    const option = document.createElement('option');
                    option.value = val;
                    dataList.appendChild(option);
                });

                // Create or Get Input
                let input = td.querySelector('input');
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'search';
                    input.setAttribute('list', dataListId);
                    input.className = 'excel-filter-input';
                    input.placeholder = `Select or type...`;
                    input.dataset.colIndex = i;
                    input.style.width = "100%";
                    input.style.padding = "4px";
                    input.style.fontSize = "0.85rem";
                    input.style.border = "1px solid var(--border)";
                    input.style.borderRadius = "4px";
                    input.style.boxSizing = "border-box";
                    input.style.color = "var(--text-main)";
                    input.style.backgroundColor = "var(--bg-main)";

                    input.addEventListener('input', () => applyExcelFilters(table));
                    td.appendChild(input);
                }
            } else if (isNewRow) {
                td.innerHTML = ''; // Empty cell for Action columns
            }

            if (isNewRow) filterRow.appendChild(td);
        }

        if (isNewRow) thead.appendChild(filterRow);
        
        if (typeof updateTableTotals === 'function') {
            updateTableTotals(table);
        }
    });
}

// Dynamic Table Totals
function updateTableTotals(table) {
    if (table.dataset.noTotal === "true" || table.dataset.noFilter === "true") return;

    const thead = table.querySelector('thead');
    if (!thead) return;

    let headerRow = null;
    for (let r of thead.querySelectorAll('tr')) {
        if (!r.classList.contains('excel-filter-row')) {
            headerRow = r;
            break;
        }
    }
    if (!headerRow) return;

    const keywords = ['amount', 'total', 'gst', 'qty', 'quantity', 'weight', 'bal', 'due', 'paid', 'tax', 'value', 'cost'];
    const skipKeywords = ['phone', 'date', 'id', 'no.', '#', 'account', 'bank', 'number', 'rate', 'price', 'unit/rate']; 
    
    const ths = headerRow.querySelectorAll('th');
    const colsToSum = [];
    
    ths.forEach((th, index) => {
        const text = (th.textContent || '').toLowerCase().trim();
        // Exception: if column title strictly is just "action" etc.
        if (text === "action" || text === "") return;
        
        const hasKeyword = keywords.some(kw => text.includes(kw));
        const hasSkip = skipKeywords.some(sw => text === sw || text.includes(sw));
        
        if (hasKeyword && !hasSkip) {
            colsToSum.push(index);
        }
    });

    if (colsToSum.length === 0) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let sums = Array(ths.length).fill(0);
    
    rows.forEach(row => {
        if (row.style.display === 'none') return;
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) return; // Skip "no records" row

        colsToSum.forEach(colIdx => {
            const cell = row.cells[colIdx];
            if (cell) {
                const text = (cell.textContent || '').trim();
                const cleaned = text.replace(/,/g, '').match(/-?[\d.]+/);
                if (cleaned && cleaned[0]) {
                    sums[colIdx] += parseFloat(cleaned[0]) || 0;
                }
            }
        });
    });

    let tfoot = table.querySelector('tfoot.dynamic-totals-footer');
    if (!tfoot) {
        tfoot = document.createElement('tfoot');
        tfoot.className = 'dynamic-totals-footer';
        tfoot.style.position = 'sticky';
        tfoot.style.bottom = '0';
        tfoot.style.background = '#f8fafc';
        tfoot.style.backdropFilter = 'blur(10px)';
        tfoot.style.zIndex = '5';
        tfoot.style.boxShadow = '0 -4px 6px -1px rgba(0, 0, 0, 0.05)';
        table.appendChild(tfoot);
    }
    
    let tr = tfoot.querySelector('tr');
    if (!tr) {
        tr = document.createElement('tr');
        tfoot.appendChild(tr);
    }
    
    tr.innerHTML = '';
    
    for(let i = 0; i < ths.length; i++) {
        const td = document.createElement('td');
        td.style.padding = '12px 16px';
        td.style.borderTop = '2px solid #cbd5e1';
        td.style.fontWeight = '700';
        td.style.fontSize = '0.9rem';
        td.style.color = '#0f172a';
        
        if (i === 0) {
            td.textContent = 'TOTALS';
        } else if (colsToSum.includes(i)) {
            const headerText = (ths[i].textContent || '').trim().toLowerCase();
            const isCurrency = headerText.includes('amount') || headerText.includes('total') || headerText.includes('due') || headerText.includes('paid') || headerText.includes('value') || headerText.includes('cost');
            
            let val = sums[i].toLocaleString('en-IN', { maximumFractionDigits: 3 });
            if (isCurrency && sums[i] !== 0) val = '₹ ' + sums[i].toLocaleString('en-IN', { maximumFractionDigits: 2 });
            else if (headerText.includes('weight')) val = val + ' g';
            
            td.textContent = val;
            td.style.textAlign = 'right';
        } else {
            td.textContent = '';
        }
        tr.appendChild(td);
    }
}

// Generic Table Sorting
function attachTableSorting() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (table.dataset.noSort === "true") return;
        
        const thead = table.querySelector('thead');
        if (!thead) return;

        let headerRow = null;
        for (let r of thead.querySelectorAll('tr')) {
            if (!r.classList.contains('excel-filter-row')) {
                headerRow = r;
                break;
            }
        }
        if (!headerRow) return;

        const ths = headerRow.querySelectorAll('th');
        ths.forEach((th, index) => {
            if (th.dataset.sortAttached === "true") return;
            
            // Skip styling if width is very small or action columns
            const headerText = (th.textContent || th.innerText).trim().toLowerCase();
            if (headerText === "action" || headerText === "actions" || headerText === "edit" || headerText === "delete" || headerText === "") return;

            th.dataset.sortAttached = "true";
            th.style.cursor = "pointer";
            th.title = "Click to sort";

            th.addEventListener('click', () => {
                const tbody = table.querySelector('tbody');
                if (!tbody) return;

                const rows = Array.from(tbody.querySelectorAll('tr'));
                if (rows.length <= 1 && rows[0] && rows[0].cells.length === 1 && rows[0].cells[0].colSpan > 1) return;

                const isAscending = th.dataset.sortOrder === 'asc';
                const multiplier = isAscending ? -1 : 1;
                th.dataset.sortOrder = isAscending ? 'desc' : 'asc';

                ths.forEach(otherTh => {
                    let ind = otherTh.querySelector('.sort-indicator');
                    if (ind) ind.textContent = '';
                    if (otherTh !== th) otherTh.dataset.sortOrder = '';
                });

                let indicator = th.querySelector('.sort-indicator');
                if (!indicator) {
                    indicator = document.createElement('span');
                    indicator.className = 'sort-indicator';
                    indicator.style.marginLeft = '4px';
                    indicator.style.fontSize = '0.85em';
                    th.appendChild(indicator);
                }
                indicator.textContent = isAscending ? ' ▼' : ' ▲';

                rows.sort((a, b) => {
                    const aCell = a.cells[index];
                    const bCell = b.cells[index];
                    
                    const aText = aCell ? (aCell.textContent || aCell.innerText).trim() : '';
                    const bText = bCell ? (bCell.textContent || bCell.innerText).trim() : '';
                    
                    const aClean = aText.replace(/,/g, '');
                    const bClean = bText.replace(/,/g, '');
                    
                    const aNum = parseFloat((aClean.match(/-?[\d.]+/) || [])[0]);
                    const bNum = parseFloat((bClean.match(/-?[\d.]+/) || [])[0]);
                    
                    if (!isNaN(aNum) && !isNaN(bNum) && (aText.includes('₹') || aText.match(/^[0-9.-]+$/) || aText.match(/^[0-9.-]+[a-zA-Z%]+$/))) {
                        return (aNum - bNum) * multiplier;
                    }
                    
                    const aDate = Date.parse(aText);
                    const bDate = Date.parse(bText);
                    if (!isNaN(aDate) && !isNaN(bDate) && aText.length > 5) {
                        return (aDate - bDate) * multiplier;
                    }
                    
                    return aText.localeCompare(bText, undefined, {numeric: true}) * multiplier;
                });

                rows.forEach(row => tbody.appendChild(row));
                
                if (typeof applyExcelFilters === 'function') {
                    applyExcelFilters(table);
                }
            });
        });
    });
}

// Observe dynamic table rebuilds (like on Reports page)
document.addEventListener('CloudDataLoaded', () => {
    // --- AGGRESSIVE DEDUPLICATION ---
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

    const records = JSON.parse(localStorage.getItem('manti_order_records') || '[]');
    const expenses = JSON.parse(localStorage.getItem('manti_expenses') || '[]');
    let payments = JSON.parse(localStorage.getItem('manti_payments_made') || '[]');

    let updated = false;

    // Assign IDs to POs
    let maxPo = 0;
    records.forEach(r => {
        if (r.id && r.id.startsWith('PO-')) {
            const n = parseInt(r.id.replace('PO-', ''), 10);
            if (!isNaN(n) && n > maxPo) maxPo = n;
        }
    });
    records.forEach(r => {
        if (!r.id && r.type === 'Purchase Order') {
            maxPo++;
            r.id = 'PO-' + maxPo.toString().padStart(4, '0');
            updated = true;
        }
    });

    // Assign IDs to Expenses
    let maxExp = 0;
    expenses.forEach(e => {
        if (e.id && e.id.startsWith('EXP-')) {
            const n = parseInt(e.id.replace('EXP-', ''), 10);
            if (!isNaN(n) && n > maxExp) maxExp = n;
        }
    });
    expenses.forEach(e => {
        if (!e.id) {
            maxExp++;
            e.id = 'EXP-' + maxExp.toString().padStart(4, '0');
            updated = true;
        }
    });

    // Assign IDs to Payments
    let maxPay = 0;
    payments.forEach(p => {
        if (p.id && p.id.startsWith('PAY-')) {
            const n = parseInt(p.id.replace('PAY-', ''), 10);
            if (!isNaN(n) && n > maxPay) maxPay = n;
        }
    });
    payments.forEach(p => {
        if (!p.id) {
            maxPay++;
            p.id = 'PAY-' + maxPay.toString().padStart(4, '0');
            updated = true;
        }
    });

    // NOW deduplicate only by ID!
    const cleanOrders = deduplicate(records, r => r.id || `${r.type}-${r.date}-${r.vendor}-${r.amount}`);
    const cleanExpenses = deduplicate(expenses, e => e.id || `${e.date}-${e.vendor}-${e.amount}`);
    const cleanPayments = deduplicate(payments, p => p.id || `${p.date}-${p.vendor}-${p.amount}`);

    if (dedupCount > 0 || updated) {
        localStorage.setItem('manti_order_records', JSON.stringify(cleanOrders));
        localStorage.setItem('manti_expenses', JSON.stringify(cleanExpenses));
        localStorage.setItem('manti_payments_made', JSON.stringify(cleanPayments));
        
        if (window.syncKeyToSupabase) {
            window.syncKeyToSupabase('manti_order_records', cleanOrders);
            window.syncKeyToSupabase('manti_expenses', cleanExpenses);
            window.syncKeyToSupabase('manti_payments_made', cleanPayments);
        }
        console.log(`Global Deduplication/ID Assignment complete. Removed ${dedupCount} duplicates.`);
    }
    // --- END DEDUPLICATION ---

    attachExcelFilters();
    attachTableSorting();

    const observer = new MutationObserver((mutations) => {
        let shouldReattach = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                const target = mutation.target;
                if (target.tagName === 'THEAD' || target.tagName === 'TBODY' || target.tagName === 'TABLE' || target.id === 'report-head' || target.id === 'report-body') {
                    shouldReattach = true;
                }
            }
        });
        if (shouldReattach) {
            // setTimeout prevents infinite loops
            setTimeout(() => {
                attachExcelFilters();
                attachTableSorting();
            }, 100);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// DOM Elements
const pureGoldInput = document.getElementById('pure-gold');
const pureSilverInput = document.getElementById('pure-silver');
const gold22kDisplay = document.getElementById('gold-22k');
const silver925Display = document.getElementById('silver-925');
const itemsBody = document.getElementById('items-body');
const addItemBtn = document.getElementById('add-item');
const invoiceForm = document.getElementById('invoice-form');
const currentDateInput = document.getElementById('current-date');

// Initialization
document.addEventListener('CloudDataLoaded', () => {
    // Check if handling a shared link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    if (sharedData) {
        handleSharedInvoice(sharedData);
        return; // Skip normal init
    }

    // Set current date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('current-date');
    if (dateInput) dateInput.value = today;

    loadSettings();

    // Add first item row if on invoice page
    if (itemsBody) {
        populateSODropdown();
        populateVendorKYCList();
        addNewRow();
        // If redirected from despatch, pre-select the SO
        prefillFromDespatch();
    }

    // Pincode listeners
    const billStateInput = document.getElementsByName('bill_state')[0];
    const shipStateInput = document.getElementsByName('ship_state')[0];
    if (billStateInput) billStateInput.addEventListener('input', handlePincodeInput);
    if (shipStateInput) shipStateInput.addEventListener('input', handlePincodeInput);
});

async function handlePincodeInput(e) {
    const val = e.target.value.trim();
    // Only fetch if it's exactly 6 digits
    if (/^\d{6}$/.test(val)) {
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
            const data = await res.json();
            if (data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice[0]) {
                const locality = data[0].PostOffice[0].Name;
                e.target.value = `${val} (${locality})`;
                syncShippingDetails();
            }
        } catch (err) {
            console.warn("Pincode fetch failed", err);
        }
    }
}

function loadSettings() {
    const savedRates = localStorage.getItem('manti_metal_rates');
    const savedBank = localStorage.getItem('manti_bank_details');
    const savedDefaults = localStorage.getItem('manti_invoice_defaults');

    if (savedRates) {
        metalRates = JSON.parse(savedRates);
        if (pureGoldInput) pureGoldInput.value = metalRates.pureGold || '';
        if (pureSilverInput) pureSilverInput.value = metalRates.pureSilver || '';
        updateCalculatedDisplays();
    }

    // Set default bank details if none exist
    if (!savedBank) {
        const defaultBank = {
            name: "IDFC FIRST",
            branch: "POLLACHI BRANCH",
            acc: "70008000727",
            ifsc: "IDFB0080538",
            upi: "mantijwewlartpvt@idfcbank"
        };
        localStorage.setItem('manti_bank_details', JSON.stringify(defaultBank));
    }

    // Set default invoice settings if none exist
    if (!savedDefaults) {
        localStorage.setItem('manti_invoice_defaults', JSON.stringify({
            hsnCode: '7113',
            footerText: 'THANK YOU WELCOME AGAIN'
        }));
    }
}

// Price Panel Logic (Modified for Centralized Storage)
function updateCalculatedDisplays() {
    if (!pureGoldInput) return; // Skip if not on a page with these inputs
    metalRates.pureGold = parseFloat(pureGoldInput.value) || 0;
    metalRates.pureSilver = parseFloat(pureSilverInput.value) || 0;

    metalRates.gold22k = (metalRates.pureGold * 0.916).toFixed(2);
    metalRates.silver925 = (metalRates.pureSilver * 0.925).toFixed(2);

    gold22kDisplay.textContent = `₹ ${metalRates.gold22k}`;
    silver925Display.textContent = `₹ ${metalRates.silver925}`;

    // Save to localStorage
    localStorage.setItem('manti_metal_rates', JSON.stringify(metalRates));

    // Update all existing rows with new rates
    updateAllRows();
}

if (pureGoldInput) pureGoldInput.addEventListener('input', updateCalculatedDisplays);
if (pureSilverInput) pureSilverInput.addEventListener('input', updateCalculatedDisplays);

// Invoice Item Logic
function getDefaultHsn() {
    const saved = localStorage.getItem('manti_invoice_defaults');
    return saved ? (JSON.parse(saved).hsnCode || '7113') : '7113';
}

function addNewRow() {
    const rowCount = itemsBody.children.length + 1;
    const hsn = getDefaultHsn();
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" name="desc" placeholder="Product Name"></td>
        <td><input type="text" name="hsn" value="${hsn}" placeholder="HSN"></td>
        <td><input type="number" name="weight" placeholder="0.000" step="0.001" oninput="onNumberInput(this); calculateRow(this)"></td>
        <td>
            <select name="metal_type" onchange="handleMetalChange(this)">
                <option value="none">Select Metal</option>
                <optgroup label="Gold">
                    <option value="pure_gold_9999">Pure Gold (99.99)</option>
                    <option value="pure_gold_999">Pure Gold (99.9)</option>
                    <option value="pure_gold_995">Pure Gold (99.5)</option>
                    <option value="gold_22k">Gold (22K)</option>
                </optgroup>
                <optgroup label="Silver">
                    <option value="pure_silver_9999">Pure Silver (99.99)</option>
                    <option value="pure_silver_999">Pure Silver (99.9)</option>
                    <option value="pure_silver_995">Pure Silver (99.5)</option>
                    <option value="silver_925">Silver (925)</option>
                </optgroup>
            </select>
        </td>
        <td><input type="number" name="rate" placeholder="Rate" step="0.01" oninput="onNumberInput(this); calculateRow(this)"></td>
        <td><input type="number" name="mc_pct" placeholder="0" step="0.1" oninput="onNumberInput(this); calculateRow(this)"></td>
        <td><span class="row-total">-</span></td>
        <td>
            <button type="button" class="btn-remove" onclick="removeRow(this)" title="Delete" style="margin: 0 auto;">
                <svg viewBox="0 0 448 512" class="del-icon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
            </button>
        </td>
    `;
    itemsBody.appendChild(row);
}

function fillInvoiceForm(data) {
    if (!invoiceForm) return;
    
    // Fill top level fields from formData keys
    Object.keys(data).forEach(key => {
        const input = invoiceForm.querySelector(`[name="${key}"]`);
        if (input && key !== 'items') {
            input.value = data[key];
        }
    });

    // Handle items
    if (data.items && data.items.length > 0) {
        if (itemsBody) {
            itemsBody.innerHTML = '';
            data.items.forEach(item => {
                addNewRow();
                const lastRow = itemsBody.lastElementChild;
                lastRow.querySelector('input[name="desc"]').value = item.desc || '';
                lastRow.querySelector('input[name="hsn"]').value = item.hsn || '';
                lastRow.querySelector('input[name="weight"]').value = item.weight || '';
                lastRow.querySelector('input[name="rate"]').value = item.rate || '';
                lastRow.querySelector('input[name="mc_pct"]').value = item.mc_pct || '';
                
                // Handle metal select by matching text
                const sel = lastRow.querySelector('select[name="metal_type"]');
                if (sel) {
                    Array.from(sel.options).forEach(opt => {
                        if (opt.text === item.metal_text) sel.value = opt.value;
                    });
                }
                calculateRow(lastRow.querySelector('input[name="weight"]'));
            });
        }
    }
    
    // Attempt to match the SO select if buyer_order present
    const soSelect = document.getElementById('so-select');
    if (soSelect && data.buyer_order) {
        Array.from(soSelect.options).forEach(opt => {
            if (opt.value === data.buyer_order || opt.text.startsWith(data.buyer_order)) {
               soSelect.value = opt.value;
            }
        });
    }

    if (typeof syncWithTemplate === 'function') syncWithTemplate();
}

// Remove leading zeros when user types in number fields
function onNumberInput(el) {
    if (el.value !== '' && el.value !== '-') {
        const v = parseFloat(el.value);
        if (!isNaN(v) && el.value.startsWith('0') && !el.value.startsWith('0.')) {
            el.value = v;
        }
    }
}

if (addItemBtn) addItemBtn.addEventListener('click', addNewRow);

// Build SO options for the Buyer's Order dropdown
function getSOOptions() {
    const orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    const jobRecords = JSON.parse(localStorage.getItem('manti_jobwork_records')) || [];
    const despatchedSOs = new Set();
    jobRecords.forEach(r => {
        if (r.process === '5. Despatch') despatchedSOs.add(r.jobnum);
    });
    let html = "<option value=''>Buyer's Order No (Select SO)</option>";
    orders.forEach(o => {
        if (o.type === 'Sales Order' && despatchedSOs.has(o.id) && o.status !== 'Completed') {
            let mcInfo = '';
            if (o.mcPercent) mcInfo = ` | MC ${o.mcPercent}%`;
            else if (o.mcAmount) mcInfo = ` | MC ₹${parseFloat(o.mcAmount).toLocaleString()}`;
            html += `<option value="${o.id}">${o.id} - ${o.product || 'N/A'}${o.mainMetalType ? ' (' + o.mainMetalType + ')' : ''}${mcInfo}</option>`;
        }
    });
    return html;
}

// Populate SO dropdown on page load
function populateSODropdown() {
    const soSelect = document.getElementById('so-select');
    if (soSelect) soSelect.innerHTML = getSOOptions();
}

// Fill Vendor Details based on Name or ID
function fillVendorDetails(searchTerm) {
    if (!searchTerm) return;
    let vendors = [];
    try {
        const stored = localStorage.getItem('manti_vendor_kyc_records');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) vendors = parsed;
        }
    } catch (e) { }

    const termLower = searchTerm.toLowerCase();
    const vendor = vendors.find(v => {
        const combined = v.id ? `${v.name} (${v.id})`.toLowerCase() : '';
        return (v.name && v.name.toLowerCase() === termLower) ||
            (v.id && v.id.toLowerCase() === termLower) ||
            (combined && combined === termLower);
    });

    const billNameInput = document.getElementsByName('bill_name')[0];
    const billAddressInput = document.getElementsByName('bill_address')[0];
    const billStateInput = document.getElementsByName('bill_state')[0];
    const billGstinInput = document.getElementsByName('bill_gstin')[0];
    const billMobileInput = document.getElementsByName('bill_mobile')[0];
    const billEmailInput = document.getElementsByName('bill_email')[0];

    if (vendor) {
        const displayName = vendor.id ? `${vendor.name} (${vendor.id})` : vendor.name;
        if (billNameInput && billNameInput.value.toLowerCase() !== displayName.toLowerCase()) {
            billNameInput.value = displayName;
        }
        if (billAddressInput) billAddressInput.value = vendor.address || '';
        if (billStateInput) billStateInput.value = vendor.pin || '';
        if (billGstinInput) billGstinInput.value = vendor.gst || '';
        if (billMobileInput) billMobileInput.value = vendor.mobile || '';
        if (billEmailInput) billEmailInput.value = vendor.email || '';
    } else {
        if (billNameInput && billNameInput.value !== searchTerm) {
            billNameInput.value = searchTerm;
        }
    }

    const syncCb = document.getElementById('sync-shipping');
    if (syncCb && syncCb.checked) syncShippingDetails();
    if (typeof syncWithTemplate === 'function') syncWithTemplate();
}

// Populate Vendor KYC datalist
function populateVendorKYCList() {
    const datalist = document.getElementById('vendor-kyc-list');
    const billNameInput = document.getElementsByName('bill_name')[0];
    if (!datalist || !billNameInput) return;

    let vendors = [];
    try {
        const stored = localStorage.getItem('manti_vendor_kyc_records');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) vendors = parsed;
        }
    } catch (e) { }

    datalist.innerHTML = '';
    vendors.forEach(v => {
        if (v.name) {
            const optName = document.createElement('option');
            optName.value = v.id ? `${v.name} (${v.id})` : v.name;
            datalist.appendChild(optName);
        }
        if (v.id) {
            const optId = document.createElement('option');
            optId.value = v.id;
            datalist.appendChild(optId);
        }
    });

    billNameInput.addEventListener('input', (e) => {
        // If they select an exact match (name or ID) from the datalist, fill details
        const selectedTerm = e.target.value;
        const termLower = selectedTerm.toLowerCase();
        const isMatch = vendors.some(v => {
            const combined = v.id ? `${v.name} (${v.id})`.toLowerCase() : '';
            return (v.name && v.name.toLowerCase() === termLower) ||
                (v.id && v.id.toLowerCase() === termLower) ||
                (combined && combined === termLower);
        });
        if (isMatch) {
            fillVendorDetails(selectedTerm);
        }
    });
}

// Handle SO selection from Buyer's Order dropdown — fills first item row
function handleSOSelect(select) {
    const soId = select.value;
    if (!soId) return;

    const orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    const jobRecords = JSON.parse(localStorage.getItem('manti_jobwork_records')) || [];
    const so = orders.find(o => o.id === soId);
    if (!so) return;

    let despatchWt = 0;
    jobRecords.forEach(r => {
        if (r.jobnum === soId && r.process === '5. Despatch' && r.status === '1. Issue') {
            despatchWt += parseFloat(r.issueWt) || 0;
        }
    });

    let row = itemsBody ? itemsBody.querySelector('tr') : null;
    if (!row && itemsBody) { addNewRow(); row = itemsBody.querySelector('tr'); }
    if (!row) return;

    row.querySelector('input[name="desc"]').value = so.product || '';
    row.querySelector('input[name="weight"]').value = despatchWt > 0 ? despatchWt.toFixed(3) : (so.qty || '');

    let metalVal = 'none';
    if (so.mainMetalType === 'Gold') metalVal = 'gold_22k';
    else if (so.mainMetalType === 'Silver') metalVal = 'silver_925';
    const metalSelect = row.querySelector('select[name="metal_type"]');
    if (metalSelect) { metalSelect.value = metalVal; handleMetalChange(metalSelect); }

    if (so.mcPercent) {
        row.querySelector('input[name="mc_pct"]').value = so.mcPercent;
        calculateRow(row.querySelector('input[name="mc_pct"]'));
    } else if (so.mcAmount) {
        const weight = parseFloat(row.querySelector('input[name="weight"]').value) || 0;
        const rate = parseFloat(row.querySelector('input[name="rate"]').value) || 0;
        const base = weight * rate;
        if (base > 0) {
            const pct = (parseFloat(so.mcAmount) / base * 100).toFixed(1);
            row.querySelector('input[name="mc_pct"]').value = pct;
            calculateRow(row.querySelector('input[name="mc_pct"]'));
        }
    }

    if (so.vendor) {
        fillVendorDetails(so.vendor);
    }

    window.__pendingDespatchSoId = soId;
}

// Pre-fill from despatch redirect
function prefillFromDespatch() {
    const raw = localStorage.getItem('manti_pending_despatch');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || !d.soId) return;

    const soSelect = document.getElementById('so-select');
    if (soSelect) {
        soSelect.value = d.soId;
        handleSOSelect(soSelect);
    }

    const billNameInput = document.getElementsByName('bill_name')[0];
    if (billNameInput && d.customer) billNameInput.value = d.customer;

    window.__pendingDespatchSoId = d.soId;

    const banner = document.createElement('div');
    banner.style.cssText = 'background: var(--success-light); border: 1px solid var(--success); border-radius: 8px; padding: 12px 18px; margin-bottom: 1rem; font-size: 0.9rem; color: var(--success); font-weight: 600;';
    banner.innerHTML = `📋 Despatch auto-selected: <strong>${d.soId}</strong> <button onclick="this.parentElement.remove()" style="float:right; background:none; border:none; cursor:pointer; font-size:1.1rem;">×</button>`;
    const formEl = document.getElementById('invoice-form');
    if (formEl) formEl.insertBefore(banner, formEl.firstChild);

    localStorage.removeItem('manti_pending_despatch');
}

// Mark SO as completed
function markSOCompleted(soId) {
    if (!soId) return;
    const orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    const idx = orders.findIndex(o => o.id === soId);
    if (idx >= 0) {
        orders[idx].status = 'Completed';
        localStorage.setItem('manti_order_records', JSON.stringify(orders));
    }
}

function removeRow(btn) {
    btn.closest('tr').remove();
    updateRowNumbers();
    calculateGrandTotal();
}

function updateRowNumbers() {
    const rows = itemsBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
}

function handleMetalChange(select) {
    const row = select.closest('tr');
    const rateInput = row.querySelector('input[name="rate"]');
    const metalType = select.value;

    let price = 0;
    switch (metalType) {
        case 'pure_gold_9999':
        case 'pure_gold_999':
        case 'pure_gold_995': price = metalRates.pureGold; break;
        case 'gold_22k': price = metalRates.gold22k; break;
        case 'pure_silver_9999':
        case 'pure_silver_999':
        case 'pure_silver_995': price = metalRates.pureSilver; break;
        case 'silver_925': price = metalRates.silver925; break;
        case 'copper': price = metalRates.copper; break;
        case 'zinc': price = metalRates.zinc; break;
        case 'iridium': price = metalRates.iridium; break;
        default: price = rateInput.value || 0;
    }

    rateInput.value = price;
    calculateRow(select);
}

function updateAllRows() {
    const rows = itemsBody.querySelectorAll('tr');
    rows.forEach(row => {
        const select = row.querySelector('select[name="metal_type"]');
        if (select.value !== 'none' && select.value !== 'other') {
            handleMetalChange(select);
        }
    });
}

function calculateRow(input) {
    const row = input.closest('tr');
    const weightInput = row.querySelector('input[name="weight"]');
    const metalSelect = row.querySelector('select[name="metal_type"]');

    if (metalSelect && metalSelect.value !== 'none' && metalSelect.value !== 'other') {
        const metalType = metalSelect.value;
        const balances = JSON.parse(localStorage.getItem('manti_stock_balances')) || {};
        const available = balances[metalType] || 0;

        let totalReq = 0;
        itemsBody.querySelectorAll('tr').forEach(r => {
            const sel = r.querySelector('select[name="metal_type"]');
            const wtIn = r.querySelector('input[name="weight"]');
            if (sel && wtIn && sel.value === metalType) {
                totalReq += parseFloat(wtIn.value) || 0;
            }
        });

        if (totalReq > available) {
            alert(`No stock! Available ${metalType.replace('_', ' ').toUpperCase()}: ${available.toFixed(3)}g`);
            weightInput.value = '';
        }
    }

    const weight = parseFloat(weightInput.value) || 0;
    const rate = parseFloat(row.querySelector('input[name="rate"]').value) || 0;
    const mcPct = parseFloat(row.querySelector('input[name="mc_pct"]').value) || 0;

    const taxable = (weight * rate) * (1 + (mcPct / 100));

    row.querySelector('.row-total').textContent = taxable > 0 ? `₹ ${taxable.toFixed(2)}` : '-';
    calculateGrandTotal();
}

function calculateGrandTotal() {
    const rows = itemsBody.querySelectorAll('tr');
    let subTotal = 0;
    let cgst = 0;
    let sgst = 0;

    rows.forEach(row => {
        const weight = parseFloat(row.querySelector('input[name="weight"]').value) || 0;
        const rate = parseFloat(row.querySelector('input[name="rate"]').value) || 0;
        const mcPct = parseFloat(row.querySelector('input[name="mc_pct"]').value) || 0;
        const gstPct = 3; // Fixed 3%

        const taxable = (weight * rate) * (1 + (mcPct / 100));
        const totalGst = taxable * (gstPct / 100);

        subTotal += taxable;
        cgst += totalGst / 2;
        sgst += totalGst / 2;
    });

    // Get additional charges
    const freightVal = parseFloat(document.querySelector('input[name="freight_amt"]')?.value) || 0;
    const rawGrandTotal = subTotal + cgst + sgst + freightVal;
    const roundOff = Math.round(rawGrandTotal) - rawGrandTotal;
    const grandTotal = rawGrandTotal + roundOff;

    // Auto-update round off input
    const roundOffInput = document.querySelector('input[name="round_off"]');
    if (roundOffInput) roundOffInput.value = roundOff.toFixed(2);

    document.getElementById('sub-total').textContent = `₹ ${subTotal.toFixed(2)}`;
    document.getElementById('cgst-total').textContent = `₹ ${cgst.toFixed(2)}`;
    document.getElementById('sgst-total').textContent = `₹ ${sgst.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `₹ ${grandTotal.toFixed(2)}`;

    document.getElementById('total-words').textContent = `${numberToWords(Math.round(grandTotal))} Only`;
}

// Live Syncing
if (invoiceForm) {
    invoiceForm.addEventListener('input', (e) => {
        // If the change was in an item block, calculation is already triggered by inline oninput
        // But for header fields and meta fields, we sync the template live
        calculateGrandTotal();
        syncWithTemplate();
    });
}

// Helpers
function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str;
}

// Print Functionality
let __stockDeducted = false;

function deductInvoiceStock() {
    if (__stockDeducted) return;
    const rows = itemsBody ? itemsBody.querySelectorAll('tr') : [];
    if (rows.length === 0) return;

    let history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
    let hasDeductions = false;

    rows.forEach(r => {
        const sel = r.querySelector('select[name="metal_type"]');
        const wtIn = r.querySelector('input[name="weight"]');
        if (sel && wtIn && sel.value !== 'none' && sel.value !== 'other') {
            let oldMetal = sel.value; // e.g., 'gold_22k', 'pure_gold', 'silver_925'
            let qty = parseFloat(wtIn.value) || 0;
            
            if (qty > 0) {
                hasDeductions = true;
                const invNo = document.getElementById('inv-no') ? document.getElementById('inv-no').value : 'Invoice';
                
                // Map old select values to new Inventory 'Gold' / 'Silver' families
                let metalFamily = 'Unknown';
                if (oldMetal.includes('gold')) metalFamily = 'Gold';
                if (oldMetal.includes('silver')) metalFamily = 'Silver';

                history.push({
                    date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: 'Invoice Sale',
                    metal: metalFamily, // Will map to 'Gold' or 'Silver' -> 'Metal' in inventory.html
                    weight: -qty,
                    note: 'Auto deduacted for ' + invNo
                });
            }
        }
    });

    if (hasDeductions) {
        localStorage.setItem('manti_stock_history', JSON.stringify(history));
        __stockDeducted = true;
    }
}

const printBtn = document.getElementById('print-invoice');
if (printBtn) {
    printBtn.addEventListener('click', () => {
        if (typeof syncWithTemplate === 'function') syncWithTemplate();
        if (typeof deductInvoiceStock === 'function') deductInvoiceStock();
        // Mark SO as completed if this is a despatch invoice
        if (window.__pendingDespatchSoId) {
            if (typeof markSOCompleted === 'function') markSOCompleted(window.__pendingDespatchSoId);
            localStorage.removeItem('manti_pending_despatch');
            window.__pendingDespatchSoId = null;
        }
        window.print();
    });
}


const draftInvoiceBtn = document.getElementById('save-draft-invoice');
if (draftInvoiceBtn) {
    draftInvoiceBtn.addEventListener('click', () => {
        const soSelect = document.getElementById('so-select');
        const soId = soSelect ? soSelect.value : null;

        if (!soId) {
            alert("Please select a Buyer's Order No (SO) before saving draft.");
            return;
        }

        if (typeof syncWithTemplate === 'function') syncWithTemplate();

        // Serialize and save as Draft
        const serializedData = serializeInvoiceData('Draft');
        let savedInvoices = JSON.parse(localStorage.getItem('manti_saved_invoices')) || {};
        savedInvoices[soId] = serializedData;
        localStorage.setItem('manti_saved_invoices', JSON.stringify(savedInvoices));

        alert('Invoice Saved as Draft ✅');
        // We don't reset the form for drafts, allowing continued editing
    });
}

const completeBtn = document.getElementById('complete-invoice');
if (completeBtn) {
    completeBtn.addEventListener('click', () => {
        const soSelect = document.getElementById('so-select');
        const soId = soSelect ? soSelect.value : null;

        if (!soId) {
            alert("Please select a Buyer's Order No (SO) before completing.");
            return;
        }

        if (confirm('Are you sure you want to Complete this invoice? It will be removed from the list and saved to the Production Report.')) {
            if (typeof syncWithTemplate === 'function') syncWithTemplate();
            if (typeof deductInvoiceStock === 'function') deductInvoiceStock();

            // Serialize and save to Production Report
            const serializedData = serializeInvoiceData('Completed');
            let savedInvoices = JSON.parse(localStorage.getItem('manti_saved_invoices')) || {};
            savedInvoices[soId] = serializedData;
            localStorage.setItem('manti_saved_invoices', JSON.stringify(savedInvoices));

            // Mark completed and clean up
            if (typeof markSOCompleted === 'function') markSOCompleted(soId);
            if (window.__pendingDespatchSoId === soId) {
                localStorage.removeItem('manti_pending_despatch');
                window.__pendingDespatchSoId = null;
            } else if (typeof markSOCompleted === 'function') {
                markSOCompleted(soId);
            }

            alert('Invoice Completed & Saved to Production Report ✅');
            invoiceForm.reset();
            populateSODropdown();
        }
    });
}

// Preview Functionality
const showPreviewBtn = document.getElementById('show-preview');
const previewModal = document.getElementById('preview-modal');
const closeModal = document.querySelector('.close-modal');
const previewContainer = document.getElementById('preview-container');
const printFromPreviewBtn = document.getElementById('print-from-preview');

if (showPreviewBtn) {
    showPreviewBtn.addEventListener('click', openPreview);
}

if (closeModal) {
    closeModal.addEventListener('click', closePreview);
}

if (printFromPreviewBtn) {
    printFromPreviewBtn.addEventListener('click', () => {
        if (typeof deductInvoiceStock === 'function') deductInvoiceStock();
        if (window.__pendingDespatchSoId) {
            if (typeof markSOCompleted === 'function') markSOCompleted(window.__pendingDespatchSoId);
            localStorage.removeItem('manti_pending_despatch');
            window.__pendingDespatchSoId = null;
        }
        window.print();
    });
}

// Close modal on outside click
window.addEventListener('click', (event) => {
    if (event.target == previewModal) {
        closePreview();
    }
});

function openPreview() {
    syncWithTemplate();
    const printContainer = document.getElementById('print-container');

    previewContainer.innerHTML = '';

    // Display all paginated sheets inside the preview modal
    if (printContainer) {
        Array.from(printContainer.children).forEach(page => {
            const pageClone = page.cloneNode(true);
            pageClone.style.marginBottom = '30px'; // Add visual gap between pages in preview
            pageClone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)'; // Add paper shadow
            previewContainer.appendChild(pageClone);
        });
    }

    previewModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent main page scrolling
}

function closePreview() {
    previewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}


function serializeInvoiceData(status = 'Completed') {
    const formData = new FormData(invoiceForm);
    const data = Object.fromEntries(formData.entries());

    data.items = [];
    data.status = status;
    const rows = itemsBody.querySelectorAll('tr');
    rows.forEach(row => {
        data.items.push({
            desc: row.querySelector('input[name="desc"]').value,
            hsn: row.querySelector('input[name="hsn"]').value,
            weight: row.querySelector('input[name="weight"]').value,
            metal_text: row.querySelector('select[name="metal_type"] option:checked').text,
            rate: row.querySelector('input[name="rate"]').value,
            mc_pct: row.querySelector('input[name="mc_pct"]').value
        });
    });

    data.subTotal = document.getElementById('sub-total').textContent;
    data.cgstTotal = document.getElementById('cgst-total').textContent;
    data.sgstTotal = document.getElementById('sgst-total').textContent;
    data.grandTotal = document.getElementById('grand-total').textContent;
    data.totalWords = document.getElementById('total-words').textContent;

    data.bank = JSON.parse(localStorage.getItem('manti_bank_details') || '{}');
    data.footer = localStorage.getItem('manti_invoice_defaults') ? JSON.parse(localStorage.getItem('manti_invoice_defaults')).footerText : 'THANK YOU WELCOME AGAIN';

    data.timestamp = new Date().toISOString();

    const jsonStr = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonStr)));
}

async function shareInvoice(platform) {
    deductInvoiceStock();
    const originalBtnText = platform === 'whatsapp' ? waBtn.textContent : emailBtn.textContent;
    const btn = platform === 'whatsapp' ? waBtn : emailBtn;
    if (btn) btn.textContent = 'Generating Link...';

    // Generate the encrypted data URL
    const linkData = serializeInvoiceData();
    let linkUrl = window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(linkData);

    // Try to compress/shorten the URL so it looks clean in WhatsApp
    try {
        const response = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(linkUrl));
        if (response.ok) {
            linkUrl = await response.text();
        }
    } catch (e) {
        console.warn("Could not shorten URL, using long link", e);
    }

    const formData = new FormData(invoiceForm);
    const billMobile = formData.get('bill_mobile') || '';
    const billEmail = formData.get('bill_email') || '';
    const invNo = formData.get('inv_no') || 'Draft';

    const targetMobile = billMobile || formData.get('ship_mobile') || '';
    const targetEmail = billEmail || formData.get('ship_email') || '';

    const paymentStatus = document.getElementById('payment-status').value;
    let message = `Hello, please find your invoice attached.\nInvoice No: ${invNo}\n\nClick the link securely below to view and download your invoice:\n${linkUrl}\n\nThanks for reaching us and visit again!`;

    // Add payment link if pending
    if (paymentStatus === 'pending') {
        const bankDataParams = JSON.parse(localStorage.getItem('manti_bank_details') || '{}');
        if (bankDataParams.upi) {
            const amount = (grandTotal || '').replace('₹ ', '').trim();
            const upiLink = `upi://pay?pa=${bankDataParams.upi}&pn=Manti%20Jewel%20Art&am=${amount}&cu=INR`;
            message += `\n\n📌 *Pending Payment:*\nYou can tap the link below to securely pay ₹${amount} via any UPI app:\n${upiLink}`;
        }
    }

    if (platform === 'whatsapp' && !targetMobile) {
        alert('Please enter a Mobile Number in the Bill To section.');
        if (btn) btn.textContent = originalBtnText;
        return;
    }
    if (platform === 'email' && !targetEmail) {
        alert('Please enter an Email ID in the Bill To section.');
        if (btn) btn.textContent = originalBtnText;
        return;
    }

    if (btn) btn.textContent = originalBtnText;

    if (platform === 'whatsapp') {
        const cleanNumber = targetMobile.replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    } else if (platform === 'email') {
        const subject = `Invoice ${invNo} from MANTI JEWEL ART P.LTD`;
        const mailtoLink = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
    }
}

function handleSharedInvoice(base64Data) {
    try {
        const jsonStr = decodeURIComponent(escape(atob(base64Data)));
        const data = JSON.parse(jsonStr);
        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('edit') === 'true';

        // If it's a draft and we want to edit, populate the form
        if (isEditMode && data.status === 'Draft') {
            fillInvoiceForm(data);
            return;
        }

        // Hide main app for pure viewing/printing
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.style.display = 'none';

        // Add a print header bar
        const printHeader = document.createElement('div');
        printHeader.style = "background: white; padding: 15px 20px; text-align: right; border-bottom: 2px solid var(--brand-orange); margin-bottom: 20px;";
        printHeader.innerHTML = '<button onclick="window.print()" class="btn-primary" style="font-size: 1rem; padding: 10px 20px;">Download / Print Invoice</button>';
        printHeader.className = "print-only-hide"; // class to hide when actually printing
        document.body.style.background = '#e0e0e0';
        document.body.prepend(printHeader);

        const style = document.createElement('style');
        style.innerHTML = `
            @media print { .print-only-hide { display: none !important; } }
            #print-container { display: block !important; text-align: center; }
            #print-container .print-page { display: inline-block !important; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; margin-bottom: 30px !important; }
            @media print { #print-container .print-page { box-shadow: none !important; margin: 0 !important; } }
        `;
        document.head.appendChild(style);

        // populate single fields
        const map = [
            ['bill_name', 'p-bill-name'], ['bill_address', 'p-bill-address'],
            ['bill_state', 'p-bill-state'], ['bill_gstin', 'p-bill-gstin'],
            ['ship_name', 'p-ship-name'], ['ship_address', 'p-ship-address'],
            ['ship_state', 'p-ship-state'], ['ship_gstin', 'p-ship-gstin'],
            ['inv_no', 'p-inv-no'], ['inv_date', 'p-inv-date'],
            ['payment_mode', 'p-payment-mode'], ['buyer_order', 'p-buyer-order'],
            ['supplier_ref', 'p-supplier-ref'], ['vehicle_no', 'p-vehicle'],
            ['delivery_date', 'p-delivery-date'], ['transport_details', 'p-transport'],
            ['eway_bill', 'p-eway-bill']
        ];
        map.forEach(([key, pId]) => {
            const el = document.getElementById(pId);
            if (el) el.textContent = data[key] || '-';
        });

        const pBillContact = document.getElementById('p-bill-contact');
        if (pBillContact) pBillContact.textContent = [data.bill_mobile, data.bill_email].filter(Boolean).join(' / ') || '-';
        const pShipContact = document.getElementById('p-ship-contact');
        if (pShipContact) pShipContact.textContent = [data.ship_mobile, data.ship_email].filter(Boolean).join(' / ') || '-';

        // Bank details
        if (data.bank) {
            const bankMap = [
                ['name', 'p-bank-name'], ['branch', 'p-bank-branch'],
                ['acc', 'p-bank-acc'], ['ifsc', 'p-bank-ifsc'],
                ['upi', 'p-bank-upi']
            ];
            bankMap.forEach(([key, pId]) => {
                const el = document.getElementById(pId);
                if (el) el.textContent = data.bank[key] || '-';
            });
        }

        // payment logic
        const seal = document.getElementById('paid-seal');
        const qr = document.getElementById('payment-qr');
        const bankSection = document.querySelector('.p-bank-info');
        if (data.payment_status === 'paid') {
            if (seal) seal.style.display = 'flex';
            if (qr) qr.style.display = 'none';
            if (bankSection) bankSection.style.visibility = 'hidden';
        } else {
            if (seal) seal.style.display = 'none';
            if (qr) {
                qr.style.display = 'flex';
                let upiId = data.bank?.upi || '';
                if (upiId) {
                    const amount = (data.grandTotal || '').replace('₹ ', '');
                    const upiLink = `upi://pay?pa=${upiId}&pn=Manti%20Jewel%20Art&am=${amount}&cu=INR`;
                    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
                }
            }
            if (bankSection) bankSection.style.visibility = 'visible';
        }

        // Table
        const pItemsBody = document.getElementById('p-items-body');
        if (pItemsBody) {
            pItemsBody.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach((item, index) => {
                    const w = parseFloat(item.weight) || 0;
                    const r = parseFloat(item.rate) || 0;
                    const m = parseFloat(item.mc_pct) || 0;
                    const taxable = w * r * (1 + m / 100);

                    const pRow = document.createElement('tr');
                    pRow.innerHTML = `
                        <td>${index + 1}</td>
                        <td style="text-align: left; padding-left: 10px;">${item.desc || '-'}</td>
                        <td>${item.hsn || '-'}</td>
                        <td>${item.weight || '-'}</td>
                        <td>${item.metal_text || '-'}</td>
                        <td>${item.rate || '-'}</td>
                        <td>${item.mc_pct ? item.mc_pct + '%' : '0%'}</td>
                        <td>${taxable > 0 ? taxable.toFixed(2) : '-'}</td>
                    `;
                    pItemsBody.appendChild(pRow);
                });
            }

            // taxable row
            const taxableRow = document.createElement('tr');
            taxableRow.className = 'taxable-row';
            taxableRow.innerHTML = `
                <td colspan="5" style="border: none;"></td>
                <td colspan="2" style="text-align: right; font-weight: bold; background: var(--bg-main);">Taxable:</td>
                <td style="font-weight: bold; background: var(--bg-main);">${data.subTotal || '-'}</td>
            `;
            pItemsBody.appendChild(taxableRow);
        }

        const footerBar = document.getElementById('invoice-template')?.querySelector('.p-bottom-bleed-bar');
        if (footerBar) footerBar.textContent = data.footer || 'THANK YOU WELCOME AGAIN';

        const mapTotals = [
            ['p-sub-total-print', data.subTotal || '-'],
            ['p-cgst-total-print', data.cgstTotal || '-'],
            ['p-sgst-total-print', data.sgstTotal || '-'],
            ['p-grand-total-final', data.grandTotal || '-'],
            ['p-total-words', data.totalWords || '-'],
            ['p-freight-total-print', !data.freight_amt || parseFloat(data.freight_amt) === 0 ? '-' : `₹ ${parseFloat(data.freight_amt).toFixed(2)}`],
            ['p-round-off-print', !data.round_off || parseFloat(data.round_off) === 0 ? '-' : `₹ ${parseFloat(data.round_off).toFixed(2)}`]
        ];
        mapTotals.forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        // Use the existing paginator logic! It works perfectly on the cloned template.
        // We override allRows gathering to fetch from the newly populated pItemsBody
        const template = document.getElementById('invoice-template');

        let printContainer = document.getElementById('print-container');
        if (!printContainer) {
            printContainer = document.createElement('div');
            printContainer.id = 'print-container';
            template.parentNode.insertBefore(printContainer, template.nextSibling);
        }
        printContainer.innerHTML = '';
        template.style.display = 'none';

        const tbody = template.querySelector('#p-items-body');
        const allRows = Array.from(tbody.querySelectorAll('tr'));
        tbody.innerHTML = '';

        const maxItemsPerPage = 12;
        const chunks = [];
        let tableRows = allRows;
        let pTaxableRow = null;

        if (tableRows.length > 0 && tableRows[tableRows.length - 1].classList.contains('taxable-row')) {
            pTaxableRow = tableRows.pop();
        }

        for (let i = 0; i < tableRows.length; i += maxItemsPerPage) {
            chunks.push(tableRows.slice(i, i + maxItemsPerPage));
        }
        if (chunks.length === 0) chunks.push([]);

        chunks.forEach((chunk, index) => {
            const isLastPage = (index === chunks.length - 1);
            const clone = template.cloneNode(true);
            clone.id = `invoice-page-${index + 1}`;
            clone.style.display = 'block';
            clone.classList.remove('print-only');
            clone.classList.add('print-page');

            const cloneBody = clone.querySelector('#p-items-body');
            chunk.forEach(row => cloneBody.appendChild(row.cloneNode(true)));

            if (isLastPage && pTaxableRow) {
                cloneBody.appendChild(pTaxableRow.cloneNode(true));
            } else if (!isLastPage) {
                const contRow = document.createElement('tr');
                contRow.innerHTML = '<td colspan="8" style="text-align: right; font-style: italic; border: none; padding-top: 15px;">Continued on next page...</td>';
                cloneBody.appendChild(contRow);
            }

            if (!isLastPage) {
                const footerGrid = clone.querySelector('.p-footer-grid');
                const wordsSection = clone.querySelector('.p-words-section');
                const signGrid = clone.querySelector('.p-sign-grid');

                if (footerGrid) footerGrid.style.display = 'none';
                if (wordsSection) wordsSection.style.display = 'none';
                if (signGrid) signGrid.style.display = 'none';

                clone.style.pageBreakAfter = 'always';
                clone.style.breakAfter = 'page';
            }

            if (index > 0) {
                const detailsRow = clone.querySelector('.p-details-row');
                if (detailsRow) detailsRow.style.display = 'none';
            }

            printContainer.appendChild(clone);
        });

    } catch (e) {
        console.error("Failed to load invoice from URL", e);
        alert("This invoice link appears to be invalid or broken.");
    }
}

const waBtn = document.getElementById('send-whatsapp');
if (waBtn) waBtn.addEventListener('click', () => shareInvoice('whatsapp'));

const emailBtn = document.getElementById('send-email');
if (emailBtn) emailBtn.addEventListener('click', () => shareInvoice('email'));

function togglePaymentDisplay() {
    const status = document.getElementById('payment-status').value;
    const seal = document.getElementById('paid-seal');
    const qr = document.getElementById('payment-qr');
    const bankSection = document.querySelector('.p-bank-info');

    if (status === 'paid') {
        // PAID: hide bank details and QR, show stamp
        if (seal) seal.style.display = 'flex';
        if (qr) qr.style.display = 'none';
        if (bankSection) bankSection.style.visibility = 'hidden';
    } else {
        // PENDING: show bank details and QR
        if (seal) seal.style.display = 'none';
        if (qr) { qr.style.display = 'flex'; generateQRCode(); }
        if (bankSection) bankSection.style.visibility = 'visible';
    }
}

function syncShippingDetails() {
    const syncCheckbox = document.getElementById('sync-shipping');
    if (!syncCheckbox) return;

    const isSynced = syncCheckbox.checked;
    if (isSynced) {
        document.getElementsByName('ship_name')[0].value = document.getElementsByName('bill_name')[0].value;
        document.getElementsByName('ship_address')[0].value = document.getElementsByName('bill_address')[0].value;
        document.getElementsByName('ship_state')[0].value = document.getElementsByName('bill_state')[0].value;
        document.getElementsByName('ship_gstin')[0].value = document.getElementsByName('bill_gstin')[0].value;
        document.getElementsByName('ship_mobile')[0].value = document.getElementsByName('bill_mobile')[0].value;
        document.getElementsByName('ship_email')[0].value = document.getElementsByName('bill_email')[0].value;
    }
}

function generateQRCode() {
    let upiId = "";
    const savedBank = localStorage.getItem('manti_bank_details');
    if (savedBank) {
        upiId = JSON.parse(savedBank).upi || "";
    }

    if (!upiId) return;

    const name = "Manti Jewel Art";
    const grandTotalEl = document.getElementById('grand-total');
    if (!grandTotalEl) return;
    const amount = grandTotalEl.textContent.replace('₹ ', '');
    const qrImage = document.getElementById('qr-image');
    if (!qrImage) return;

    // Using a public QR API (GoQR.me) to generate a UPI payment QR
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
}

function syncWithTemplate() {
    const formData = new FormData(invoiceForm);

    // Sync single fields
    const fields = [
        ['bill_name', 'p-bill-name'], ['bill_address', 'p-bill-address'],
        ['bill_state', 'p-bill-state'], ['bill_gstin', 'p-bill-gstin'],
        ['ship_name', 'p-ship-name'], ['ship_address', 'p-ship-address'],
        ['ship_state', 'p-ship-state'], ['ship_gstin', 'p-ship-gstin'],
        ['inv_no', 'p-inv-no'], ['inv_date', 'p-inv-date'],
        ['payment_mode', 'p-payment-mode'], ['buyer_order', 'p-buyer-order'],
        ['supplier_ref', 'p-supplier-ref'], ['vehicle_no', 'p-vehicle'],
        ['delivery_date', 'p-delivery-date'], ['transport_details', 'p-transport'],
        ['eway_bill', 'p-eway-bill'], ['bank_name', 'p-bank-name'], ['bank_branch', 'p-bank-branch'],
        ['bank_acc', 'p-bank-acc'], ['bank_ifsc', 'p-bank-ifsc'],
        ['bank_upi', 'p-bank-upi']
    ];

    fields.forEach(([formKey, pId]) => {
        const val = formData.get(formKey);
        const el = document.getElementById(pId);
        if (el) el.textContent = val || '-';
    });

    const billMobile = formData.get('bill_mobile') || '';
    const billEmail = formData.get('bill_email') || '';
    const pBillContact = document.getElementById('p-bill-contact');
    if (pBillContact) {
        let contactStr = [billMobile, billEmail].filter(Boolean).join(' / ');
        pBillContact.textContent = contactStr || '-';
    }

    const shipMobile = formData.get('ship_mobile') || '';
    const shipEmail = formData.get('ship_email') || '';
    const pShipContact = document.getElementById('p-ship-contact');
    if (pShipContact) {
        let contactStr = [shipMobile, shipEmail].filter(Boolean).join(' / ');
        pShipContact.textContent = contactStr || '-';
    }

    // Overwrite bank info from localStorage (Admin settings)
    const savedBank = localStorage.getItem('manti_bank_details');
    if (savedBank) {
        const bank = JSON.parse(savedBank);
        const bankMap = [
            ['name', 'p-bank-name'], ['branch', 'p-bank-branch'],
            ['acc', 'p-bank-acc'], ['ifsc', 'p-bank-ifsc'],
            ['upi', 'p-bank-upi']
        ];
        bankMap.forEach(([key, pId]) => {
            const el = document.getElementById(pId);
            if (el) el.textContent = bank[key] || '-';
        });
    }

    // Sync Payment Visuals
    togglePaymentDisplay();

    // Sync items table
    const pItemsBody = document.getElementById('p-items-body');
    pItemsBody.innerHTML = '';

    const rows = itemsBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const desc = row.querySelector('input[name="desc"]').value;
        const hsn = row.querySelector('input[name="hsn"]').value;
        const weight = row.querySelector('input[name="weight"]').value;
        const metalType = row.querySelector('select[name="metal_type"] option:checked').text;
        const rate = row.querySelector('input[name="rate"]').value;
        const mcPct = row.querySelector('input[name="mc_pct"]').value;

        const taxable = (parseFloat(weight) || 0) * (parseFloat(rate) || 0) * (1 + (parseFloat(mcPct) || 0) / 100);

        const pRow = document.createElement('tr');
        pRow.innerHTML = `
            <td>${index + 1}</td>
            <td style="text-align: left; padding-left: 10px;">${desc || '-'}</td>
            <td>${hsn || '-'}</td>
            <td>${parseFloat(weight) || '-'}</td>
            <td>${metalType}</td>
            <td>${parseFloat(rate) || '-'}</td>
            <td>${parseFloat(mcPct) || 0}%</td>
            <td>${taxable > 0 ? taxable.toFixed(2) : '-'}</td>
        `;
        pItemsBody.appendChild(pRow);
    });

    // Add Taxable row at the bottom of table
    const subTotalVal = document.getElementById('sub-total').textContent;
    const taxableRow = document.createElement('tr');
    taxableRow.className = 'taxable-row';
    taxableRow.innerHTML = `
        <td colspan="5" style="border: none;"></td>
        <td colspan="2" style="text-align: right; font-weight: bold; background: var(--bg-main);">Taxable:</td>
        <td style="font-weight: bold; background: var(--bg-main);">${subTotalVal}</td>
    `;
    pItemsBody.appendChild(taxableRow);

    // Sync footer text from admin defaults
    const savedDefaults = localStorage.getItem('manti_invoice_defaults');
    const footerText = savedDefaults ? (JSON.parse(savedDefaults).footerText || 'THANK YOU WELCOME AGAIN') : 'THANK YOU WELCOME AGAIN';
    const footerBar = document.getElementById('invoice-template')?.querySelector('.p-bottom-bleed-bar');
    if (footerBar) footerBar.textContent = footerText;

    // Sync totals
    const subTotalStr = document.getElementById('sub-total').textContent;

    // Summary IDs
    const cgstVal = document.getElementById('cgst-total').textContent;
    const sgstVal = document.getElementById('sgst-total').textContent;
    const wordsVal = document.getElementById('total-words').textContent;
    const grandTotalVal = document.getElementById('grand-total').textContent;

    const freightVal = document.querySelector('input[name="freight_amt"]')?.value || '0.00';
    const roundOffVal = document.querySelector('input[name="round_off"]')?.value || '0.00';

    // 'Sub-Total' label in table is now 'Taxable'
    // Already added above

    const map = [
        ['p-sub-total-print', subTotalStr],
        ['p-cgst-total-print', cgstVal],
        ['p-sgst-total-print', sgstVal],
        ['p-grand-total-final', grandTotalVal],
        ['p-total-words', wordsVal],
        ['p-freight-total-print', parseFloat(freightVal) === 0 ? '-' : `₹ ${parseFloat(freightVal).toFixed(2)}`],
        ['p-round-off-print', parseFloat(roundOffVal) === 0 ? '-' : `₹ ${parseFloat(roundOffVal).toFixed(2)}`]
    ];

    map.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    paginateInvoice();
}

function paginateInvoice() {
    const template = document.getElementById('invoice-template');
    if (!template) return;

    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        template.parentNode.insertBefore(printContainer, template.nextSibling);
    }

    printContainer.innerHTML = '';
    template.style.display = 'none';

    const tbody = template.querySelector('#p-items-body');
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    tbody.innerHTML = '';

    const maxItemsPerPage = 12; // Perfectly safe limit for A4
    const chunks = [];

    let tableRows = allRows;
    let taxableRow = null;

    if (tableRows.length > 0 && tableRows[tableRows.length - 1].classList.contains('taxable-row')) {
        taxableRow = tableRows.pop();
    }

    for (let i = 0; i < tableRows.length; i += maxItemsPerPage) {
        chunks.push(tableRows.slice(i, i + maxItemsPerPage));
    }

    if (chunks.length === 0) chunks.push([]);

    chunks.forEach((chunk, index) => {
        const isLastPage = (index === chunks.length - 1);
        const clone = template.cloneNode(true);
        clone.id = `invoice-page-${index + 1}`;
        clone.style.display = 'block';
        clone.classList.remove('print-only');
        clone.classList.add('print-page');

        const cloneBody = clone.querySelector('#p-items-body');
        chunk.forEach(row => cloneBody.appendChild(row.cloneNode(true)));

        if (isLastPage && taxableRow) {
            cloneBody.appendChild(taxableRow.cloneNode(true));
        } else if (!isLastPage) {
            const contRow = document.createElement('tr');
            contRow.innerHTML = `<td colspan="8" style="text-align: right; font-style: italic; border: none; padding-top: 15px;">Continued on next page...</td>`;
            cloneBody.appendChild(contRow);
        }

        if (!isLastPage) {
            const footerGrid = clone.querySelector('.p-footer-grid');
            const wordsSection = clone.querySelector('.p-words-section');
            const signGrid = clone.querySelector('.p-sign-grid');

            if (footerGrid) footerGrid.style.display = 'none';
            if (wordsSection) wordsSection.style.display = 'none';
            if (signGrid) signGrid.style.display = 'none';

            clone.style.pageBreakAfter = 'always';
            clone.style.breakAfter = 'page';
        }

        if (index > 0) {
            const detailsRow = clone.querySelector('.p-details-row');
            if (detailsRow) detailsRow.style.display = 'none';
        }

        printContainer.appendChild(clone);
    });

    tableRows.forEach(r => tbody.appendChild(r));
    if (taxableRow) tbody.appendChild(taxableRow);
}

const resetBtn = document.getElementById('reset-form');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the invoice?')) {
            invoiceForm.reset();
            itemsBody.innerHTML = '';
            addNewRow();
            calculateGrandTotal();
        }
    });
}
// --- Global Page Persistence Helper (Stay on same spot/state) ---
(function() {
    const PATH = window.location.pathname;
    
    // 1. Restore Scroll Position
    window.addEventListener('load', () => {
        const savedScroll = localStorage.getItem('manti_scroll_' + PATH);
        if (savedScroll) {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
        }
    });

    // 2. Persist Scroll Position during scrolling (debounced)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            localStorage.setItem('manti_scroll_' + PATH, window.scrollY);
        }, 300);
    });

    // 3. Persist Shared Global IDs (Search Bars)
    document.addEventListener('CloudDataLoaded', () => {
        const persistIds = ['search-report', 'search-jobwork', 'search-inventory', 'search-staff', 
                            'search-orders', 'search-customer', 'search-vendor'];
        
        persistIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            // Restore
            const savedVal = localStorage.getItem('manti_val_' + id);
            if (savedVal) {
                el.value = savedVal;
                // Trigger filter if function exists
                if (typeof window.filterTable === 'function') {
                    // Find table ID - usually it's [searchId - search] + table
                    const tableId = id.replace('search-', '') + '-table';
                    window.filterTable(id, tableId);
                }
            }

            // Save on change
            el.addEventListener('input', () => {
                localStorage.setItem('manti_val_' + id, el.value);
            });
        });
    });
})();

// Sidebar Navigation Group Toggle logic
window.toggleNavGroup = function(element) {
    const currentGroup = element.closest('.nav-group');
    if (currentGroup) {
        currentGroup.classList.toggle('expanded');
        if (window.innerWidth <= 768) {
            currentGroup.classList.toggle('active');
        }
    }
};

// Auto-sync sidebar active state based on current page URL
(function syncNavActive() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    // Remove all existing active classes
    document.querySelectorAll('.nav-item.active, .nav-item.nested.active').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-group.active-group').forEach(el => {
        el.classList.remove('active-group');
    });

    // Find the matching link and mark it active
    document.querySelectorAll('.sidebar-nav a.nav-item, .sidebar-nav a.nav-item.nested').forEach(link => {
        const href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
        if (href === currentFile) {
            link.classList.add('active');

            // If it's a nested item, expand and mark the parent nav-group
            const parentGroup = link.closest('.nav-group');
            if (parentGroup) {
                parentGroup.classList.add('expanded', 'active-group');
            }
        }
    });
})();


// Mobile View: Close active nav groups when clicking outside
document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
        const activeGroup = document.querySelector('.nav-group.active');
        // If clicking outside an active nav group, close it
        if (activeGroup && !activeGroup.contains(e.target)) {
            activeGroup.classList.remove('active');
        }
        
        // If clicking another nav group header, close other active ones
        if (e.target.closest('.nav-group-header')) {
            const clickedGroup = e.target.closest('.nav-group');
            document.querySelectorAll('.nav-group.active').forEach(group => {
                if (group !== clickedGroup) {
                    group.classList.remove('active');
                }
            });
        }
    }
});


// Mobile Hamburger menu injection
document.addEventListener('DOMContentLoaded', () => {
    const headerFlex = document.querySelector('.header-flex');
    const generatorHeader = document.querySelector('.generator-header');
    const dashboardHeader = document.querySelector('.dashboard-header');
    const contentHeader = document.querySelector('.content-header');
    const anyHeaderWrapper = document.querySelector('.header-content');
    
    // We try to attach to header-flex, or just the main header containers if header-flex isn't present
    const targetHeader = headerFlex || dashboardHeader || generatorHeader || contentHeader || anyHeaderWrapper;
    const sidebar = document.querySelector('.sidebar');
    
    if (targetHeader && sidebar && !document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.onclick = () => {
             sidebar.classList.toggle('open');
        };
        targetHeader.prepend(menuBtn);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
                sidebar.classList.remove('open');
            }
        }
    });
});


/**
 * Inventory System Migration v1
 * Purpose: Move historical Purchase Orders into the new Stock History ledger 
 * and calibrate the manti_stock_balances object.
 */
/**
 * Stable Inventory De-duplication & ID Assignment
 */
function runInventoryMigration() {
    let history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
    let orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    let changed = false;

    // 1. STABLE CLEANUP
    const cleanHistory = [];
    const seenFingers = new Set();
    
    // First pass: Find the highest existing ADJ number to prevent ID shuffling
    let maxIdNum = 0;
    history.forEach(h => {
        if (h.id && h.id.startsWith('ADJ-')) {
            const num = parseInt(h.id.replace('ADJ-', ''));
            if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
        }
    });

    history.forEach(h => {
        // Fingerprint: Date (Day only) + Metal + Weight + Type + Note (STRIPIING IDs for clean comparison)
        const datePart = (h.date || '').split(' ')[0];
        let notePart = (h.note || h.details || '').trim().toLowerCase();
        // Remove [ADJ-XXXX] or [PO-XXXX] from note to prevent unique fingerprints for duplicates
        notePart = notePart.replace(/\[(adj|po)-.*?\]/gi, '').trim();
        const finger = `${datePart}|${(h.metal||'').trim()}|${parseFloat(h.weight).toFixed(3)}|${(h.type||'').trim()}|${notePart}`;
        
        // If we have an ID, we prioritize keeping it. If we don't, we check fingerprint.
        const isPO = h.id && typeof h.id === 'string' && h.id.startsWith('PO-');
        if (seenFingers.has(finger) && !isPO) {
            changed = true;
            return; // Skip duplicate
        }
        seenFingers.add(finger);

        // Assign STABLE ID if missing or invalid (Handle UUIDs or random strings from database)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(h.id);
        const isRandom = h.id && h.id.length > 15 && !h.id.includes('-');
        if (!h.id || h.id === 'undefined' || h.id === 'null' || isUuid || isRandom) {
            maxIdNum++;
            h.id = `ADJ-${maxIdNum.toString().padStart(4, '0')}`;
            changed = true;
        }
        cleanHistory.push(h);
    });

    // 2. MIGRATE MISSING POs
    orders.forEach(o => {
        if (o.type === 'Purchase Order' && o.status === 'Completed' && o.qty) {
            const alreadyIn = cleanHistory.some(h => (h.id === o.id) || (h.note && h.note.includes(o.id)));
            if (!alreadyIn) {
                const wt = parseFloat(o.qty) || 0;
                const m = (o.mainMetalType || '').toLowerCase();
                let key = '';
                if (m.includes('gold')) key = (o.product||'').toLowerCase().includes('24k') ? 'pure_gold' : 'gold_22k';
                else if (m.includes('silver')) key = (o.product||'').toLowerCase().includes('999') ? 'pure_silver' : 'silver_925';
                else if (m.includes('copper')) key = 'copper';
                else if (m.includes('zinc')) key = 'zinc';

                if (key) {
                    const d = o.date ? new Date(o.date) : new Date();
                    const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    cleanHistory.push({
                        id: o.id, date: formattedDate, type: 'Buy', metal: key, weight: wt, note: 'PO Migrated: ' + o.id
                    });
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        localStorage.setItem('manti_stock_history', JSON.stringify(cleanHistory));
        if (window.syncKeyToSupabase) window.syncKeyToSupabase('manti_stock_history', cleanHistory);
    }
}

// Trigger migration on load
document.addEventListener('DOMContentLoaded', () => {
    runInventoryMigration();
    runStockCalibration();
});

// Also trigger on sync
document.addEventListener('CloudDataLoaded', () => {
    runInventoryMigration();
});

/**
 * One-time Stock Calibration
 * Ensures specific target weights requested by the user are represented.
 */
function runStockCalibration() {
    if (localStorage.getItem('manti_stock_calibrated_v3')) return;

    let history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
    let initialCount = history.length;
    
    // 1. Remove any old CALIB- records or interim duplicates
    history = history.filter(h => {
        if (!h.id) return true;
        if (h.id.startsWith('CALIB-')) return false;
        // Also remove if it has [CALIB- in the note/details
        if ((h.note || '').includes('[CALIB-')) return false;
        if ((h.details || '').includes('[CALIB-')) return false;
        return true;
    });

    const targets = [
        { id: 'ADJ-0004', metal: 'zinc', weight: 25.0, note: 'Initial Stock Calibration (Zinc)' },
        { id: 'ADJ-0001', metal: 'pure_silver', weight: 100.0, note: 'Initial Stock Calibration (Silver)' },
        { id: 'ADJ-0003', metal: 'copper', weight: 50.0, note: 'Initial Stock Calibration (Copper)' },
        { id: 'ADJ-0002', metal: 'pure_silver', weight: 10.0, note: 'Initial Stock Calibration (Akshyathiruthiyai)' }
    ];

    targets.forEach(t => {
        const exists = history.some(h => h.id === t.id);
        if (!exists) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            history.push({
                id: t.id,
                date: formattedDate,
                type: 'Calibration',
                metal: t.metal,
                weight: t.weight,
                note: t.note
            });
        }
    });

    if (history.length !== initialCount) {
        localStorage.setItem('manti_stock_history', JSON.stringify(history));
        if (window.syncKeyToSupabase) {
            window.syncKeyToSupabase('manti_stock_history', history);
        }
        console.log("Manti ERP Stock Calibration (v3) Applied.");
    }
    localStorage.setItem('manti_stock_calibrated_v3', 'true');
}

/**
 * Global Inventory Calculator
 * Derives current stock balances from manti_stock_history, POs, and Job Work.
 * This is the new single source of truth for stock levels.
 */
window.calculateMantiBalances = function() {
    const history = JSON.parse(localStorage.getItem('manti_stock_history')) || [];
    const orders = JSON.parse(localStorage.getItem('manti_order_records')) || [];
    const jobRecords = JSON.parse(localStorage.getItem('manti_jobwork_records')) || [];

    // Initialize with zeros
    const balances = {
        pure_gold_9999: 0, pure_gold_999: 0, pure_gold_995: 0,
        gold_22k: 0,
        pure_silver_9999: 0, pure_silver_999: 0, pure_silver_995: 0,
        silver_925: 0,
        copper: 0,   // 100% pure only
        zinc: 0,     // 100% pure only
        iridium: 0,  // 100% pure only
        solder: 0
    };

    // 1. Process History (Manual adjustments, Melting outputs/inputs, etc.)
    history.forEach(h => {
        let metal = h.metal;
        // Legacy fallback mapping
        if (metal === 'pure_gold') metal = 'pure_gold_999';
        if (metal === 'pure_silver') metal = 'pure_silver_999';

        const weight = parseFloat(h.weight) || 0;
        if (metal && balances.hasOwnProperty(metal)) {
            balances[metal] += weight;
        }
    });

    // 2. Process Purchase Orders (Completed only, NOT in history yet)
    orders.forEach(o => {
        if (o.type === 'Purchase Order' && o.qty && o.status === 'Completed') {
            const alreadyIn = history.some(h => (h.note && h.note.includes(o.id)) || (h.details && h.details.includes(o.id)));
            if (alreadyIn) return;

            const wt = parseFloat(o.qty) || 0;
            const m = (o.mainMetalType || '').toLowerCase();
            let key = '';
            if (m.includes('gold')) {
                const p = (o.purity || '').toString();
                const prod = (o.product || '').toLowerCase();
                
                if (p === '99.99' || prod.includes('99.99') || prod.includes('9999')) key = 'pure_gold_9999';
                else if (p === '99.9' || prod.includes('99.9') || prod.includes('999')) key = 'pure_gold_999';
                else if (p === '99.5' || prod.includes('99.5') || prod.includes('995')) key = 'pure_gold_995';
                else if (p === '24k' || prod.includes('24k') || prod.includes('pure')) key = 'pure_gold_999';
                else key = 'gold_22k';
            } else if (m.includes('silver')) {
                const p = (o.purity || '').toString();
                const prod = (o.product || '').toLowerCase();
                
                if (p === '99.99' || prod.includes('99.99') || prod.includes('9999')) key = 'pure_silver_9999';
                else if (p === '99.9' || prod.includes('99.9') || prod.includes('999')) key = 'pure_silver_999';
                else if (p === '99.5' || prod.includes('99.5') || prod.includes('995')) key = 'pure_silver_995';
                else if (prod.includes('pure')) key = 'pure_silver_999';
                else key = 'silver_925';
            } else if (m.includes('copper')) key = 'copper';
            else if (m.includes('zinc')) key = 'zinc';
            else if (m.includes('iridium')) key = 'iridium';

            if (key && balances.hasOwnProperty(key)) {
                balances[key] += wt;
            }
        }
    });

    // 3. Process Job Work (Outflow/Inflow)
    jobRecords.forEach(r => {
        if (r.doc_status === 'Draft') return;
        const so = orders.find(o => o.id === r.jobnum);
        const mainM = so ? (so.mainMetalType || '').toLowerCase() : '';
        let key = '';
        if (mainM.includes('gold')) key = 'gold_22k';
        else if (mainM.includes('silver')) key = 'silver_925';
        else if (mainM.includes('copper')) key = 'copper';
        else if (mainM.includes('zinc')) key = 'zinc';
        else if (mainM.includes('iridium')) key = 'iridium';

        if (key && balances.hasOwnProperty(key)) {
            if (r.status === '1. Issue') {
                let wt = 0;
                if (r.issueLines && r.issueLines.length > 0) {
                    wt = r.issueLines.reduce((s, l) => s + (parseFloat(l.weight) || 0), 0);
                } else {
                    wt = parseFloat(r.issueWt) || 0;
                }
                balances[key] -= wt;
            }
            if (r.status === '2. Receive') {
                let wt = 0;
                if (r.receiveLines && r.receiveLines.length > 0) {
                    wt = r.receiveLines.reduce((s, l) => s + (l.type !== 'Wastage' ? (parseFloat(l.weight) || 0) : 0), 0);
                } else {
                    wt = parseFloat(r.receiveWt) || 0;
                }
                balances[key] += wt;
            }
        }
    });

    // Fix precision
    Object.keys(balances).forEach(k => {
        if (typeof balances[k] === 'number') {
            balances[k] = parseFloat(balances[k].toFixed(3));
        }
    });

    // Calculate 99.99 Equivalents
    balances.gold_9999_equiv = (
        ((balances.pure_gold_9999 || 0) * 99.99 / 99.99) +
        ((balances.pure_gold_999 || 0) * 99.9 / 99.99) +
        ((balances.pure_gold_995 || 0) * 99.5 / 99.99) +
        ((balances.gold_22k || 0) * 91.67 / 99.99)
    );

    balances.silver_9999_equiv = (
        ((balances.pure_silver_9999 || 0) * 99.99 / 99.99) +
        ((balances.pure_silver_999 || 0) * 99.9 / 99.99) +
        ((balances.pure_silver_995 || 0) * 99.5 / 99.99) +
        ((balances.silver_925 || 0) * 92.7 / 99.99)
    );

    return balances;
};
