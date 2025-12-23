/**
 * Mouse Spotlight Effect
 * Creates a dim dark red spotlight that follows the user's mouse cursor
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create spotlight element
    const spotlight = document.createElement('div');
    spotlight.id = 'mouse-spotlight';
    spotlight.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        filter: blur(120px);
        opacity: 0;
        transition: opacity 0.3s ease;
        mix-blend-mode: screen;
    `;
    
    // Add spotlight to body
    document.body.appendChild(spotlight);
    
    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;
    let fadeTimeout;
    
    // Smooth animation frame for spotlight position
    function updateSpotlight() {
        spotlight.style.left = mouseX + 'px';
        spotlight.style.top = mouseY + 'px';
        requestAnimationFrame(updateSpotlight);
    }
    
    // Start the animation loop
    updateSpotlight();
    
    // Track mouse movement
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Show spotlight when mouse moves
        if (!isMouseMoving) {
            isMouseMoving = true;
            spotlight.style.opacity = '1';
        }
        
        // Clear previous timeout
        clearTimeout(fadeTimeout);
        
        // Fade out after 2 seconds of no movement
        fadeTimeout = setTimeout(function() {
            spotlight.style.opacity = '0';
            isMouseMoving = false;
        }, 2000);
    });
    
    // Hide spotlight when mouse leaves the window
    document.addEventListener('mouseleave', function() {
        spotlight.style.opacity = '0';
        isMouseMoving = false;
        clearTimeout(fadeTimeout);
    });
    
    // Show spotlight when mouse enters the window
    document.addEventListener('mouseenter', function() {
        if (isMouseMoving) {
            spotlight.style.opacity = '1';
        }
    });
    
    // Handle window resize to maintain proper positioning
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Spotlight positioning is already handled by the mouse coordinates
            // This is just for future extensibility
        }, 100);
    });
    
    // Optional: Different spotlight intensity for different areas
    function adjustSpotlightIntensity(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        
        // Adjust opacity based on proximity to code blocks or important elements
        if (element.classList.contains('highlight') || element.tagName === 'H1' || element.tagName === 'H2') {
            const maxDistance = 1200;
            const intensity = Math.max(0.1, 1 - (distance / maxDistance));
            return Math.min(1, intensity * 1.2); // Slightly brighter near important elements
        }
        
        return 1; // Default intensity
    }
    
    // Enhanced mouse tracking with element-aware intensity (optional feature)
    let enhancedMode = false; // Set to true to enable element-aware intensity
    
    if (enhancedMode) {
        document.addEventListener('mousemove', function(e) {
            const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
            if (elementUnderMouse) {
                const intensity = adjustSpotlightIntensity(elementUnderMouse);
                spotlight.style.opacity = isMouseMoving ? intensity : '0';
            }
        });
    }
});
