/**
 * Dynamic Flowing Background - Dark Red Circles
 * Creates smooth flowing dark red circles across the background
 */

(function() {
    'use strict';

    // Configuration for flowing circles
    const CIRCLE_CONFIG = [
        { size: 'large', delay: 0, yOffset: 20 },
        { size: 'medium', delay: 5000, yOffset: 60 },
        { size: 'small', delay: 2500, yOffset: 40 },
        { size: 'large', delay: 10000, yOffset: 80 },
        { size: 'medium', delay: 7500, yOffset: 30 },
        { size: 'small', delay: 12500, yOffset: 70 },
        { size: 'medium', delay: 20000, yOffset: 100 },
        { size: 'small', delay: 25000, yOffset: 40 }
    ];

    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        createFlowingBackground();
    });

    function createFlowingBackground() {
        console.log('Creating flowing background...'); // DEBUG
        
        // Remove any existing background
        const existingBg = document.querySelector('.flowing-background');
        if (existingBg) {
            existingBg.remove();
            console.log('Removed existing background'); // DEBUG
        }

        // Create main container
        const container = document.createElement('div');
        container.className = 'flowing-background';
        container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            pointer-events: none !important;
            z-index: 0 !important;
            overflow: hidden !important;
            background: rgba(255,0,0,0.1) !important;
            opacity: 0.12 !important;
        `;
        
        // Insert as first child of body to ensure proper z-index
        document.body.insertBefore(container, document.body.firstChild);
        console.log('Created background container'); // DEBUG

        // Create flowing circles
        CIRCLE_CONFIG.forEach((config, index) => {
            console.log(`Setting up circle ${index} with delay ${config.delay}ms`); // DEBUG
            
            setTimeout(() => {
                createFlowingCircle(container, config, index);
            }, config.delay);

            // Set up repeating animation
            setInterval(() => {
                createFlowingCircle(container, config, index);
            }, 40000); // Increased cycle time to prevent overlap
        });
        
        console.log('All circles scheduled'); // DEBUG
    }

    function createFlowingCircle(container, config, index) {
        console.log(`Creating flowing circle: ${config.size} at index ${index}`); // DEBUG
        
        const circle = document.createElement('div');
        circle.className = `flow-circle ${config.size}`;
        
        // Calculate circle size for proper positioning
        const circleSizes = {
            large: 400,
            medium: 300,
            small: 200
        };
        
        const circleSize = circleSizes[config.size];
        
        // Random vertical position accounting for circle size
        const maxHeight = window.innerHeight - circleSize;
        const randomY = Math.max(0, Math.random() * maxHeight + config.yOffset);
        
        // Position circles completely off-screen to the left, accounting for their size
        const startPosition = -(circleSize + 50); // Extra 50px buffer
        
        circle.style.cssText = `
            position: absolute !important;
            top: ${randomY}px !important;
            left: ${startPosition}px !important;
            animation: flow-movement 40s linear infinite !important;
            animation-delay: 0s !important;
            z-index: -5 !important;
            width: ${circleSize}px !important;
            height: ${circleSize}px !important;
            background: red !important;
            border-radius: 50% !important;
            border: 5px solid yellow !important;
            opacity: 0.9 !important;
        `;

        console.log(`Circle created with top: ${randomY}px, left: ${startPosition}px, size: ${circleSize}px`); // DEBUG
        container.appendChild(circle);

        // Remove circle after animation completes
        setTimeout(() => {
            console.log(`Removing circle: ${config.size}`); // DEBUG
            if (circle.parentNode) {
                circle.parentNode.removeChild(circle);
            }
        }, 45000); // Allow 5 seconds extra for animation completion
    }

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recreate background on significant resize
            createFlowingBackground();
        }, 500);
    });

    // Cleanup function for page unload
    window.addEventListener('beforeunload', function() {
        const container = document.querySelector('.flowing-background');
        if (container) {
            container.remove();
        }
    });

})();
