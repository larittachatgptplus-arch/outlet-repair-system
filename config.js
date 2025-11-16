// ============================================
// CONFIGURATION FILE
// ============================================

const CONFIG = {
    // ImgBB API Key (Free, unlimited upload)
    // Daftar di: https://api.imgbb.com/
    IMGBB_API_KEY: 'f9983838bfb42ba9c7f61336d9b73753', // API key public untuk demo
    
    // Google Apps Script Web App URL
    // Ganti dengan URL deployment Anda
    BACKEND_URL: 'https://script.google.com/macros/s/AKfycbzMlnDlvSlALn0kIEKBYcqgyx0V4voPebJHEF5tFPHNbQ76DMtoTGeC2nTfryoF-TOg/exec',
    
    // Upload settings
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 3,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    
    // HUB & Outlet data (akan diambil dari Google Sheet)
    // Ini hanya fallback jika backend tidak tersedia
    FALLBACK_DATA: {
        hubs: ['Surabaya Raya', 'Tangerang'],
        outlets: {
            'Surabaya Raya': ['Rungkut', 'Sepanjang', 'Kutai', 'Mulyosari'],
            'Tangerang': ['BSD', 'Gading Serpong', 'Alam Sutera']
        }
    }
};

// Helper function untuk validasi file
function validateFile(file) {
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: 'Tipe file tidak didukung. Gunakan JPG atau PNG.' };
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return { valid: false, error: `File terlalu besar. Maksimal ${CONFIG.MAX_FILE_SIZE / (1024*1024)}MB.` };
    }
    
    return { valid: true };
}

// Helper function untuk format tanggal
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Helper function untuk generate ticket ID
function generateTicketID() {
    const now = new Date();
    const dateStr = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0');
    const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${dateStr}-${randomStr}`;
}
