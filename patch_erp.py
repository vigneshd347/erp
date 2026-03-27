import re

with open("script.js", "r") as f:
    content = f.read()

# Replace addNewRow
new_add_row = """
function addNewRow() {
    const tableId = document.getElementById('purchase-items') ? 'purchase-items' : 'items-table';
    const tbody = document.getElementById('items-body');
    if (!tbody) return;

    const row = document.createElement('tr');
    const srNo = tbody.querySelectorAll('tr').length + 1;
    const hsn = getDefaultHsn();

    let rowHtml = `
        <td>${srNo}</td>
        <td><input type="text" name="desc" placeholder="Product Name"></td>
        <td><input type="text" name="hsn" value="${hsn}" placeholder="HSN"></td>
        <td><input type="number" name="weight" placeholder="0.000" step="0.001" oninput="onNumberInput(this); calculateRow(this)"></td>
        <td>
            <select name="metal_type" onchange="handleMetalChange(this)">
                <option value="none">Select Metal</option>
                <option value="pure_gold">Pure Gold (24K)</option>
                <option value="gold_22k">Gold (22K)</option>
                <option value="pure_silver">Pure Silver</option>
                <option value="silver_925">Silver (925)</option>
                <option value="other">Other</option>
            </select>
        </td>
    `;

    if (tableId === 'purchase-items') {
        rowHtml += `
            <td><input type="number" name="rate" placeholder="Rate" step="0.01" oninput="onNumberInput(this); calculateRow(this)"></td>
            <td><span class="row-total">-</span></td>
            <td><button type="button" class="btn-remove" onclick="removeRow(this)">×</button></td>
        `;
    } else {
        rowHtml += `
            <td><input type="number" name="rate" placeholder="Rate" step="0.01" oninput="onNumberInput(this); calculateRow(this)"></td>
            <td><input type="number" name="mc_pct" placeholder="0" step="0.1" oninput="onNumberInput(this); calculateRow(this)"></td>
            <td><span class="row-total">-</span></td>
            <td><button type="button" class="btn-remove" onclick="removeRow(this)">×</button></td>
        `;
    }

    row.innerHTML = rowHtml;
    tbody.appendChild(row);
}
"""

content = re.sub(r'function addNewRow\(\) \{.*?\}', new_add_row, content, flags=re.DOTALL)

# Replace calculateRow
new_calc_row = """
function calculateRow(input) {
    const row = input.closest('tr');
    const weight = parseFloat(row.querySelector('input[name="weight"]').value) || 0;
    const rate = parseFloat(row.querySelector('input[name="rate"]').value) || 0;
    const mcInput = row.querySelector('input[name="mc_pct"]');
    const mcPct = mcInput ? (parseFloat(mcInput.value) || 0) : 0;

    const taxable = (weight * rate) * (1 + (mcPct / 100));

    row.querySelector('.row-total').textContent = taxable > 0 ? `₹ ${taxable.toFixed(2)}` : '-';
    calculateGrandTotal();
}
"""

content = re.sub(r'function calculateRow\(input\) \{.*?\}', new_calc_row, content, flags=re.DOTALL)

# Replace calculateGrandTotal
new_calc_grand = """
function calculateGrandTotal() {
    const tbody = document.getElementById('items-body');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    let subTotal = 0;
    let cgst = 0;
    let sgst = 0;

    const isPurchase = !!document.getElementById('purchase-items');

    rows.forEach(row => {
        const weight = parseFloat(row.querySelector('input[name="weight"]').value) || 0;
        const rate = parseFloat(row.querySelector('input[name="rate"]').value) || 0;
        const mcInput = row.querySelector('input[name="mc_pct"]');
        const mcPct = mcInput ? (parseFloat(mcInput.value) || 0) : 0;
        const gstPct = 3; // Fixed 3%

        const taxable = (weight * rate) * (1 + (mcPct / 100));
        subTotal += taxable;

        if (!isPurchase) {
            const totalGst = taxable * (gstPct / 100);
            cgst += totalGst / 2;
            sgst += totalGst / 2;
        }
    });

    const subTotalEl = document.getElementById('sub-total');
    if (subTotalEl) subTotalEl.textContent = `₹ ${subTotal.toFixed(2)}`;

    if (isPurchase) {
        const grandTotalEl = document.getElementById('grand-total');
        if (grandTotalEl) grandTotalEl.textContent = `₹ ${subTotal.toFixed(2)}`;
        return;
    }

    // Sales-specific logic
    const freightVal = parseFloat(document.querySelector('input[name="freight_amt"]')?.value) || 0;
    const rawGrandTotal = subTotal + cgst + sgst + freightVal;
    const roundOff = Math.round(rawGrandTotal) - rawGrandTotal;
    const grandTotal = rawGrandTotal + roundOff;

    const roundOffInput = document.querySelector('input[name="round_off"]');
    if (roundOffInput) roundOffInput.value = roundOff.toFixed(2);

    const cgstEl = document.getElementById('cgst-total');
    if (cgstEl) cgstEl.textContent = `₹ ${cgst.toFixed(2)}`;
    const sgstEl = document.getElementById('sgst-total');
    if (sgstEl) sgstEl.textContent = `₹ ${sgst.toFixed(2)}`;

    const grandTotalEl = document.getElementById('grand-total');
    if (grandTotalEl) {
        grandTotalEl.textContent = `₹ ${grandTotal.toFixed(2)}`;
        updateTotalWords(grandTotal);
    }
}
"""

content = re.sub(r'function calculateGrandTotal\(\) \{.*?\}', new_calc_grand, content, flags=re.DOTALL)

with open("script.js", "w") as f:
    f.write(content)
