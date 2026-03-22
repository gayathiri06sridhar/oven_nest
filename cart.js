/** 
 * Oven Nest - Cart and Checkout Logic
 * Improved for robustness and reliability.
 */

// Initialize cart on script load
(function initOvenNestCart() {
    console.log("Oven Nest Cart: Initializing...");

    // Helper to run initialization when DOM is ready
    function onReady(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    onReady(() => {
        try {
            setupCart();
            console.log("Oven Nest Cart: Setup complete.");
        } catch (error) {
            console.error("Oven Nest Cart Error during setup:", error);
        }
    });

    function setupCart() {
        // --- State Management ---
        let cart = [];
        try {
            const savedCart = localStorage.getItem('oven_nest_cart');
            cart = savedCart ? JSON.parse(savedCart) : [];
            if (!Array.isArray(cart)) cart = [];
        } catch (e) {
            console.warn("Oven Nest Cart: Could not parse cart from localStorage, resetting.", e);
            cart = [];
        }

        // --- DOM Elements ---
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon) {
            console.warn("Oven Nest Cart: .cart-icon not found in DOM.");
            return;
        }

        const cartCount = document.createElement('span');
        cartCount.className = 'cart-badge';
        cartIcon.appendChild(cartCount);

        const cartDrawer = document.createElement('div');
        cartDrawer.className = 'cart-drawer';
        cartDrawer.innerHTML = `
            <div class="cart-header">
                <h2>Your Cart</h2>
                <button class="close-cart">&times;</button>
            </div>
            <div class="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total">Total: ₹<span>0</span></div>
                <button class="btn btn-primary checkout-btn">Checkout</button>
            </div>
        `;
        document.body.appendChild(cartDrawer);

        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        document.body.appendChild(overlay);

        // --- Core Functions ---
        function updateCartUI() {
            const cartItemsContainer = cartDrawer.querySelector('.cart-items');
            if (!cartItemsContainer) return;

            cartItemsContainer.innerHTML = '';
            let total = 0;
            let count = 0;

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                count += item.quantity;

                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>₹${item.price} x ${item.quantity}</p>
                    </div>
                    <div class="item-actions">
                        <button class="qty-btn minus" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn plus" data-index="${index}">+</button>
                        <button class="remove-item" data-index="${index}">&times;</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });

            cartDrawer.querySelector('.cart-total span').textContent = total;
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';

            try {
                localStorage.setItem('oven_nest_cart', JSON.stringify(cart));
            } catch (e) {
                console.error("Oven Nest Cart: Failed to save to localStorage (it might be full).", e);
            }
        }

        function addToCart(id, name, price) {
            console.log(`Oven Nest Cart: Adding item - ${name} (${price})`);
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }
            updateCartUI();
            openCart();
        }

        function openCart() {
            cartDrawer.classList.add('open');
            overlay.classList.add('active');
        }

        function closeCart() {
            cartDrawer.classList.remove('open');
            overlay.classList.remove('active');
        }

        // --- Event Delegation for "Add to Cart" ---
        // Initially set button text and prepare for clicks
        document.querySelectorAll('.btn-buy').forEach(button => {
            button.textContent = 'Add to Cart';
        });

        document.addEventListener('click', (e) => {
            const buyButton = e.target.closest('.btn-buy');
            if (buyButton) {
                try {
                    const productItem = buyButton.closest('.product-item');
                    if (!productItem) throw new Error("Parent .product-item not found");
                    
                    const name = productItem.querySelector('h3').textContent;
                    const priceText = productItem.querySelector('.price').textContent;
                    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
                    const id = name.toLowerCase().replace(/\s+/g, '-');
                    
                    addToCart(id, name, price);
                } catch (err) {
                    console.error("Oven Nest Cart Error: Failed to add item to cart.", err);
                    alert("Sorry, there was an issue adding this item to your cart.");
                }
            }
        });

        // --- Other Listeners ---
        cartIcon.addEventListener('click', openCart);
        cartDrawer.querySelector('.close-cart').addEventListener('click', closeCart);
        overlay.addEventListener('click', closeCart);

        cartDrawer.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if (index === undefined) return;

            if (e.target.classList.contains('plus')) {
                cart[index].quantity += 1;
                updateCartUI();
            } else if (e.target.classList.contains('minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                updateCartUI();
            } else if (e.target.classList.contains('remove-item')) {
                cart.splice(index, 1);
                updateCartUI();
            }
        });

        // --- Checkout & Payment Logic (Preserved) ---
        const checkoutModal = document.getElementById('checkoutModal');
        const closePayment = document.querySelector('.close-payment');
        const confirmPaidBtn = document.querySelector('.paid-confirm-btn');
        const qrContainer = document.getElementById('qrcode');
        let qrInstance = null;

        function buildGoogleFormUrl() {
            let total = 0;
            let orderSummary = "";
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                orderSummary += `${item.name} (${item.quantity}x)${index < cart.length - 1 ? ', ' : ''}`;
            });
            const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdGIPxqN6ibCLmOFw4h7nx7F-si_QsW_LrogaHeQxkC4XX6BA/viewform";
            const orderEntryID = "entry.1477813068";
            return `${baseUrl}?usp=pp_url&${orderEntryID}=${encodeURIComponent(orderSummary + ' | Total: ₹' + total)}`;
        }

        function generateUPIQR(amount) {
            const upiID = 'shanmugam.sridhar-1@okaxis';
            const name = 'Sridhar Shanmugam';
            const upiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
            
            if (qrContainer) {
                qrContainer.innerHTML = '';
                // Assume QRCode comes from external script
                if (typeof QRCode !== 'undefined') {
                    qrInstance = new QRCode(qrContainer, {
                        text: upiURL,
                        width: 200,
                        height: 200,
                        colorDark: "#432818",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                } else {
                    console.error("QRCode library not loaded.");
                }
            }
        }

        const checkoutBtn = cartDrawer.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                let total = 0;
                cart.forEach(item => total += item.price * item.quantity);

                if (total === 0) {
                    alert("Your cart is empty!");
                    return;
                }

                if (checkoutModal) {
                    const amountDisplay = checkoutModal.querySelector('.pay-amount span');
                    if (amountDisplay) amountDisplay.textContent = `₹${total}`;
                    generateUPIQR(total);
                    checkoutModal.style.display = 'flex';
                    checkoutModal.classList.add('active');
                    closeCart();
                }
            });
        }

        if (closePayment) {
            closePayment.addEventListener('click', () => {
                checkoutModal.style.display = 'none';
                checkoutModal.classList.remove('active');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === checkoutModal) {
                checkoutModal.style.display = 'none';
                checkoutModal.classList.remove('active');
            }
        });

        if (confirmPaidBtn) {
            confirmPaidBtn.addEventListener('click', () => {
                const formUrl = buildGoogleFormUrl();
                cart = [];
                updateCartUI();
                if (checkoutModal) {
                    checkoutModal.style.display = 'none';
                    checkoutModal.classList.remove('active');
                }
                window.open(formUrl, '_blank');
            });
        }

        // Initial UI Update
        updateCartUI();
    }
})();

