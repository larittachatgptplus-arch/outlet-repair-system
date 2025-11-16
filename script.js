// ============================================
// HOMEPAGE JAVASCRIPT
// ============================================

function showPage(page) {
    if (page === 'outlet') {
        window.location.href = 'outlet.html';
    } else if (page === 'ga') {
        window.location.href = 'ga.html';
    }
}

// Smooth scroll animation
document.addEventListener('DOMContentLoaded', function() {
    // Animate feature items on load
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
