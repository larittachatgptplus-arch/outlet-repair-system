// ============================================
// OUTLET PAGE JAVASCRIPT
// ============================================

let uploadedPhotos = [];
let selectedFiles = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadHubList();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // HUB change event
    document.getElementById('hub').addEventListener('change', function() {
        loadOutletsByHub(this.value);
    });
    
    // Upload area events
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');
    
    uploadArea.addEventListener('click', () => photoInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Form submit
    document.getElementById('reportForm').addEventListener('submit', handleFormSubmit);
    
    // Outlet filter for status tab
    document.getElementById('outletFilter').addEventListener('change', function() {
        loadTicketStatus(this.value);
    });
}

// Load HUB list
async function loadHubList() {
    const hubSelect = document.getElementById('hub');
    const outletFilterSelect = document.getElementById('outletFilter');
    
    try {
        // Try to fetch from backend
        const response = await fetch(`${CONFIG.BACKEND_URL}?action=getHubs`);
        const data = await response.json();
        
        if (data.success && data.hubs) {
            populateHubDropdown(data.hubs);
            populateOutletFilter(data.hubs);
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        console.log('Using fallback data');
        // Use fallback data
        populateHubDropdown(CONFIG.FALLBACK_DATA.hubs);
        populateOutletFilter(CONFIG.FALLBACK_DATA.hubs);
    }
}

function populateHubDropdown(hubs) {
    const hubSelect = document.getElementById('hub');
    hubSelect.innerHTML = '<option value="">-- Pilih HUB --</option>';
    
    hubs.forEach(hub => {
        const option = document.createElement('option');
        option.value = hub;
        option.textContent = hub;
        hubSelect.appendChild(option);
    });
}

function populateOutletFilter(hubs) {
    const outletFilterSelect = document.getElementById('outletFilter');
    
    hubs.forEach(hub => {
        const outlets = CONFIG.FALLBACK_DATA.outlets[hub] || [];
        outlets.forEach(outlet => {
            const option = document.createElement('option');
            option.value = outlet;
            option.textContent = `${outlet} (${hub})`;
            outletFilterSelect.appendChild(option);
        });
    });
}

// Load outlets by HUB
async function loadOutletsByHub(hub) {
    const outletSelect = document.getElementById('outlet');
    
    if (!hub) {
        outletSelect.innerHTML = '<option value="">-- Pilih HUB terlebih dahulu --</option>';
        outletSelect.disabled = true;
        return;
    }
    
    outletSelect.innerHTML = '<option value="">⏳ Loading...</option>';
    outletSelect.disabled = true;
    
    try {
        // Try to fetch from backend
        const response = await fetch(`${CONFIG.BACKEND_URL}?action=getOutlets&hub=${encodeURIComponent(hub)}`);
        const data = await response.json();
        
        if (data.success && data.outlets) {
            populateOutletDropdown(data.outlets);
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        console.log('Using fallback data');
        // Use fallback data
        const outlets = CONFIG.FALLBACK_DATA.outlets[hub] || [];
        populateOutletDropdown(outlets);
    }
}

function populateOutletDropdown(outlets) {
    const outletSelect = document.getElementById('outlet');
    outletSelect.innerHTML = '<option value="">-- Pilih Outlet --</option>';
    
    if (outlets.length === 0) {
        outletSelect.innerHTML = '<option value="">Tidak ada outlet untuk HUB ini</option>';
        return;
    }
    
    outlets.forEach(outlet => {
        const option = document.createElement('option');
        option.value = outlet;
        option.textContent = outlet;
        outletSelect.appendChild(option);
    });
    
    outletSelect.disabled = false;
}

// Handle file selection
function handleFiles(files) {
    const filesArray = Array.from(files);
    
    // Check max files
    if (selectedFiles.length + filesArray.length > CONFIG.MAX_FILES) {
        showAlert('warning', `⚠️ Maksimal ${CONFIG.MAX_FILES} foto. Beberapa file diabaikan.`);
        return;
    }
    
    filesArray.forEach(file => {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            showAlert('danger', `❌ ${validation.error}`);
            return;
        }
        
        if (selectedFiles.length < CONFIG.MAX_FILES) {
            selectedFiles.push(file);
            previewFile(file);
        }
    });
}

// Preview file
function previewFile(file) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('previewContainer');
    
    reader.onload = function(e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="preview-remove" onclick="removeFile(${selectedFiles.length - 1})">×</button>
        `;
        previewContainer.appendChild(previewItem);
    };
    
    reader.readAsDataURL(file);
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    
    // Rebuild preview
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';
    
    selectedFiles.forEach(file => previewFile(file));
}

// Upload photos to ImgBB
async function uploadPhotos() {
    if (selectedFiles.length === 0) {
        return [];
    }
    
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    uploadProgress.classList.remove('hidden');
    
    const photoLinks = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            progressText.textContent = `Uploading foto ${i + 1} dari ${selectedFiles.length}...`;
            progressFill.style.width = `${((i + 1) / selectedFiles.length) * 100}%`;
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                photoLinks.push(data.data.url);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            showAlert('danger', `❌ Gagal upload foto ${i + 1}`);
            uploadProgress.classList.add('hidden');
            return null;
        }
    }
    
    uploadProgress.classList.add('hidden');
    return photoLinks;
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate files
    if (selectedFiles.length === 0) {
        showAlert('danger', '❌ Minimal upload 1 foto kerusakan!');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Uploading foto...';
    
    try {
        // Upload photos first
        const photoLinks = await uploadPhotos();
        
        if (!photoLinks) {
            throw new Error('Photo upload failed');
        }
        
        submitBtn.textContent = '⏳ Submitting data...';
        
        // Prepare form data
        const formData = {
            ticketId: generateTicketID(),
            timestamp: new Date().toISOString(),
            hub: document.getElementById('hub').value,
            outlet: document.getElementById('outlet').value,
            kategori: document.getElementById('kategori').value,
            deskripsi: document.getElementById('deskripsi').value,
            urgensi: document.getElementById('urgensi').value,
            linkFoto: photoLinks.join(', '),
            status: 'Menunggu Approval'
        };
        
        // Submit to backend
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'submitTicket',
                data: formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', `✅ Ticket berhasil dibuat! Nomor ticket: ${formData.ticketId}`);
            
            // Reset form
            document.getElementById('reportForm').reset();
            selectedFiles = [];
            document.getElementById('previewContainer').innerHTML = '';
            document.getElementById('outlet').disabled = true;
        } else {
            throw new Error(result.message || 'Submit failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('danger', '❌ Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Submit Laporan';
    }
}

// Load ticket status
async function loadTicketStatus(outlet) {
    if (!outlet) return;
    
    const container = document.getElementById('ticketContainer');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}?action=getTickets&outlet=${encodeURIComponent(outlet)}`);
        const data = await response.json();
        
        if (data.success && data.tickets) {
            displayTickets(data.tickets);
        } else {
            throw new Error('Failed to load tickets');
        }
    } catch (error) {
        container.innerHTML = '<p class="text-center text-muted">Error loading tickets</p>';
    }
}

