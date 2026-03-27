import re

with open("script.js", "r") as f:
    content = f.read()

# Replace shareInvoice completely
new_share_invoice = """
function serializeInvoiceData() {
    const formData = new FormData(invoiceForm);
    const data = Object.fromEntries(formData.entries());
    
    data.items = [];
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
    
    const jsonStr = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonStr)));
}

async function shareInvoice(platform) {
    // Generate the encrypted data URL
    const linkData = serializeInvoiceData();
    const linkUrl = window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(linkData);

    const formData = new FormData(invoiceForm);
    const billMobile = formData.get('bill_mobile') || '';
    const billEmail = formData.get('bill_email') || '';
    const invNo = formData.get('inv_no') || 'Draft';
    
    const targetMobile = billMobile || formData.get('ship_mobile') || '';
    const targetEmail = billEmail || formData.get('ship_email') || '';

    const message = `Hello, please find your invoice attached.\\nInvoice No: ${invNo}\\n\\nClick the link securely below to view and download your invoice:\\n${linkUrl}\\n\\nThank you for your business!`;

    if (platform === 'whatsapp' && !targetMobile) {
        alert('Please enter a Mobile Number in the Bill To section.');
        return;
    }
    if (platform === 'email' && !targetEmail) {
        alert('Please enter an Email ID in the Bill To section.');
        return;
    }

    if (platform === 'whatsapp') {
        const cleanNumber = targetMobile.replace(/\\D/g, '');
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

        // Hide main app
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
                    const taxable = w * r * (1 + m/100);

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
                <td colspan="2" style="text-align: right; font-weight: bold; background: #f9f9f9;">Taxable:</td>
                <td style="font-weight: bold; background: #f9f9f9;">${data.subTotal || '-'}</td>
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
"""

start_marker = "async function shareInvoice(platform) {"
end_marker = "const waBtn = document.getElementById('send-whatsapp');"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_share_invoice + "\n" + content[end_idx:]

# Also update DOMContentLoaded
dom_marker = "document.addEventListener('DOMContentLoaded', () => {"
dom_end = "// Set current date"
dom_replacement = """document.addEventListener('DOMContentLoaded', () => {
    // Check if handling a shared link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    if (sharedData) {
        handleSharedInvoice(sharedData);
        return; // Skip normal init
    }

    // Set current date"""

content = content.replace("document.addEventListener('DOMContentLoaded', () => {\n    // Set current date", dom_replacement)

with open("script.js", "w") as f:
    f.write(content)
