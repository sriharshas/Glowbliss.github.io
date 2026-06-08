// Invoice Management System with Tax Calculations

// Business Details
const BUSINESS = {
    name: "Glow Bliss Beauty Parlour",
    address: "H.J.A. Hovens Grevestraat 15",
    city: "1333 KX Almere Buiten, Netherlands",
    phone: "+31633343093",
    email: "mounicaraj1497@gmail.com",
    website: "https://glowbliss-beautyparlour.nl"
};

// Rate Card with Tax Information
const RATE_CARD = {
    "Threading": { tax_rate: 9, services: {
        "Eye Brows": 5.0, "Upper Lip+Chin": 5.0, "Forehead": 3.0, "Neck": 5.0, "Side Locks": 5.0, "Full Face": 12.0
    }},
    "Hair": { tax_rate: 9, services: {
        "Straight Cut": 7.0, "Trimming": 10.0, "V Shape": 12.0, "U Shape": 12.0,
        "Layered Cut": 22.0, "Adv. Layers Cut": 27.0, "Feather Cut": 25.0, "Fringes": 7.0,
        "Bob A-Line Cut": 30.0, "Normal Hair Wash": 15.0, "Hair Spa": 25.0
    }},
    "Waxing Rica": { tax_rate: 21, services: {
        "Back Neck": 10.0, "Full Back": 40.0, "Full Face": 20.0, "Full Hands": 15.0, 
        "Half Hands": 10.0, "Full Legs": 25.0, "Half Legs": 20.0, "Under Arms": 10.0
    }},
    "Waxing Brazilian": { tax_rate: 21, services: {
        "Back Neck": 15.0, "Full Back": 50.0, "Full Face": 25.0, "Full Hands": 20.0, 
        "Half Hands": 15.0, "Full Legs": 30.0, "Half Legs": 25.0, "Under Arms": 15.0
    }},
    "Pedicure": { tax_rate: 21, services: {
        "Legs": 30.0, "French": 35.0, "Ozone": 45.0
    }},
    "Manicure": { tax_rate: 21, services: {
        "Hands": 25.0, "French": 30.0, "Ozone": 35.0
    }},
    "Regular Facials": { tax_rate: 21, services: {
        "Basic Cleanup": 18.0, "Fruit Cleanup": 20.0, "Papaya Facial": 30.0,
        "Silver": 30.0, "Gold": 30.0, "Diamond": 35.0, "Pearl": 38.0, "Red Wine": 32.0,
        "Fruit": 27.0, "O3+ Seaweed": 35.0, "O3+ Brightening": 40.0,
        "Detan Raga": 15.0, "Detan Naturals": 18.0, "Detan O3": 20.0,
        "Gold Cream Bleach": 15.0, "Party Glow": 38.0, "Anti Acne": 33.0
    }},
    "Signature Hydra Facial": { tax_rate: 21, services: {
        "40 Mins": 55.0, "60 Mins": 76.0, "90 Mins": 100.0, "LED Light Add-on": 10.0
    }},
    "Massages": { tax_rate: 21, services: {
        "Head (30 mins)": 30.0, "Neck & Hands (30 mins)": 30.0, "Back Massage (40 mins)": 40.0,
        "Leg (30 mins)": 40.0, "Full Body (60 mins)": 65.0
    }}
};

// Tax calculation functions
function calculateBasePrice(priceWithTax, taxRate) {
    const taxMultiplier = 1 + (taxRate / 100);
    return priceWithTax / taxMultiplier;
}

function calculateTaxAmount(priceWithTax, taxRate) {
    const basePrice = calculateBasePrice(priceWithTax, taxRate);
    return priceWithTax - basePrice;
}

