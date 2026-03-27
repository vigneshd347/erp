import re

with open("script.js", "r") as f:
    content = f.read()

# Fix the global itemsBody and addItemBtn to not crash on other pages
content = content.replace("const itemsBody = document.getElementById('items-body');", "// const itemsBody moved inside functions")
content = content.replace("addItemBtn.addEventListener('click', addNewRow);", "if (document.getElementById('add-item')) document.getElementById('add-item').addEventListener('click', addNewRow);")

# Update addNewRow to find tbody dynamically
new_add_row = """
function addNewRow() {
    const tbody = document.getElementById('items-body');
    if (!tbody) return;
    const tableId = tbody.closest('table').id;

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

# Update updateRowNumbers to find tbody dynamically
new_update_rows = """
function updateRowNumbers() {
    const tbody = document.getElementById('items-body');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
}
"""
content = re.sub(r'function updateRowNumbers\(\) \{.*?\}', new_update_rows, content, flags=re.DOTALL)

with open("script.js", "w") as f:
    f.write(content)
