// ============================================
// GA DASHBOARD JAVASCRIPT
// ============================================

let allTickets = [];
let currentTicket = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAllTickets();
    loadHubsForFilter();
});

// Load all tickets
async function loadAllTickets() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}?action=getAllTickets`);
        const data = await response.json();
        
        if (data.success && data.tickets) {
            allTickets = data.tickets;
            updateDashboard();
            displayPendingTickets();
            displayProgressTickets();
            displayCompletedTickets();
            displayAllTickets();
        } else {
            console.error('Failed to load tickets');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

// Update dashboard stats
function updateDashboard() {
    const pending = allTickets.filter(t => t.statusPekerjaan === 'Menunggu Approval').length;
    const progress = allTickets.filter(t => t.statusPekerjaan === 'On Progress' || t.statusPekerjaan === 'Dijadwalkan').length;
    const completed = allTickets.filter(t => t.statusPekerjaan === 'Selesai').length;
    const urgent = allTickets.filter(t => t.urgensiPemohon === 'Urgent' && t.statusPekerjaan !== 'Selesai').length;
    
    document.getElementById('totalPending').textContent = pending;
    document.getElementById('totalProgress').textContent = progress;
    document.getElementById('totalCompleted').textContent = completed;
    document.getElementById('totalUrgent').textContent = urgent;
}

// Display all tickets with filter
function displayAllTickets() {
    const container = document.getElementById('allTicketsContainer');
    const filterHub = document.getElementById('filterHub').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    let filtered = allTickets;
    
    if (filterHub) {
        filtered = filtered.filter(t => t.hub === filterHub);
    }
    
    if (filterStatus) {
        filtered = filtered.filter(t => t.statusPekerjaan === filterStatus);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tidak ada ticket</p>';
        return;
    }
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Tanggal</th>
                    <th>HUB</th>
                    <th>Outlet</th>
                    <th>Kategori</th>
                    <th>Urgensi</th>
                    <th>Status</th>
                    <th>PIC</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filtered.forEach(ticket => {
        const urgencyClass = ticket.urgensiPemohon === 'Urgent' ? 'badge-urgent' : 
                            ticket.urgensiPemohon === 'Tidak Urgent' ? 'badge-normal' : 'badge-low';
        const statusClass = ticket.statusPekerjaan === 'Selesai' ? 'badge-done' :
                          ticket.statusPekerjaan === 'On Progress' ? 'badge-progress' :
                          ticket.statusPekerjaan === 'Ditolak' ? 'badge-rejected' : 'badge-pending';
        
        html += `
            <tr>
                <td><strong>${ticket.ticketId}</strong></td>
                <td>${formatDate(ticket.timestamp)}</td>
                <td>${ticket.hub}</td>
                <td>${ticket.outlet}</td>
                <td>${ticket.kategori}</td>
                <td><span class="badge ${urgencyClass}">${ticket.urgensiPemohon}</span></td>
                <td><span class="badge ${statusClass}">${ticket.statusPekerjaan}</span></td>
                <td>${ticket.picTeknisi || '-'}</td>
                <td>
                    ${getActionButton(ticket)}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Get action button based on ticket status
function getActionButton(ticket) {
    if (ticket.statusPekerjaan === 'Menunggu Approval') {
        return `<button class="btn btn-primary" onclick='showApproveModal(${JSON.stringify(JSON.stringify(ticket))})'>Approve</button>`;
    } else if (ticket.statusPekerjaan === 'On Progress' || ticket.statusPekerjaan === 'Dijadwalkan') {
        return `<button class="btn btn-success" onclick='showUpdateModal(${JSON.stringify(JSON.stringify(ticket))})'>Update</button>`;
    } else {
        return `<button class="btn btn-primary" onclick='showTicketDetail(${JSON.stringify(JSON.stringify(ticket))})'>Detail</button>`;
    }
}