// State management
let invoiceState = {
    services: [],
    nextInvoiceNumber: localStorage.getItem('nextInvoiceNumber') || '001'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setInvoiceDateToday();
    renderServiceForm();
    setupEventListeners();
    loadRecords();
    
    // Load invoice data from booking if passed
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'booking') {
        const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
        if (bookingData.customer) {
            document.getElementById('custName').value = bookingData.customer.name || '';
            document.getElementById('custPhone').value = bookingData.customer.phone || '';
            document.getElementById('custEmail').value = bookingData.customer.email || '';
            
            // Add services from booking
            if (bookingData.services) {
                bookingData.services.forEach((svc, idx) => {
                    if (idx > 0) addServiceRow();
                    populateServiceRow(idx, svc);
                });
            }
        }
    }
});

function setInvoiceDateToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
}

function setupEventListeners() {
    document.getElementById('addServiceBtn').addEventListener('click', addServiceRow);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
    document.getElementById('printBtn').addEventListener('click', printInvoice);
    document.getElementById('saveInvoiceBtn').addEventListener('click', saveAndNew);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllRecords);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab + '-tab').classList.add('active');
        });
    });
    
    // Auto-update preview
    document.addEventListener('change', updatePreview);
    document.addEventListener('input', updatePreview);
}