// Display tickets
function displayTickets(tickets) {
    const container = document.getElementById('ticketContainer');
    
    if (tickets.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Belum ada ticket untuk outlet ini</p>';
        return;
    }
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Urgensi</th>
                    <th>Status</th>
                    <th>PIC</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    tickets.forEach(ticket => {
        const urgencyClass = ticket.urgensi === 'Urgent' ? 'badge-urgent' : 
                            ticket.urgensi === 'Tidak Urgent' ? 'badge-normal' : 'badge-low';
        const statusClass = ticket.status === 'Selesai' ? 'badge-done' :
                          ticket.status === 'On Progress' ? 'badge-progress' :
                          ticket.status === 'Ditolak' ? 'badge-rejected' : 'badge-pending';
        
        html += `
            <tr>
                <td><strong>${ticket.ticketId}</strong></td>
                <td>${formatDate(ticket.timestamp)}</td>
                <td>${ticket.kategori}</td>
                <td><span class="badge ${urgencyClass}">${ticket.urgensi}</span></td>
                <td><span class="badge ${statusClass}">${ticket.status}</span></td>
                <td>${ticket.picTeknisi || '-'}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'report') {
        document.getElementById('reportTab').classList.add('active');
        document.querySelector('.tab-btn:first-child').classList.add('active');
    } else {
        document.getElementById('statusTab').classList.add('active');
        document.querySelector('.tab-btn:last-child').classList.add('active');
    }
}

// Show alert
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}
