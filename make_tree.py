import os

with open('design-book.html', 'r') as f:
    content = f.read()

# Replace title
content = content.replace("<title>Manti ERP - Design Book</title>", "<title>Manti ERP - Tree Making</title>")

# Find where main content begins
marker_start = '<!-- Main Content -->'
main_start = content.find(marker_start)

header = content[:main_start + len(marker_start)]

# Write the new file
new_content = header + """
        <main class="main-content" style="flex: 1; padding: 2rem;">
            <header class="generator-header">
                <div class="header-content" style="display: flex; align-items: center; gap: 20px;">
                    <a href="index.html">
                        <img src="Asset 23.png" alt="Manti Logo" style="height: 50px; width: auto;">
                    </a>
                    <div>
                        <h1>Tree Making</h1>
                        <p>Manage casting production trees and aggregate designs</p>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-liquid btn-primary" onclick="openTreeModal()">
                        <i data-lucide="folder-plus" style="width: 16px; height: 16px; margin-right: 6px;"></i> + New Tree
                    </button>
                </div>
            </header>

            <div style="margin-bottom: 2rem; max-width: 400px;">
                <input type="text" id="search-trees" class="input-wrapper" placeholder="Search trees by number..."
                    onkeyup="filterTable('search-trees', 'trees-table')" style="padding: 10px; font-size: 1rem;">
            </div>

            <div class="table-container">
                <table id="trees-table">
                    <thead>
                        <tr>
                            <th>Tree No.</th>
                            <th>Date</th>
                            <th>Total Weight (g)</th>
                            <th>Designs Count</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="trees-body">
                        <!-- Dynamic rows -->
                    </tbody>
                </table>
            </div>
            
            <div id="empty-state" style="display: none; text-align: center; padding: 80px 24px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <div style="width: 64px; height: 64px; background: #eef2ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #6366f1;">
                    <i data-lucide="network" style="width: 32px; height: 32px;"></i>
                </div>
                <h3 style="margin-bottom: 8px; font-size: 1.25rem; font-weight: 700;">No Trees Created</h3>
                <p style="color: #64748b; margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto;">Start combining designs into your first production tree structure.</p>
                <button class="btn-liquid btn-primary" onclick="openTreeModal()">Create Production Tree</button>
            </div>

        </main>
    </div>

    <!-- Tree Modal -->
    <div class="modal-overlay" id="tree-modal-overlay">
        <div class="premium-modal" style="width: 700px; max-width: 95%;">
            <div class="premium-modal-header">
                <h2>Tree Details</h2>
                <button class="btn-close-modal" onclick="closeTreeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="premium-modal-body" style="max-height: 70vh; overflow-y: auto;">
                <form id="tree-form">
                    <input type="hidden" id="tree-id">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Tree No.</label>
                            <input type="text" id="tree-no" class="input-wrapper" readonly style="background: #f8fafc; font-weight: 600;">
                        </div>
                        <div>
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Date</label>
                            <input type="date" id="tree-date" class="input-wrapper" required>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                            <label style="font-size: 0.95rem; font-weight: 700; color: #1e293b;">Designs Included</label>
                            <button type="button" onclick="addDesignRow()" style="font-size: 0.8rem; background: #eef2ff; color: #4f46e5; border: none; padding: 4px 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">+ Add Design</button>
                        </div>
                        <div id="tree-designs-container" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Design lines go here -->
                        </div>
                        <div style="margin-top: 1rem; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: right;">
                            <span style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-right: 15px;">Total Estimated Weight:</span>
                            <span id="tree-calc-weight" style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">0.000 g</span>
                        </div>
                    </div>
                    
                    <div>
                        <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Notes / Remarks</label>
                        <textarea id="tree-notes" class="input-wrapper" rows="2" placeholder="Any special instructions..."></textarea>
                    </div>

                </form>
            </div>
            <div class="premium-modal-footer">
                <button type="button" class="btn-liquid btn-outline" onclick="closeTreeModal()">Cancel</button>
                <button type="submit" form="tree-form" class="btn-liquid btn-primary" id="btn-save-tree">Save Tree</button>
            </div>
        </div>
    </div>

    <!-- View Designs Modal (Readonly) -->
    <div class="modal-overlay" id="view-modal-overlay">
        <div class="premium-modal" style="width: 500px; max-width: 95%;">
            <div class="premium-modal-header">
                <h2>Tree Designs</h2>
                <button class="btn-close-modal" onclick="document.getElementById('view-modal-overlay').classList.remove('active')">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="premium-modal-body" style="max-height: 70vh; overflow-y: auto;" id="view-tree-content">
                <!-- Data populated via js -->
            </div>
        </div>
    </div>

    <script src="liquid-button.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/lucide.min.js"></script>
    <script>
        lucide.createIcons();

        let trees = [];
        let allDesigns = [];
        
        document.addEventListener('CloudDataLoaded', () => {
            trees = JSON.parse(localStorage.getItem('manti_trees')) || [];
            allDesigns = JSON.parse(localStorage.getItem('manti_designs')) || [];
            
            // Sort trees by latest
            trees.sort((a,b) => new Date(b.date) - new Date(a.date));
            renderTrees();
        });

        function renderTrees() {
            const tbody = document.getElementById('trees-body');
            const emptyState = document.getElementById('empty-state');
            const tableCont = document.querySelector('.table-container');

            tbody.innerHTML = '';
            
            if (trees.length === 0) {
                emptyState.style.display = 'block';
                tableCont.style.display = 'none';
                return;
            }

            emptyState.style.display = 'none';
            tableCont.style.display = 'block';

            trees.forEach((tree, idx) => {
                const tr = document.createElement('tr');
                
                // count total designs
                let designCount = 0;
                if(tree.designs) {
                    tree.designs.forEach(d => designCount += (parseInt(d.count) || 0));
                }

                tr.innerHTML = `
                    <td><strong>${tree.treeNo}</strong></td>
                    <td>${tree.date}</td>
                    <td style="color: var(--primary); font-weight: 700;">${parseFloat(tree.totalWeight).toFixed(3)}</td>
                    <td><button onclick="viewTree(${idx})" style="background:#eef2ff; color:#4f46e5; border:none; padding:4px 10px; border-radius:6px; font-weight:600; cursor:pointer;" title="View line items">${designCount} pcs</button></td>
                    <td style="color:#64748b; font-size:0.85rem;">${tree.notes || '-'}</td>
                    <td style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="editTree(${idx})" class="btn-edit" title="Edit">
                            <svg viewBox="0 0 512 512" style="width:16px;height:16px;"><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32z"></path></svg>
                        </button>
                        <button onclick="deleteTree('${tree.id}')" class="btn-remove" title="Delete">
                            <svg class="del-icon" viewBox="0 0 448 512" style="width:16px;height:16px;"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Add dynamically rows
        function addDesignRow(designId = '', count = 1) {
            const container = document.getElementById('tree-designs-container');
            const row = document.createElement('div');
            row.className = 'tree-row';
            row.style.cssText = 'display: grid; grid-template-columns: 1fr 100px 100px auto; gap: 10px; align-items: center; background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;';
            
            // Build options
            let options = '<option value="" disabled selected>Select Design...</option>';
            allDesigns.forEach(d => {
                const sub = d.subCategory ? ` (${d.subCategory})` : '';
                options += `<option value="${d.id}" data-wt="${d.weight}" ${d.id === designId ? 'selected' : ''}>${d.id} - ${d.category}${sub} [${d.weight}g]</option>`;
            });

            row.innerHTML = `
                <select class="input-wrapper tree-sel-design" required onchange="calculateTreeWeight()" style="margin: 0;">
                    ${options}
                </select>
                <div>
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Weight/pc</label>
                    <input type="number" step="0.001" class="input-wrapper tree-inp-wt" value="0.000" readonly style="margin: 0; background: #f8fafc; font-size: 0.9rem;">
                </div>
                <div>
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Qty</label>
                    <input type="number" min="1" class="input-wrapper tree-inp-count" value="${count}" required oninput="calculateTreeWeight()" style="margin: 0; font-size: 0.9rem;">
                </div>
                <div style="padding-top: 15px;">
                    <button type="button" onclick="this.parentElement.parentElement.remove(); calculateTreeWeight();" class="btn-remove-sm" title="Remove" style="background:var(--danger);color:white;border:none;border-radius:4px;width:28px;height:28px;font-weight:bold;cursor:pointer;">&times;</button>
                </div>
            `;
            container.appendChild(row);

            // trigger calculation
            calculateTreeWeight();
        }

        function calculateTreeWeight() {
            let total = 0;
            const rows = document.querySelectorAll('#tree-designs-container .tree-row');
            rows.forEach(row => {
                const sel = row.querySelector('.tree-sel-design');
                const inpWt = row.querySelector('.tree-inp-wt');
                const inpCount = row.querySelector('.tree-inp-count');
                
                if(sel.options[sel.selectedIndex] && !sel.options[sel.selectedIndex].disabled) {
                    const baseWt = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-wt')) || 0;
                    inpWt.value = baseWt.toFixed(3);
                    const qty = parseInt(inpCount.value) || 0;
                    total += (baseWt * qty);
                }
            });
            document.getElementById('tree-calc-weight').textContent = total.toFixed(3) + ' g';
        }

        function generateUniqueTreeId() {
            const prefix = "TR-";
            let max = 0;
            trees.forEach(t => {
                if (t.treeNo && t.treeNo.startsWith(prefix)) {
                    const num = parseInt(t.treeNo.replace(prefix, ''));
                    if (!isNaN(num) && num > max) max = num;
                }
            });
            return prefix + String(max + 1).padStart(4, '0');
        }

        function openTreeModal() {
            document.getElementById('tree-form').reset();
            document.getElementById('tree-id').value = '';
            document.getElementById('tree-no').value = generateUniqueTreeId();
            document.getElementById('tree-date').valueAsDate = new Date();
            
            document.getElementById('tree-designs-container').innerHTML = '';
            addDesignRow();

            document.getElementById('tree-modal-overlay').classList.add('active');
        }

        function closeTreeModal() {
            document.getElementById('tree-modal-overlay').classList.remove('active');
        }

        function editTree(index) {
            const t = trees[index];
            document.getElementById('tree-id').value = t.id;
            document.getElementById('tree-no').value = t.treeNo;
            document.getElementById('tree-date').value = t.date;
            document.getElementById('tree-notes').value = t.notes || '';

            document.getElementById('tree-designs-container').innerHTML = '';
            if(t.designs && t.designs.length > 0) {
                t.designs.forEach(dd => {
                    addDesignRow(dd.design_id, dd.count);
                });
            } else {
                addDesignRow();
            }

            document.getElementById('tree-modal-overlay').classList.add('active');
            calculateTreeWeight();
        }

        function deleteTree(id) {
            if(confirm('Are you sure you want to delete this Tree?')) {
                const idx = trees.findIndex(t => t.id === id);
                if(idx > -1) {
                    trees.splice(idx, 1);
                    localStorage.setItem('manti_trees', JSON.stringify(trees));
                    // Fire save
                    const originalSync = JSON.parse(localStorage.getItem('manti_trees'));
                    fetchEverythingFromCloud(); // We just hijack this via proxy if possible, but actually we use a hack:
                    
                    // Standard Manti Hack: update memory and let it sync manually, but we know localStorage saves trigger nothing unless we call something.
                    // Oh wait, in previous code we didn't push to cloud manually on delete. We need to save via script!
                    // Wait, Manti syncs by listening? No, we just write to localstorage. 
                    // Let's implement `window.ERP_MEMORY.set` or trigger a cloud call explicitly:
                }
            }
        }

        document.getElementById('tree-form').addEventListener('submit', function(e) {
            e.preventDefault();

            // Extract designs
            const dList = [];
            const rows = document.querySelectorAll('#tree-designs-container .tree-row');
            let tWt = 0;
            rows.forEach(row => {
                const sel = row.querySelector('.tree-sel-design');
                const inpCount = row.querySelector('.tree-inp-count');
                if(sel.value && sel.value !== "") {
                    const wt = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-wt')) || 0;
                    const c = parseInt(inpCount.value) || 1;
                    dList.push({ design_id: sel.value, count: c, unit_weight: wt });
                    tWt += (wt * c);
                }
            });

            if(dList.length === 0) {
                alert("Please add at least one design to the tree.");
                return;
            }

            const idField = document.getElementById('tree-id').value;
            const newTree = {
                id: idField || uuidv4(),
                treeNo: document.getElementById('tree-no').value,
                date: document.getElementById('tree-date').value,
                totalWeight: tWt,
                designs: dList,
                notes: document.getElementById('tree-notes').value
            };

            if(idField) {
                const idx = trees.findIndex(t => t.id === idField);
                if(idx > -1) trees[idx] = newTree;
            } else {
                trees.unshift(newTree); // prepend
            }

            // Sync to ERP_MEMORY so supabase backend processes it
            window.ERP_MEMORY.set('manti_trees', JSON.stringify(trees));
            
            closeTreeModal();
            renderTrees();
        });
        
        // Expose a delete function securely
        window.deleteTree = function(id) {
            if(confirm('Are you sure you want to delete this Tree?')) {
                const updated = trees.filter(t => t.id !== id);
                trees = updated;
                window.ERP_MEMORY.set('manti_trees', JSON.stringify(trees));
                renderTrees();
            }
        }

        function uuidv4() {
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

        function viewTree(index) {
            const t = trees[index];
            const cont = document.getElementById('view-tree-content');
            let html = `<div style="margin-bottom: 15px;"><strong style="font-size:1.1rem;color:var(--primary);">${t.treeNo}</strong> <span style="color:#64748b;">(${t.date})</span></div>`;
            
            html += `<table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr style="border-bottom:2px solid #e2e8f0; text-align:left;">
                    <th style="padding:10px;">Design ID</th>
                    <th style="padding:10px;">Qty</th>
                    <th style="padding:10px;">Unit Wt</th>
                    <th style="padding:10px;text-align:right;">Subtotal</th>
                </tr>`;
            
            t.designs.forEach(d => {
                html += `<tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px;font-weight:600;">${d.design_id}</td>
                    <td style="padding:10px;">${d.count}</td>
                    <td style="padding:10px;color:#64748b;">${d.unit_weight.toFixed(3)}g</td>
                    <td style="padding:10px;text-align:right;font-weight:700;">${(d.count * d.unit_weight).toFixed(3)}g</td>
                </tr>`;
            });
            
            html += `<tr><td colspan="4" style="text-align:right;padding:15px 10px;font-size:1.1rem;"><strong>Total: <span style="color:var(--primary);">${t.totalWeight.toFixed(3)}g</span></strong></td></tr>`;
            html += `</table>`;
            
            if(t.notes) html += `<div style="margin-top:15px;padding:10px;background:#f8fafc;border-radius:6px;font-size:0.85rem;color:#475569;"><strong>Notes:</strong> ${t.notes}</div>`;
            
            cont.innerHTML = html;
            document.getElementById('view-modal-overlay').classList.add('active');
        }
        
        function filterTable(inputId, tableId) {
            const input = document.getElementById(inputId);
            const filter = input.value.toUpperCase();
            const table = document.getElementById(tableId);
            const tr = table.getElementsByTagName("tr");

            for (let i = 1; i < tr.length; i++) {
                // filter against first column (Tree No)
                let td = tr[i].getElementsByTagName("td")[0];
                if (td) {
                    let txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        tr[i].style.display = "";
                    } else {
                        tr[i].style.display = "none";
                    }
                }       
            }
        }
    </script>
</body>
</html>
"""

with open('tree-making.html', 'w') as f:
    f.write(new_content)