// Display pending tickets
function displayPendingTickets() {
    const container = document.getElementById('pendingContainer');
    const pending = allTickets.filter(t => t.statusPekerjaan === 'Menunggu Approval');
    
    if (pending.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tidak ada ticket pending</p>';
        return;
    }
    
    let html = '';
    pending.forEach(ticket => {
        html += createTicketCard(ticket, 'pending');
    });
    
    container.innerHTML = html;
}

// Display progress tickets
function displayProgressTickets() {
    const container = document.getElementById('progressContainer');
    const progress = allTickets.filter(t => t.statusPekerjaan === 'On Progress' || t.statusPekerjaan === 'Dijadwalkan');
    
    if (progress.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tidak ada ticket on progress</p>';
        return;
    }
    
    let html = '';
    progress.forEach(ticket => {
        html += createTicketCard(ticket, 'progress');
    });
    
    container.innerHTML = html;
}

// Display completed tickets
function displayCompletedTickets() {
    const container = document.getElementById('completedContainer');
    const completed = allTickets.filter(t => t.statusPekerjaan === 'Selesai');
    
    if (completed.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tidak ada ticket completed</p>';
        return;
    }
    
    let html = '';
    completed.forEach(ticket => {
        html += createTicketCard(ticket, 'completed');
    });
    
    container.innerHTML = html;
}

// Create ticket card
function createTicketCard(ticket, type) {
    const urgencyClass = ticket.urgensiPemohon === 'Urgent' ? 'badge-urgent' : 
                        ticket.urgensiPemohon === 'Tidak Urgent' ? 'badge-normal' : 'badge-low';
    
    let actions = '';
    if (type === 'pending') {
        actions = `
            <button class="btn btn-primary" onclick='showApproveModal(${JSON.stringify(JSON.stringify(ticket))})'>✅ Approve</button>
            <button class="btn btn-warning" onclick='rejectTicket(${JSON.stringify(JSON.stringify(ticket))})' style="margin-left: 10px;">❌ Reject</button>
        `;
    } else if (type === 'progress') {
        actions = `
            <button class="btn btn-success" onclick='showUpdateModal(${JSON.stringify(JSON.stringify(ticket))})'>🔄 Update Status</button>
        `;
    }
    
    return `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0; color: #667eea;">${ticket.ticketId}</h3>
                    <p style="margin: 5px 0; color: #666;">
                        <strong>${ticket.outlet}</strong> (${ticket.hub}) • ${formatDate(ticket.timestamp)}
                    </p>
                </div>
                <span class="badge ${urgencyClass}">${ticket.urgensiPemohon}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Kategori:</strong> ${ticket.kategori}</p>
                <p style="margin: 5px 0;"><strong>Deskripsi:</strong> ${ticket.deskripsi}</p>
                ${ticket.linkFoto ? `<p style="margin: 5px 0;"><strong>Foto:</strong> <a href="${ticket.linkFoto}" target="_blank">Lihat Foto</a></p>` : ''}
                ${ticket.picTeknisi ? `<p style="margin: 5px 0;"><strong>PIC:</strong> ${ticket.picTeknisi}</p>` : ''}
                ${ticket.prioritas ? `<p style="margin: 5px 0;"><strong>Prioritas:</strong> ${ticket.prioritas}</p>` : ''}
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
                ${actions}
            </div>
        </div>
    `;
}

