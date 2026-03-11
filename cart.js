document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('oven_nest_cart')) || [];
    const cartIcon = document.querySelector('.cart-icon');
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

    function updateCartUI() {
        const cartItemsContainer = cartDrawer.querySelector('.cart-items');
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

        localStorage.setItem('oven_nest_cart', JSON.stringify(cart));
    }

    function addToCart(id, name, price) {
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

    // Event Listeners
    document.querySelectorAll('.btn-buy').forEach(button => {
        const productItem = button.closest('.product-item');
        const name = productItem.querySelector('h3').textContent;
        const priceText = productItem.querySelector('.price').textContent;
        const price = parseInt(priceText.replace('₹', '').split(' ')[0]);
        const id = name.toLowerCase().replace(/\s+/g, '-');

        button.textContent = 'Add to Cart';
        button.addEventListener('click', () => addToCart(id, name, price));
    });

    cartIcon.addEventListener('click', openCart);
    cartDrawer.querySelector('.close-cart').addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    cartDrawer.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
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

    // ===== Two-Step Checkout: QR Code → Google Form =====
    const checkoutModal = document.getElementById('checkoutModal');
    const closePayment = document.querySelector('.close-payment');
    const confirmPaidBtn = document.querySelector('.paid-confirm-btn');
    const qrContainer = document.getElementById('qrcode');
    let qrInstance = null;

    // Build pre-filled Google Form URL from cart contents
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

    // Generate UPI QR code for the given amount
    function generateUPIQR(amount) {
        const upiID = 'shanmugam.sridhar-1@okaxis';
        const name = 'Sridhar Shanmugam';
        const upiURL = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
        qrContainer.innerHTML = '';
        qrInstance = new QRCode(qrContainer, {
            text: upiURL,
            width: 200,
            height: 200,
            colorDark: "#432818",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // Step 1: Open QR modal on Checkout click
    document.querySelector('.checkout-btn').addEventListener('click', () => {
        let total = 0;
        cart.forEach(item => total += item.price * item.quantity);

        if (total === 0) {
            alert("Your cart is empty!");
            return;
        }

        checkoutModal.querySelector('.pay-amount span').textContent = `₹${total}`;
        generateUPIQR(total);
        checkoutModal.style.display = 'flex';
        checkoutModal.classList.add('active');
        closeCart();
    });

    // Close QR modal
    closePayment.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
        checkoutModal.classList.remove('active');
    });

    window.addEventListener('click', (event) => {
        if (event.target === checkoutModal) {
            checkoutModal.style.display = 'none';
            checkoutModal.classList.remove('active');
        }
    });

    // Step 2: "I Have Paid" → redirect to Google Form pre-filled with order, clear cart
    confirmPaidBtn.addEventListener('click', () => {
        const formUrl = buildGoogleFormUrl();
        cart = [];
        localStorage.setItem('oven_nest_cart', JSON.stringify(cart));
        updateCartUI();
        checkoutModal.style.display = 'none';
        checkoutModal.classList.remove('active');
        window.open(formUrl, '_blank');
    });

    updateCartUI();
});
