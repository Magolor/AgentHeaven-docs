/**
 * Automatic Line Numbering for Code Blocks
 * Dynamically adds line numbers based on actual code content
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to add line numbers to a code block
    function addLineNumbers(highlight) {
        const pre = highlight.querySelector('pre');
        const codeElement = pre.querySelector('code') || pre;
        
        // Skip if already has line numbers
        if (highlight.querySelector('.linenodiv, .linenos, table.highlighttable, .line-numbers')) {
            return;
        }
        
        // Get the code content
        let content = codeElement.textContent || codeElement.innerText;
        
        // Handle different line ending types
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split into lines
        let lines = content.split('\n');
        
        // Remove empty last line if it exists (common in code blocks)
        if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        
        // Don't add line numbers if only one line or empty
        if (lines.length <= 1) {
            return;
        }
        
        // Create line numbers container
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';
        lineNumbers.setAttribute('aria-hidden', 'true');
        
        // Generate line numbers
        const lineNumbersContent = [];
        for (let i = 1; i <= lines.length; i++) {
            lineNumbersContent.push(i);
        }
        
        lineNumbers.textContent = lineNumbersContent.join('\n');
        
        // Add styles inline to ensure they work
        lineNumbers.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 3.5rem;
            height: 100%;
            background: rgba(13, 17, 23, 0.9);
            border-right: 2px solid rgba(199,0,11, 0.3);
            padding: 1.5rem 0.5rem;
            font-size: 12px;
            line-height: 1.4;
            color: #7d8590;
            text-align: right;
            user-select: none;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
            font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace;
            white-space: pre;
            box-sizing: border-box;
        `;
        
        // Adjust the pre element padding to make room for line numbers
        pre.style.paddingLeft = '4rem';
        
        // Make sure the highlight container is positioned relatively
        highlight.style.position = 'relative';
        
        // Add the line numbers to the highlight container
        highlight.appendChild(lineNumbers);
        
        // Add a class to mark this as processed
        highlight.classList.add('has-line-numbers');
    }
    
    // Process all existing code blocks
    function processCodeBlocks() {
        const codeBlocks = document.querySelectorAll('.highlight');
        codeBlocks.forEach(addLineNumbers);
    }
    
    // Initial processing
    processCodeBlocks();
    
    // Watch for dynamically added code blocks (useful for SPAs or dynamic content)
    const observer = new MutationObserver(function(mutations) {
        let shouldReprocess = false;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node is a code block or contains code blocks
                    if (node.classList && node.classList.contains('highlight')) {
                        addLineNumbers(node);
                    } else if (node.querySelectorAll) {
                        const newCodeBlocks = node.querySelectorAll('.highlight:not(.has-line-numbers)');
                        newCodeBlocks.forEach(addLineNumbers);
                    }
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Handle window resize to adjust line number positioning
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Re-calculate line numbers if needed
            const lineNumberContainers = document.querySelectorAll('.line-numbers');
            lineNumberContainers.forEach(function(container) {
                const highlight = container.parentElement;
                const pre = highlight.querySelector('pre');
                if (pre) {
                    // Ensure proper positioning after resize
                    container.style.height = pre.scrollHeight + 'px';
                }
            });
        }, 250);
    });
});