function renderServiceForm() {
    const container = document.getElementById('servicesContainer');
    container.innerHTML = '';
    
    let html = '<table class="services-table"><thead><tr>' +
        '<th>Category</th><th>Service</th><th>Variant</th><th>Price (with tax)</th>' +
        '<th>Base Price</th><th>Tax Rate</th><th>Tax Amount</th><th>Qty</th><th></th></tr></thead><tbody>';
    
    invoiceState.services.forEach((svc, idx) => {
        const priceInfo = getPriceInfo(svc);
        html += `<tr class="service-row" id="service-${idx}">
            <td><select class="svc-category" data-idx="${idx}">
                <option value="">Select...</option>`;
        
        Object.keys(RATE_CARD).forEach(cat => {
            html += `<option value="${cat}" ${svc.category === cat ? 'selected' : ''}>${cat}</option>`;
        });
        
        html += `</select></td>
            <td><select class="svc-name" data-idx="${idx}">
                <option value="">Select...</option>`;
        
        if (svc.category && RATE_CARD[svc.category]) {
            Object.keys(RATE_CARD[svc.category].services).forEach(svcName => {
                html += `<option value="${svcName}" ${svc.name === svcName ? 'selected' : ''}>${svcName}</option>`;
            });
        }
        
        html += `</select></td>
            <td><input type="text" class="svc-variant" data-idx="${idx}" value="${svc.variant || ''}" placeholder="e.g. Basic, Advanced"></td>
            <td>€${priceInfo.priceWithTax.toFixed(2)}</td>
            <td>€${priceInfo.basePrice.toFixed(2)}</td>
            <td>${priceInfo.taxRate}%</td>
            <td>€${priceInfo.taxAmount.toFixed(2)}</td>
            <td><input type="number" class="svc-qty" data-idx="${idx}" value="${svc.qty || 1}" min="1" max="10"></td>
            <td><button class="btn-remove" onclick="removeService(${idx})">✕</button></td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.svc-category').forEach(el => {
        el.addEventListener('change', function() {
            updateServiceOptions(this.dataset.idx);
        });
    });
    
    document.querySelectorAll('.svc-name, .svc-variant, .svc-qty').forEach(el => {
        el.addEventListener('change', function() {
            updateServiceState(this.dataset.idx, this.className);
        });
    });
    
    // Add initial service row if empty
    if (invoiceState.services.length === 0) {
        addServiceRow();
    }
}

function addServiceRow() {
    invoiceState.services.push({ category: '', name: '', variant: '', qty: 1 });
    renderServiceForm();
}

function removeService(idx) {
    invoiceState.services.splice(idx, 1);
    renderServiceForm();
    updatePreview();
}

function updateServiceOptions(idx) {
    const category = document.querySelector(`.svc-category[data-idx="${idx}"]`).value;
    const nameSelect = document.querySelector(`.svc-name[data-idx="${idx}"]`);
    
    invoiceState.services[idx].category = category;
    nameSelect.innerHTML = '<option value="">Select...</option>';
    
    if (category && RATE_CARD[category]) {
        Object.keys(RATE_CARD[category].services).forEach(svcName => {
            const option = document.createElement('option');
            option.value = svcName;
            option.textContent = svcName;
            nameSelect.appendChild(option);
        });
    }
    
    updatePreview();
}

function updateServiceState(idx, fieldClass) {
    const category = document.querySelector(`.svc-category[data-idx="${idx}"]`).value;
    const name = document.querySelector(`.svc-name[data-idx="${idx}"]`).value;
    const variant = document.querySelector(`.svc-variant[data-idx="${idx}"]`).value;
    const qty = parseInt(document.querySelector(`.svc-qty[data-idx="${idx}"]`).value) || 1;
    
    invoiceState.services[idx] = { category, name, variant, qty };
    updatePreview();
}

function getPriceInfo(svc) {
    if (!svc.category || !svc.name) {
        return { priceWithTax: 0, basePrice: 0, taxAmount: 0, taxRate: 0 };
    }
    
    const categoryData = RATE_CARD[svc.category];
    if (!categoryData) return { priceWithTax: 0, basePrice: 0, taxAmount: 0, taxRate: 0 };
    
    let priceWithTax = 0;
    const serviceData = categoryData.services[svc.name];
    
    if (Array.isArray(serviceData)) {
        // Multi-variant pricing
        const variants = ['Basic', 'Advanced', 'Premium'];
        const idx = variants.indexOf(svc.variant);
        priceWithTax = idx >= 0 ? serviceData[idx] : serviceData[0];
    } else {
        priceWithTax = serviceData || 0;
    }
    
    const taxRate = categoryData.tax_rate;
    const basePrice = calculateBasePrice(priceWithTax, taxRate);
    const taxAmount = calculateTaxAmount(priceWithTax, taxRate);
    
    return { priceWithTax, basePrice, taxAmount, taxRate };
}

function updatePreview() {
    const custName = document.getElementById('custName').value || '[Customer Name]';
    const custPhone = document.getElementById('custPhone').value || '[Phone]';
    const custEmail = document.getElementById('custEmail').value || '[Email]';
    const invDate = document.getElementById('invoiceDate').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('notes').value;
    
    const invNumber = `INV-${new Date().getFullYear()}-${invoiceState.nextInvoiceNumber.padStart(3, '0')}`;
    
    let totalBase = 0, totalTax9 = 0, totalTax21 = 0, grandTotal = 0;
    let servicesHtml = '';
    
    invoiceState.services.forEach(svc => {
        if (!svc.name) return;
        
        const priceInfo = getPriceInfo(svc);
        const lineTotal = priceInfo.priceWithTax * svc.qty;
        const lineBase = priceInfo.basePrice * svc.qty;
        const lineTax = priceInfo.taxAmount * svc.qty;
        
        if (priceInfo.taxRate === 9) {
            totalTax9 += lineTax;
        } else {
            totalTax21 += lineTax;
        }
        
        totalBase += lineBase;
        grandTotal += lineTotal;
        
        const displayName = svc.variant ? `${svc.name} (${svc.variant})` : svc.name;
        servicesHtml += `<tr>
            <td class="desc-col">${displayName}</td>
            <td class="align-right">€${priceInfo.basePrice.toFixed(2)}</td>
            <td class="align-right">${svc.qty}</td>
            <td class="align-right">${priceInfo.taxRate}%</td>
            <td class="align-right">-</td>
            <td class="align-right">€${lineTotal.toFixed(2)}</td>
        </tr>`;
    });
    
    // Calculate discount
    const discountType = document.getElementById('discountType').value;
    const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
    let discountAmount = 0;
    
    if (discountType === 'amount' && discountValue > 0) {
        discountAmount = discountValue;
    } else if (discountType === 'percentage' && discountValue > 0) {
        discountAmount = (grandTotal * discountValue) / 100;
    }
    
    // Apply discount to grand total
    const finalTotal = grandTotal - discountAmount;
    
    const preview = `
        <div class="invoice-document">
            <!-- Header Section -->
            <div class="invoice-header-row">
                <div class="logo-section">
                    <img src="logo.png" alt="Glow Bliss Logo" class="logo-image">
                </div>
                <div class="title-section">
                    <h1 class="invoice-title">Tax Invoice</h1>
                </div>
            </div>
            
            <!-- Invoice Details -->
            <div class="invoice-dates">
                <div class="date-item">
                    <span class="label">Invoice no.</span>
                    <span class="value">${invNumber}</span>
                </div>
                <div class="date-item">
                    <span class="label">Invoice date:</span>
                    <span class="value">${invDate}</span>
                </div>
                <div class="date-item">
                    <span class="label">Due:</span>
                    <span class="value">${invDate}</span>
                </div>
            </div>
            
            <!-- From and Bill To Section (Two Column Layout) -->
            <div class="from-to-section">
                <div class="from-section">
                    <h3>From</h3>
                    <p class="strong">${BUSINESS.name}</p>
                    <p>${BUSINESS.address}</p>
                    <p>${BUSINESS.city}</p>
                    <p>📧 ${BUSINESS.email}</p>
                    <p>📞 ${BUSINESS.phone}</p>
                    <p>🌐 ${BUSINESS.website}</p>
                </div>
                
                <div class="bill-to-section">
                    <h3>Bill to</h3>
                    <p class="strong">[${custName}]</p>
                    <p>[${custEmail}]</p>
                    <p>[${custPhone}]</p>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="invoice-items">
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th class="align-right">RATE, €</th>
                        <th class="align-right">QTY</th>
                        <th class="align-right">TAX, %</th>
                        <th class="align-right">DISC, %</th>
                        <th class="align-right">AMOUNT, €</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicesHtml || '<tr><td colspan="6" style="text-align:center;padding:1rem;color:#999">No services selected</td></tr>'}
                </tbody>
            </table>
            
            <!-- Payment and Totals Section -->
            <div class="payment-totals-section">
                <div class="payment-section">
                    <h3>Payment instruction</h3>
                    <p>${paymentMethod ? `Payment Method: <strong>${paymentMethod}</strong>` : 'ADD INFORMATION ABOUT YOUR PAYMENT METHOD'}</p>
                </div>
                
                <div class="totals-section">
                    <div class="total-row">
                        <span>Subtotal, €:</span>
                        <span>€${totalBase.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Discount, €:</span>
                        <span>€${discountAmount.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (9%), €:</span>
                        <span>€${totalTax9.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (21%), €:</span>
                        <span>€${totalTax21.toFixed(2)}</span>
                    </div>
                    <div class="total-row final">
                        <span>Total, €:</span>
                        <span>€${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Notes -->
            ${notes ? `<div class="notes-section">
                <h3>Notes:</h3>
                <p>${notes}</p>
            </div>` : ''}
            
            <!-- Signatures -->
            <div class="signatures-section">
                <div class="signature-line">
                    <p>Client signature</p>
                    <p class="signature-name">[${custName}]</p>
                </div>
                <div class="signature-line">
                    <p>Business signature</p>
                    <p class="signature-name">[OWNER NAME]</p>
                </div>
            </div>
            
            <p class="invoice-footer">www.glowbliss-beautyparlour.nl</p>
        </div>
    `;
    
    document.getElementById('invoicePreview').innerHTML = preview;
}

function downloadPDF() {
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    
    if (!custName || !custPhone) {
        alert('Please fill in customer name and phone number');
        return;
    }
    
    const element = document.getElementById('invoicePreview');
    if (!element || !element.innerHTML) {
        alert('Invoice preview is empty. Please add services first.');
        return;
    }
    
    try {
        if (typeof html2canvas === 'undefined') {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }
        
        // Show loading message
        const originalBtnText = document.getElementById('downloadPdfBtn').textContent;
        document.getElementById('downloadPdfBtn').textContent = '⏳ Generating PDF...';
        document.getElementById('downloadPdfBtn').disabled = true;
        
        // Convert invoice to canvas
        html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            try {
                // Get canvas dimensions
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const imgWidth = 210; // A4 width in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Create PDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                // Calculate scaling to fit on one page
                const pageHeight = pdf.internal.pageSize.getHeight();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const margin = 10;
                const availableHeight = pageHeight - (margin * 2);
                const availableWidth = pageWidth - (margin * 2);
                
                let finalHeight = imgHeight;
                let finalWidth = imgWidth;
                
                if (finalHeight > availableHeight) {
                    finalHeight = availableHeight;
                    finalWidth = (canvas.width * finalHeight) / canvas.height;
                }
                
                if (finalWidth > availableWidth) {
                    finalWidth = availableWidth;
                    finalHeight = (canvas.height * finalWidth) / canvas.width;
                }
                
                // Center the image on the page
                const x = (pageWidth - finalWidth) / 2;
                const y = margin;
                
                pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
                
                // Save the PDF
                const filename = `invoice-${custName}-${new Date().toISOString().split('T')[0]}.pdf`;
                pdf.save(filename);
                
                // Restore button
                document.getElementById('downloadPdfBtn').textContent = originalBtnText;
                document.getElementById('downloadPdfBtn').disabled = false;
                
            } catch (error) {
                console.error('PDF creation error:', error);
                alert('Error creating PDF: ' + error.message);
                document.getElementById('downloadPdfBtn').textContent = originalBtnText;
                document.getElementById('downloadPdfBtn').disabled = false;
            }
        }).catch(error => {
            console.error('Canvas conversion error:', error);
            alert('Error converting invoice to image: ' + error.message);
            document.getElementById('downloadPdfBtn').textContent = originalBtnText;
            document.getElementById('downloadPdfBtn').disabled = false;
        });
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + error.message);
    }
}

function printInvoice() {
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    
    // Validate customer details
    if (!custName || !custPhone) {
        alert('Please fill in customer name and phone number');
        return;
    }
    
    // Validate that services are selected
    if (!invoiceState.services || invoiceState.services.length === 0) {
        alert('Please add at least one service before printing');
        return;
    }
    
    // Validate invoice preview exists
    const invoicePreview = document.getElementById('invoicePreview');
    if (!invoicePreview || !invoicePreview.innerHTML) {
        alert('Invoice preview is empty. Please add services first.');
        return;
    }
    
    try {
        // Wait a moment for any pending renders, then print
        setTimeout(() => {
            window.print();
        }, 500);
    } catch (error) {
        console.error('Print error:', error);
        alert('Error opening print dialog: ' + error.message);
    }
}

function saveAndNew() {
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    
    if (!custName || !custPhone) {
        alert('Please fill in customer name and phone number');
        return;
    }
    
    // Save invoice record
    const invData = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${invoiceState.nextInvoiceNumber.padStart(3, '0')}`,
        date: document.getElementById('invoiceDate').value,
        customer: custName,
        phone: custPhone,
        email: document.getElementById('custEmail').value,
        services: invoiceState.services.map(s => ({
            ...s,
            price: getPriceInfo(s).priceWithTax
        })),
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('notes').value,
        savedAt: new Date().toISOString()
    };
    
    // Calculate totals
    let total = 0;
    invData.services.forEach(s => {
        if (s.name) {
            total += getPriceInfo(s).priceWithTax * s.qty;
        }
    });
    invData.total = total;
    
    // Save to localStorage
    let records = JSON.parse(localStorage.getItem('invoiceRecords') || '[]');
    records.push(invData);
    localStorage.setItem('invoiceRecords', JSON.stringify(records));
    
    // Update invoice counter
    const nextNum = parseInt(invoiceState.nextInvoiceNumber) + 1;
    invoiceState.nextInvoiceNumber = nextNum.toString();
    localStorage.setItem('nextInvoiceNumber', invoiceState.nextInvoiceNumber);
    
    alert('Invoice saved successfully!');
    
    // Reset form
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custEmail').value = '';
    document.getElementById('paymentMethod').value = '';
    document.getElementById('notes').value = '';
    invoiceState.services = [];
    renderServiceForm();
    updatePreview();
    setInvoiceDateToday();
    
    // Reload records
    loadRecords();
}

function loadRecords() {
    const records = JSON.parse(localStorage.getItem('invoiceRecords') || '[]');
    const container = document.getElementById('recordsTable');
    const noRecords = document.getElementById('noRecords');
    
    if (records.length === 0) {
        container.innerHTML = '';
        noRecords.style.display = 'block';
        return;
    }
    
    noRecords.style.display = 'none';
    
    let html = `<table class="records-table-content"><thead><tr>
        <th>Invoice #</th><th>Date</th><th>Customer</th><th>Phone</th><th>Services</th><th>Total</th><th>Actions</th>
    </tr></thead><tbody>`;
    
    records.reverse().forEach((inv, idx) => {
        const serviceCount = inv.services.filter(s => s.name).length;
        html += `<tr>
            <td>${inv.invoiceNumber}</td>
            <td>${inv.date}</td>
            <td>${inv.customer}</td>
            <td>${inv.phone}</td>
            <td>${serviceCount}</td>
            <td>€${inv.total.toFixed(2)}</td>
            <td>
                <button class="btn-small" onclick="regenerateInvoice(${idx})">View/Edit</button>
                <button class="btn-small" onclick="deleteInvoice(${idx})" style="background:#e74c3c">Delete</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function deleteInvoice(idx) {
    if (!confirm('Delete this invoice?')) return;
    
    let records = JSON.parse(localStorage.getItem('invoiceRecords') || '[]');
    records.reverse();
    records.splice(idx, 1);
    records.reverse();
    localStorage.setItem('invoiceRecords', JSON.stringify(records));
    loadRecords();
}

function exportCSV() {
    const records = JSON.parse(localStorage.getItem('invoiceRecords') || '[]');
    
    let csv = 'Invoice #,Date,Customer,Phone,Email,Payment Method,Services,Base Total,Tax Total,Grand Total\n';
    
    records.forEach(inv => {
        let serviceName = inv.services.filter(s => s.name).map(s => s.name).join('; ');
        let baseTotal = 0, taxTotal = 0;
        
        inv.services.forEach(s => {
            const info = getPriceInfo(s);
            baseTotal += info.basePrice * s.qty;
            taxTotal += info.taxAmount * s.qty;
        });
        
        csv += `"${inv.invoiceNumber}","${inv.date}","${inv.customer}","${inv.phone}","${inv.email}","${inv.paymentMethod}","${serviceName}",${baseTotal.toFixed(2)},${taxTotal.toFixed(2)},${inv.total.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function clearAllRecords() {
    if (!confirm('This will delete ALL invoices permanently. Are you sure?')) return;
    localStorage.removeItem('invoiceRecords');
    loadRecords();
    alert('All records cleared');
}

function regenerateInvoice(idx) {
    let records = JSON.parse(localStorage.getItem('invoiceRecords') || '[]');
    records.reverse();
    const inv = records[idx];
    records.reverse();
    
    document.getElementById('custName').value = inv.customer;
    document.getElementById('custPhone').value = inv.phone;
    document.getElementById('custEmail').value = inv.email;
    document.getElementById('invoiceDate').value = inv.date;
    document.getElementById('paymentMethod').value = inv.paymentMethod;
    document.getElementById('notes').value = inv.notes;
    
    invoiceState.services = inv.services;
    renderServiceForm();
    updatePreview();
    
    // Switch to create tab
    document.querySelector('[data-tab="create"]').click();
    window.scrollTo(0, 0);
}

function populateServiceRow(idx, svc) {
    invoiceState.services[idx] = svc;
}
