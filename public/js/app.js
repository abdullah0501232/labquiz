const API_URL = '';

let foodItems = [];
let cart = [];
let activeCategory = 'All';

const foodGrid = document.getElementById('food-grid');
const categoryFilters = document.getElementById('category-filters');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartItemCountEl = document.getElementById('cart-item-count');
const navCartCountEl = document.getElementById('nav-cart-count');
const orderForm = document.getElementById('order-form');
const alertContainer = document.getElementById('alert-container');
const ordersList = document.getElementById('orders-list');
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

const customerNameInput = document.getElementById('customerName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');

const showAlert = (message, type = 'success') => {
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
};

const fetchFoodItems = async () => {
  try {
    const response = await fetch(`${API_URL}/food`);
    if (!response.ok) {
      throw new Error('Could not fetch food items.');
    }
    foodItems = await response.json();
    renderFoodCards();
  } catch (error) {
    foodGrid.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
  }
};

const renderFoodCards = () => {
  const filteredItems = activeCategory === 'All'
    ? foodItems
    : foodItems.filter(({ category }) => category === activeCategory);

  if (filteredItems.length === 0) {
    foodGrid.innerHTML = '<div class="col-12"><p class="text-muted">No food items found.</p></div>';
    return;
  }

  foodGrid.innerHTML = filteredItems.map(({ id, name, price, category }) => `
    <div class="col-sm-6 col-md-4">
      <div class="card h-100 border-0 shadow-sm food-card">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="badge bg-secondary category-badge">${category}</span>
            <span class="fw-bold text-success">$${price.toFixed(2)}</span>
          </div>
          <h3 class="h6 card-title fw-bold mb-3">${name}</h3>
          <button
            type="button"
            class="btn btn-outline-dark btn-sm mt-auto add-to-cart-btn"
            data-id="${id}"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

const addToCart = (foodId) => {
  const selectedFood = foodItems.find((item) => item.id === foodId);
  if (!selectedFood) return;

  const existingItem = cart.find((item) => item.id === foodId);

  if (existingItem) {
    cart = cart.map((item) =>
      item.id === foodId ? { ...item, quantity: item.quantity + 1 } : item
    );
  } else {
    cart = [...cart, { ...selectedFood, quantity: 1 }];
  }

  renderCart();
};

const updateQuantity = (foodId, change) => {
  cart = cart
    .map((item) =>
      item.id === foodId ? { ...item, quantity: item.quantity + change } : item
    )
    .filter((item) => item.quantity > 0);

  renderCart();
};

const removeFromCart = (foodId) => {
  cart = cart.filter((item) => item.id !== foodId);
  renderCart();
};

const calculateTotal = () =>
  cart.reduce((total, { price, quantity }) => total + price * quantity, 0);

const renderCart = () => {
  const totalQuantity = cart.reduce((sum, { quantity }) => sum + quantity, 0);
  const totalBill = calculateTotal();

  cartItemCountEl.textContent = `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`;
  navCartCountEl.textContent = totalQuantity;
  cartTotalEl.textContent = `$${totalBill.toFixed(2)}`;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-muted text-center my-3">Your cart is empty.</p>';
    return;
  }

  cartItemsContainer.innerHTML = cart.map(({ id, name, price, quantity }) => `
    <div class="cart-item-row d-flex justify-content-between align-items-center gap-2">
      <div>
        <div class="fw-semibold small">${name}</div>
        <div class="text-muted small">$${price.toFixed(2)} x ${quantity} = $${(price * quantity).toFixed(2)}</div>
      </div>
      <div class="d-flex align-items-center gap-1">
        <button type="button" class="btn btn-outline-secondary btn-sm qty-btn" data-id="${id}" data-change="-1">-</button>
        <button type="button" class="btn btn-outline-secondary btn-sm qty-btn" data-id="${id}" data-change="1">+</button>
        <button type="button" class="btn btn-outline-danger btn-sm remove-btn" data-id="${id}">&times;</button>
      </div>
    </div>
  `).join('');
};

const setFieldValidation = (input, errorElId, message) => {
  const errorEl = document.getElementById(errorElId);
  if (message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorEl.textContent = message;
    return false;
  }
  input.classList.remove('is-invalid');
  input.classList.add('is-valid');
  errorEl.textContent = '';
  return true;
};

const validateForm = () => {
  const nameVal = customerNameInput.value.trim();
  const emailVal = emailInput.value.trim();
  const phoneVal = phoneInput.value.trim();
  const addressVal = addressInput.value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+\-\s]{7,15}$/;

  const isNameValid = setFieldValidation(
    customerNameInput,
    'nameError',
    nameVal.length < 3 ? 'Name must be at least 3 characters.' : ''
  );

  const isEmailValid = setFieldValidation(
    emailInput,
    'emailError',
    !emailPattern.test(emailVal) ? 'Enter a valid email address.' : ''
  );

  const isPhoneValid = setFieldValidation(
    phoneInput,
    'phoneError',
    !phonePattern.test(phoneVal) ? 'Enter a valid phone number (7-15 digits).' : ''
  );

  const isAddressValid = setFieldValidation(
    addressInput,
    'addressError',
    addressVal.length < 5 ? 'Please enter a complete delivery address.' : ''
  );

  return isNameValid && isEmailValid && isPhoneValid && isAddressValid;
};

const clearValidationStyles = () => {
  [customerNameInput, emailInput, phoneInput, addressInput].forEach((input) => {
    input.classList.remove('is-valid', 'is-invalid');
  });
};

const fetchOrders = async () => {
  try {
    const response = await fetch(`${API_URL}/orders`);
    if (!response.ok) {
      throw new Error('Could not fetch orders.');
    }
    const orders = await response.json();
    renderOrders(orders);
  } catch (error) {
    ordersList.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
  }
};

const renderOrders = (orders) => {
  if (orders.length === 0) {
    ordersList.innerHTML = '<div class="col-12"><p class="text-muted">No orders placed yet.</p></div>';
    return;
  }

  ordersList.innerHTML = [...orders].reverse().map(({ id, customerName, phone, address, items, totalAmount, createdAt }) => {
    const itemSummary = items.map(({ name, quantity }) => `${name} (x${quantity})`).join(', ');
    return `
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold">Order #${id}</span>
              <span class="badge bg-success">$${Number(totalAmount).toFixed(2)}</span>
            </div>
            <p class="mb-1 small"><strong>Customer:</strong> ${customerName} (${phone})</p>
            <p class="mb-1 small"><strong>Address:</strong> ${address}</p>
            <p class="mb-1 small"><strong>Items:</strong> ${itemSummary}</p>
            <p class="mb-0 text-muted small">${new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

categoryFilters.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-category]');
  if (!btn) return;

  activeCategory = btn.dataset.category;
  categoryFilters.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
  btn.classList.add('active');
  renderFoodCards();
});