// Show approve modal
function showApproveModal(ticketJson) {
    currentTicket = JSON.parse(ticketJson);
    const modal = document.getElementById('approveModal');
    const content = document.getElementById('approveContent');
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <p><strong>Ticket ID:</strong> ${currentTicket.ticketId}</p>
            <p><strong>Outlet:</strong> ${currentTicket.outlet}</p>
            <p><strong>Kategori:</strong> ${currentTicket.kategori}</p>
            <p><strong>Deskripsi:</strong> ${currentTicket.deskripsi}</p>
            
            <form id="approveForm" style="margin-top: 20px;">
                <div class="form-group">
                    <label>Prioritas *</label>
                    <select id="prioritas" class="form-control" required>
                        <option value="">-- Pilih Prioritas --</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>PIC Teknisi *</label>
                    <input type="text" id="picTeknisi" class="form-control" required placeholder="Nama Teknisi">
                </div>
                
                <div class="form-group">
                    <label>Tanggal Dijadwalkan *</label>
                    <input type="date" id="tanggalDijadwalkan" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>Estimasi Selesai *</label>
                    <input type="date" id="estimasiSelesai" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>Nama Petugas GA *</label>
                    <input type="text" id="petugasGA" class="form-control" required placeholder="Nama Anda">
                </div>
                
                <div class="form-group">
                    <label>Catatan GA (Opsional)</label>
                    <textarea id="catatanGA" class="form-control" rows="3" placeholder="Catatan tambahan..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" id="approveBtn">✅ Approve Ticket</button>
            </form>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('approveForm').onsubmit = handleApprove;
}

// Handle approve
async function handleApprove(e) {
    e.preventDefault();
    
    const approveBtn = document.getElementById('approveBtn');
    approveBtn.disabled = true;
    approveBtn.textContent = '⏳ Processing...';
    
    const updateData = {
        ticketId: currentTicket.ticketId,
        statusApproval: 'Disetujui',
        prioritas: document.getElementById('prioritas').value,
        picTeknisi: document.getElementById('picTeknisi').value,
        tanggalDijadwalkan: document.getElementById('tanggalDijadwalkan').value,
        estimasiSelesai: document.getElementById('estimasiSelesai').value,
        statusPekerjaan: 'Dijadwalkan',
        petugasGA: document.getElementById('petugasGA').value,
        catatanGA: document.getElementById('catatanGA').value
    };
    
    try {
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateTicket',
                data: updateData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Ticket berhasil diapprove!');
            closeModal('approveModal');
            loadAllTickets();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        approveBtn.disabled = false;
        approveBtn.textContent = '✅ Approve Ticket';
    }
}

