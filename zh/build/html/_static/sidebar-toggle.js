/**
 * Enhanced Sidebar Toggle Functionality for Furo Theme
 * Provides always-visible toggle buttons and integrates with native Furo toggles
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        initSidebarToggles();
    });

    function initSidebarToggles() {
        const sidebarLeft = document.querySelector('.sidebar-drawer');
        const sidebarRight = document.querySelector('.toc-drawer');
        const mainContent = document.querySelector('#furo-main-content');
        
        // Native toggle elements
        const nativeNavToggle = document.querySelector('#__navigation');
        const nativeTocToggle = document.querySelector('#__toc');

        if (!sidebarLeft || !mainContent) {
            console.warn('Required sidebar elements not found');
            return;
        }

        // Create enhanced toggle buttons that are always visible
        const toggleLeft = document.createElement('button');
        toggleLeft.className = 'sidebar-toggle-left';
        toggleLeft.innerHTML = '☰'; // Hamburger icon
        toggleLeft.title = 'Toggle Navigation Sidebar';
        toggleLeft.setAttribute('aria-label', 'Toggle Navigation Sidebar');

        // Add left toggle to body
        document.body.appendChild(toggleLeft);

        // Create right toggle only if TOC exists
        let toggleRight = null;
        if (sidebarRight) {
            toggleRight = document.createElement('button');
            toggleRight.className = 'sidebar-toggle-right';
            toggleRight.innerHTML = '»'; // Right arrow
            toggleRight.title = 'Toggle Table of Contents';
            toggleRight.setAttribute('aria-label', 'Toggle Table of Contents');
            document.body.appendChild(toggleRight);
        }

        // Left sidebar toggle functionality - integrate with native toggle
        toggleLeft.addEventListener('click', function() {
            if (nativeNavToggle) {
                // Use native toggle mechanism
                nativeNavToggle.checked = !nativeNavToggle.checked;
                
                // Update button appearance
                if (nativeNavToggle.checked) {
                    toggleLeft.innerHTML = '«'; // Change to left arrow when open
                    toggleLeft.title = 'Hide Navigation Sidebar';
                } else {
                    toggleLeft.innerHTML = '☰'; // Back to hamburger when closed
                    toggleLeft.title = 'Show Navigation Sidebar';
                }
                
                // Save state to localStorage
                localStorage.setItem('sidebar-nav-open', nativeNavToggle.checked);
                
                // Manually trigger the sidebar visibility
                updateSidebarVisibility();
            }
        });

        // Right sidebar toggle functionality - integrate with native toggle
        if (toggleRight && nativeTocToggle) {
            toggleRight.addEventListener('click', function() {
                // Use native toggle mechanism
                nativeTocToggle.checked = !nativeTocToggle.checked;
                
                // Update button appearance
                if (nativeTocToggle.checked) {
                    toggleRight.innerHTML = '«'; // Change to left arrow when open
                    toggleRight.title = 'Hide Table of Contents';
                } else {
                    toggleRight.innerHTML = '»'; // Back to right arrow when closed
                    toggleRight.title = 'Show Table of Contents';
                }
                
                // Save state to localStorage
                localStorage.setItem('sidebar-toc-open', nativeTocToggle.checked);
                
                // Manually trigger the sidebar visibility
                updateSidebarVisibility();
            });
        }

        // Restore saved states on page load and set defaults
        const savedNavOpen = localStorage.getItem('sidebar-nav-open');
        const savedTocOpen = localStorage.getItem('sidebar-toc-open');

        // Set default states (collapsed by default for better UX)
        if (nativeNavToggle) {
            if (savedNavOpen !== null) {
                nativeNavToggle.checked = savedNavOpen === 'true';
            } else {
                // Default to collapsed (closed)
                nativeNavToggle.checked = false;
                localStorage.setItem('sidebar-nav-open', 'false');
            }
            
            // Update button appearance based on state
            if (nativeNavToggle.checked) {
                toggleLeft.innerHTML = '«';
                toggleLeft.title = 'Hide Navigation Sidebar';
            } else {
                toggleLeft.innerHTML = '☰';
                toggleLeft.title = 'Show Navigation Sidebar';
            }
        }

        if (nativeTocToggle && toggleRight) {
            if (savedTocOpen !== null) {
                nativeTocToggle.checked = savedTocOpen === 'true';
            } else {
                // Default to collapsed (closed)
                nativeTocToggle.checked = false;
                localStorage.setItem('sidebar-toc-open', 'false');
            }
            
            // Update button appearance based on state
            if (nativeTocToggle.checked) {
                toggleRight.innerHTML = '«';
                toggleRight.title = 'Hide Table of Contents';
            } else {
                toggleRight.innerHTML = '»';
                toggleRight.title = 'Show Table of Contents';
            }
        }

        // Listen for changes to native toggles (in case user clicks native buttons)
        if (nativeNavToggle) {
            nativeNavToggle.addEventListener('change', function() {
                if (this.checked) {
                    toggleLeft.innerHTML = '«';
                    toggleLeft.title = 'Hide Navigation Sidebar';
                } else {
                    toggleLeft.innerHTML = '☰';
                    toggleLeft.title = 'Show Navigation Sidebar';
                }
                localStorage.setItem('sidebar-nav-open', this.checked);
                
                // Update sidebar visibility
                updateSidebarVisibility();
            });
        }

        if (nativeTocToggle && toggleRight) {
            nativeTocToggle.addEventListener('change', function() {
                if (this.checked) {
                    toggleRight.innerHTML = '«';
                    toggleRight.title = 'Hide Table of Contents';
                } else {
                    toggleRight.innerHTML = '»';
                    toggleRight.title = 'Show Table of Contents';
                }
                localStorage.setItem('sidebar-toc-open', this.checked);
                
                // Update sidebar visibility
                updateSidebarVisibility();
            });
        }
        
        // Function to manually update sidebar visibility
        function updateSidebarVisibility() {
            const sidebarOverlay = document.querySelector('.sidebar-overlay');
            const tocOverlay = document.querySelector('.toc-overlay');
            const sidebarDrawer = document.querySelector('.sidebar-drawer');
            const tocDrawer = document.querySelector('.toc-drawer');
            
            const leftSidebarVisible = nativeNavToggle && nativeNavToggle.checked;
            const rightSidebarVisible = nativeTocToggle && nativeTocToggle.checked;
            
            // Update left sidebar
            if (nativeNavToggle && sidebarOverlay && sidebarDrawer) {
                if (leftSidebarVisible) {
                    // Show left sidebar - use Furo's native positioning
                    sidebarDrawer.style.display = 'block';
                    sidebarDrawer.style.transform = 'translateX(0)';
                    sidebarDrawer.style.opacity = '1';
                    sidebarDrawer.style.visibility = 'visible';
                    sidebarOverlay.style.display = 'block';
                    sidebarOverlay.style.opacity = '1';
                    
                } else {
                    // Hide left sidebar
                    sidebarDrawer.style.transform = 'translateX(-100%)';
                    sidebarDrawer.style.opacity = '0';
                    sidebarDrawer.style.visibility = 'hidden';
                    sidebarOverlay.style.display = 'none';
                    sidebarOverlay.style.opacity = '0';
                }
            }
            
            // Update right sidebar
            if (nativeTocToggle && tocOverlay && tocDrawer) {
                if (rightSidebarVisible) {
                    // Show right sidebar - use Furo's native positioning
                    tocDrawer.style.display = 'block';
                    tocDrawer.style.transform = 'translateX(0)';
                    tocDrawer.style.opacity = '1';
                    tocDrawer.style.visibility = 'visible';
                    tocOverlay.style.display = 'block';
                    tocOverlay.style.opacity = '1';
                    
                } else {
                    // Hide right sidebar
                    tocDrawer.style.transform = 'translateX(100%)';
                    tocDrawer.style.opacity = '0';
                    tocDrawer.style.visibility = 'hidden';
                    tocOverlay.style.display = 'none';
                    tocOverlay.style.opacity = '0';
                }
            }

            // Toggle body classes for consistency (but content width stays fixed)
            document.body.classList.toggle('sidebar-nav-open', leftSidebarVisible);
            document.body.classList.toggle('sidebar-nav-closed', !leftSidebarVisible);
            document.body.classList.toggle('sidebar-toc-open', rightSidebarVisible);
            document.body.classList.toggle('sidebar-toc-closed', !rightSidebarVisible);
        }
        
        // Initialize sidebar visibility on page load
        updateSidebarVisibility();

        // Enhanced styling for better visibility and responsiveness
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced toggle button styling */
            .sidebar-toggle-left,
            .sidebar-toggle-right {
                position: fixed !important;
                top: 20px !important;
                z-index: 1002 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: var(--tech-black, #0d1117) !important;
                border: 2px solid var(--main-color, rgb(199,0,11)) !important;
                border-radius: 50% !important;
                width: 44px !important;
                height: 44px !important;
                cursor: pointer !important;
                color: #fff !important;
                font-size: 18px !important;
                font-weight: bold !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 10px rgba(199,0,11, 0.4) !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .sidebar-toggle-left {
                left: 15px !important;
            }
            
            .sidebar-toggle-right {
                right: 15px !important;
            }
            
            .sidebar-toggle-left:hover,
            .sidebar-toggle-right:hover {
                background: var(--main-color, rgb(199,0,11)) !important;
                box-shadow: 0 4px 15px rgba(199,0,11, 0.6) !important;
                transform: scale(1.05) !important;
                border-color: var(--sub-color, rgb(211,57,65)) !important;
            }
            
            /* Hide native toggle buttons since we have custom ones */
            .nav-overlay-icon,
            .toc-overlay-icon {
                display: none !important;
            }
            
            /* Ensure Furo's native transitions work properly */
            .sidebar-drawer,
            .toc-drawer {
                transition: transform 0.3s ease, opacity 0.3s ease !important;
                position: fixed !important;
                top: 0 !important;
                height: 100vh !important;
                overflow-y: auto !important;
                z-index: 1000 !important;
            }
            
            /* Fix sidebar positioning to be independent of content scroll */
            .sidebar-drawer {
                left: 0 !important;
                width: 280px !important;
                background: var(--card-bg, #161b22) !important;
                border-right: 3px solid var(--main-color, rgb(199,0,11)) !important;
            }
            
            .toc-drawer {
                right: 0 !important;
                width: 280px !important;
                background: var(--card-bg, #161b22) !important;
                border-left: 3px solid var(--main-color, rgb(199,0,11)) !important;
            }
            
            /* Ensure custom toggles work on all screen sizes */
            @media (max-width: 768px) {
                .sidebar-toggle-left,
                .sidebar-toggle-right {
                    width: 40px !important;
                    height: 40px !important;
                    font-size: 16px !important;
                    top: 15px !important;
                }
                
                .sidebar-toggle-left {
                    left: 10px !important;
                }
                
                .sidebar-toggle-right {
                    right: 10px !important;
                }
                
                .sidebar-drawer,
                .toc-drawer {
                    width: 100% !important;
                    max-width: 280px !important;
                }
            }
            
            @media (max-width: 480px) {
                .sidebar-toggle-left,
                .sidebar-toggle-right {
                    width: 36px !important;
                    height: 36px !important;
                    font-size: 14px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
})();
