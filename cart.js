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

    updateCartUI();
});