// Reject ticket
async function rejectTicket(ticketJson) {
    const ticket = JSON.parse(ticketJson);
    const alasan = prompt('Alasan penolakan:');
    
    if (!alasan) return;
    
    const updateData = {
        ticketId: ticket.ticketId,
        statusApproval: 'Ditolak',
        statusPekerjaan: 'Ditolak',
        catatanGA: 'DITOLAK: ' + alasan,
        petugasGA: prompt('Nama Petugas GA:') || 'GA'
    };
    
    try {
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateTicket',
                data: updateData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Ticket berhasil ditolak');
            loadAllTickets();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Show update modal
function showUpdateModal(ticketJson) {
    currentTicket = JSON.parse(ticketJson);
    const modal = document.getElementById('updateModal');
    const content = document.getElementById('updateContent');
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <p><strong>Ticket ID:</strong> ${currentTicket.ticketId}</p>
            <p><strong>Outlet:</strong> ${currentTicket.outlet}</p>
            <p><strong>PIC:</strong> ${currentTicket.picTeknisi}</p>
            
            <form id="updateForm" style="margin-top: 20px;">
                <div class="form-group">
                    <label>Status Pekerjaan *</label>
                    <select id="statusPekerjaan" class="form-control" required>
                        <option value="Dijadwalkan" ${currentTicket.statusPekerjaan === 'Dijadwalkan' ? 'selected' : ''}>Dijadwalkan</option>
                        <option value="On Progress" ${currentTicket.statusPekerjaan === 'On Progress' ? 'selected' : ''}>On Progress</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Tanggal Mulai</label>
                    <input type="date" id="tanggalMulai" class="form-control" value="${currentTicket.tanggalMulai || ''}">
                </div>
                
                <div class="form-group">
                    <label>Tanggal Selesai</label>
                    <input type="date" id="tanggalSelesai" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Link Foto Hasil</label>
                    <input type="url" id="linkFotoSelesai" class="form-control" placeholder="https://drive.google.com/...">
                </div>
                
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="catatanUpdate" class="form-control" rows="3">${currentTicket.catatanGA || ''}</textarea>
                </div>
                
                <button type="submit" class="btn btn-success btn-block" id="updateBtn">🔄 Update Status</button>
            </form>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('updateForm').onsubmit = handleUpdate;
}

// Handle update
async function handleUpdate(e) {
    e.preventDefault();
    
    const updateBtn = document.getElementById('updateBtn');
    updateBtn.disabled = true;
    updateBtn.textContent = '⏳ Processing...';
    
    const updateData = {
        ticketId: currentTicket.ticketId,
        statusPekerjaan: document.getElementById('statusPekerjaan').value,
        tanggalMulai: document.getElementById('tanggalMulai').value,
        tanggalSelesai: document.getElementById('tanggalSelesai').value,
        linkFotoSelesai: document.getElementById('linkFotoSelesai').value,
        catatanGA: document.getElementById('catatanUpdate').value
    };
    
    try {
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateTicket',
                data: updateData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Status berhasil diupdate!');
            closeModal('updateModal');
            loadAllTickets();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = '🔄 Update Status';
    }
}

// Load hubs for filter
async function loadHubsForFilter() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}?action=getHubs`);
        const data = await response.json();
        
        if (data.success && data.hubs) {
            const select = document.getElementById('filterHub');
            data.hubs.forEach(hub => {
                const option = document.createElement('option');
                option.value = hub;
                option.textContent = hub;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading hubs:', error);
    }
}

// Search tickets
function searchTickets() {
    const search = document.getElementById('searchTicket').value.toLowerCase();
    
    if (!search) {
        displayAllTickets();
        return;
    }
    
    const filtered = allTickets.filter(t => 
        t.ticketId.toLowerCase().includes(search) ||
        t.outlet.toLowerCase().includes(search)
    );
    
    const container = document.getElementById('allTicketsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Ticket tidak ditemukan</p>';
        return;
    }
    
    // Display filtered results using same format as displayAllTickets
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Tanggal</th>
                    <th>HUB</th>
                    <th>Outlet</th>
                    <th>Kategori</th>
                    <th>Urgensi</th>
                    <th>Status</th>
                    <th>PIC</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filtered.forEach(ticket => {
        const urgencyClass = ticket.urgensiPemohon === 'Urgent' ? 'badge-urgent' : 
                            ticket.urgensiPemohon === 'Tidak Urgent' ? 'badge-normal' : 'badge-low';
        const statusClass = ticket.statusPekerjaan === 'Selesai' ? 'badge-done' :
                          ticket.statusPekerjaan === 'On Progress' ? 'badge-progress' :
                          ticket.statusPekerjaan === 'Ditolak' ? 'badge-rejected' : 'badge-pending';
        
        html += `
            <tr>
                <td><strong>${ticket.ticketId}</strong></td>
                <td>${formatDate(ticket.timestamp)}</td>
                <td>${ticket.hub}</td>
                <td>${ticket.outlet}</td>
                <td>${ticket.kategori}</td>
                <td><span class="badge ${urgencyClass}">${ticket.urgensiPemohon}</span></td>
                <td><span class="badge ${statusClass}">${ticket.statusPekerjaan}</span></td>
                <td>${ticket.picTeknisi || '-'}</td>
                <td>
                    ${getActionButton(ticket)}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Show ticket detail
function showTicketDetail(ticketJson) {
    const ticket = JSON.parse(ticketJson);
    alert(`
Ticket ID: ${ticket.ticketId}
Outlet: ${ticket.outlet}
Kategori: ${ticket.kategori}
Deskripsi: ${ticket.deskripsi}
Status: ${ticket.statusPekerjaan}
PIC: ${ticket.picTeknisi || '-'}
Catatan: ${ticket.catatanGA || '-'}
    `);
}

// Switch tab
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabs = {
        'dashboard': 'dashboardTab',
        'pending': 'pendingTab',
        'progress': 'progressTab',
        'completed': 'completedTab'
    };
    
    document.getElementById(tabs[tabName]).classList.add('active');
    event.target.classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