foodGrid.addEventListener('click', (event) => {
  const btn = event.target.closest('.add-to-cart-btn');
  if (!btn) return;
  addToCart(Number(btn.dataset.id));
});

cartItemsContainer.addEventListener('click', (event) => {
  const qtyBtn = event.target.closest('.qty-btn');
  if (qtyBtn) {
    updateQuantity(Number(qtyBtn.dataset.id), Number(qtyBtn.dataset.change));
    return;
  }

  const removeBtn = event.target.closest('.remove-btn');
  if (removeBtn) {
    removeFromCart(Number(removeBtn.dataset.id));
  }
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    showAlert('Please add at least one food item to your cart before placing an order.', 'warning');
    return;
  }

  if (!validateForm()) {
    return;
  }

  const orderPayload = {
    customerName: customerNameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    items: cart.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
    totalAmount: Number(calculateTotal().toFixed(2))
  };

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order.');
    }

    showAlert(`Order #${data.order.id} placed successfully! Total: $${orderPayload.totalAmount.toFixed(2)}`, 'success');
    cart = [];
    renderCart();
    orderForm.reset();
    clearValidationStyles();
    fetchOrders();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
});

refreshOrdersBtn.addEventListener('click', fetchOrders);

document.addEventListener('DOMContentLoaded', () => {
  fetchFoodItems();
  fetchOrders();
});
