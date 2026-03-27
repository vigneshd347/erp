import re

with open("script.js", "r") as f:
    content = f.read()

# Replace shareInvoice completely
new_share_invoice = """
// Global variable to hold pre-generated link
window.bgGeneratedLink = null;

function generatePreview() {
    // Reset background link
    window.bgGeneratedLink = null;
    
    // ... start generating background link immediately without blocking UI
    setTimeout(async () => {
        try {
            const linkData = serializeInvoiceData();
            let longUrl = window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(linkData);
            window.bgGeneratedLink = longUrl; // fallback instantly available
            
            const response = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longUrl));
            if (response.ok) {
                window.bgGeneratedLink = await response.text();
            }
        } catch (e) {
            console.warn("Background URL generation failed", e);
        }
    }, 10);

    const formData = new FormData(invoiceForm);
    const pBillName = document.getElementById('p-bill-name');
    if (pBillName) pBillName.textContent = formData.get('bill_name') || '-';

    const pBillAddress = document.getElementById('p-bill-address');
    if (pBillAddress) pBillAddress.textContent = formData.get('bill_address') || '-';

    const pBillState = document.getElementById('p-bill-state');
    if (pBillState) pBillState.textContent = formData.get('bill_state') || '-';

    const pBillGstin = document.getElementById('p-bill-gstin');
    if (pBillGstin) pBillGstin.textContent = formData.get('bill_gstin') || '-';

    const pBillContact = document.getElementById('p-bill-contact');
    if (pBillContact) {
        const mobile = formData.get('bill_mobile');
        const email = formData.get('bill_email');
        pBillContact.textContent = [mobile, email].filter(Boolean).join(' / ') || '-';
    }

    const pShipName = document.getElementById('p-ship-name');
    if (pShipName) pShipName.textContent = formData.get('ship_name') || '-';

    const pShipAddress = document.getElementById('p-ship-address');
    if (pShipAddress) pShipAddress.textContent = formData.get('ship_address') || '-';

    const pShipState = document.getElementById('p-ship-state');
    if (pShipState) pShipState.textContent = formData.get('ship_state') || '-';

    const pShipGstin = document.getElementById('p-ship-gstin');
    if (pShipGstin) pShipGstin.textContent = formData.get('ship_gstin') || '-';

    const pShipContact = document.getElementById('p-ship-contact');
    if (pShipContact) {
        const mobile = formData.get('ship_mobile');
        const email = formData.get('ship_email');
        pShipContact.textContent = [mobile, email].filter(Boolean).join(' / ') || '-';
    }

    const invNo = document.getElementById('p-inv-no');
    if (invNo) invNo.textContent = formData.get('inv_no') || '-';

    const invDate = document.getElementById('p-inv-date');
    if (invDate) invDate.textContent = formData.get('inv_date') || '-';

    const paymentMode = document.getElementById('p-payment-mode');
    if (paymentMode) paymentMode.textContent = formData.get('payment_mode') || '-';

    const buyerOrder = document.getElementById('p-buyer-order');
    if (buyerOrder) buyerOrder.textContent = formData.get('buyer_order') || '-';

    const supplierRef = document.getElementById('p-supplier-ref');
    if (supplierRef) supplierRef.textContent = formData.get('supplier_ref') || '-';

    const vehicleNo = document.getElementById('p-vehicle');
    if (vehicleNo) vehicleNo.textContent = formData.get('vehicle_no') || '-';

    const deliveryDate = document.getElementById('p-delivery-date');
    if (deliveryDate) deliveryDate.textContent = formData.get('delivery_date') || '-';

    const transportDetails = document.getElementById('p-transport');
    if (transportDetails) transportDetails.textContent = formData.get('transport_details') || '-';

    const ewayBill = document.getElementById('p-eway-bill');
    if (ewayBill) ewayBill.textContent = formData.get('eway_bill') || '-';


    const pItemsBody = document.getElementById('p-items-body');
    if (pItemsBody) {
        pItemsBody.innerHTML = '';
        const rows = itemsBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const desc = row.querySelector('input[name="desc"]').value || '-';
            const hsn = row.querySelector('input[name="hsn"]').value || '-';
            const weightInput = row.querySelector('input[name="weight"]');
            const weightVal = weightInput.value || '-';
            const metalText = row.querySelector('select[name="metal_type"] option:checked').text || '-';
            const rateInput = row.querySelector('input[name="rate"]');
            const rateVal = rateInput.value || '-';
            const mcPctInput = row.querySelector('input[name="mc_pct"]');
            const mcPctVal = mcPctInput.value ? mcPctInput.value + '%' : '0%';
            
            const w = parseFloat(weightInput.value) || 0;
            const r = parseFloat(rateInput.value) || 0;
            const m = parseFloat(mcPctInput.value) || 0;
            const taxable = w * r * (1 + m/100);

            const pRow = document.createElement('tr');
            pRow.innerHTML = `
                <td>${index + 1}</td>
                <td style="text-align: left; padding-left: 10px;">${desc}</td>
                <td>${hsn}</td>
                <td>${weightVal}</td>
                <td>${metalText}</td>
                <td>${rateVal}</td>
                <td>${mcPctVal}</td>
                <td>${taxable > 0 ? taxable.toFixed(2) : '-'}</td>
            `;
            pItemsBody.appendChild(pRow);
        });

        const taxableRow = document.createElement('tr');
        taxableRow.className = 'taxable-row';
        taxableRow.innerHTML = `
            <td colspan="5" style="border: none;"></td>
            <td colspan="2" style="text-align: right; font-weight: bold; background: #f9f9f9;">Taxable:</td>
            <td style="font-weight: bold; background: #f9f9f9;">${document.getElementById('sub-total').textContent}</td>
        `;
        pItemsBody.appendChild(taxableRow);
    }

    const pSubTotal = document.getElementById('p-sub-total-print');
    if (pSubTotal) pSubTotal.textContent = document.getElementById('sub-total').textContent;

    const pCgstTotal = document.getElementById('p-cgst-total-print');
    if (pCgstTotal) pCgstTotal.textContent = document.getElementById('cgst-total').textContent;

    const pSgstTotal = document.getElementById('p-sgst-total-print');
    if (pSgstTotal) pSgstTotal.textContent = document.getElementById('sgst-total').textContent;

    const pGrandTotal = document.getElementById('p-grand-total-final');
    if (pGrandTotal) pGrandTotal.textContent = document.getElementById('grand-total').textContent;

    const pTotalWords = document.getElementById('p-total-words');
    if (pTotalWords) pTotalWords.textContent = document.getElementById('total-words').textContent;
    
    // Freight and Round Off
    const pFreightTotal = document.getElementById('p-freight-total-print');
    const freightVal = parseFloat(document.getElementById('freight-amt').value) || 0;
    if (pFreightTotal) {
        if (freightVal === 0) {
            pFreightTotal.textContent = '-';
        } else {
            pFreightTotal.textContent = '₹ ' + freightVal.toFixed(2);
        }
    }

    const pRoundOff = document.getElementById('p-round-off-print');
    const roundOffVal = parseFloat(document.getElementById('round-off').value) || 0;
    if (pRoundOff) {
        if (roundOffVal === 0) {
            pRoundOff.textContent = '-';
        } else {
            pRoundOff.textContent = '₹ ' + roundOffVal.toFixed(2);
        }
    }

    // Handle payment status and QR code logic
    const paymentStatus = document.getElementById('payment-status').value;
    const seal = document.getElementById('paid-seal');
    const qr = document.getElementById('payment-qr');
    const bankSection = document.querySelector('.p-bank-info');
    
    if (paymentStatus === 'paid') {
        if (seal) seal.style.display = 'flex';
        if (qr) qr.style.display = 'none';
        if (bankSection) bankSection.style.visibility = 'hidden';
    } else {
        if (seal) seal.style.display = 'none';
        if (qr) {
            qr.style.display = 'flex';
            // Generate QR code if UPI ID is available
            const savedBank = localStorage.getItem('manti_bank_details');
            if (savedBank) {
                const bankData = JSON.parse(savedBank);
                if (bankData.upi) {
                    const amount = document.getElementById('grand-total').textContent.replace('₹ ', '');
                    const upiLink = `upi://pay?pa=${bankData.upi}&pn=Manti%20Jewel%20Art&am=${amount}&cu=INR`;
                    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
                }
            }
        }
        if (bankSection) bankSection.style.visibility = 'visible';
    }

    // Run pagination engine on the newly populated template items!
    paginateInvoice();

    // Reattach close listeners to any cloned close buttons
    const closeBtns = document.querySelectorAll('.close');
    if (closeBtns.length > 0) {
        closeBtns.forEach(btn => {
            btn.removeEventListener('click', closePreview); 
            btn.addEventListener('click', closePreview);
        });
    }

    previewModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent main page scrolling
}

function closePreview() {
    previewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}


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
    const originalBtnText = platform === 'whatsapp' ? waBtn.textContent : emailBtn.textContent;
    const btn = platform === 'whatsapp' ? waBtn : emailBtn;

    // Wait until the background generation finishes if the user clicks incredibly fast
    if (!window.bgGeneratedLink) {
        if (btn) btn.textContent = 'Generating Link...';
        for(let i=0; i<30 && !window.bgGeneratedLink; i++) {
             await new Promise(r => setTimeout(r, 100)); // wait up to 3 seconds for tinyurl
        }
    }
    
    // Use minified bg link. If not ready, construct long local link immediately.
    const linkUrl = window.bgGeneratedLink || (window.location.origin + window.location.pathname + "?data=" + encodeURIComponent(serializeInvoiceData()));
"""

start_marker = "function generatePreview() {"
end_marker = "    const formData = new FormData(invoiceForm);"

start_idx = content.find(start_marker)
end_idx = content.find("    const formData = new FormData(invoiceForm);\n    const billMobile = formData.get('bill_mobile') || '';")

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_share_invoice + "\n" + content[end_idx:]

with open("script.js", "w") as f:
    f.write(content)
