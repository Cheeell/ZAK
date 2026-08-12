const { createApp, ref, reactive, computed, onMounted, onUpdated, nextTick } = Vue;

// Refresh Lucide icons after Vue renders new DOM elements
function refreshIcons() {
  nextTick(() => {
    if (window.lucide) lucide.createIcons();
  });
}

// Telegram WebApp initialization
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Determine API base URL
const API_BASE = (() => {
  // In production, the API is served from the same origin
  // For local dev, you might need to change this
  return window.location.origin + '/api';
})();

// Check if admin mode from URL param or Telegram init data
const urlParams = new URLSearchParams(window.location.search);
const isAdminMode = urlParams.get('admin') === '1';

const app = createApp({
  setup() {
    // State
    const view = ref(isAdminMode ? 'admin' : 'catalog');
    const loading = ref(true);
    const isAdmin = ref(isAdminMode);

    // Customer state
    const products = ref([]);
    const cart = reactive({ items: [], total: 0 });
    const checkout = reactive({ name: '', address: '', city: '', phone: '' });
    const placingOrder = ref(false);
    const checkoutError = ref('');
    const orderSuccess = ref(null);
    const myOrders = ref([]);

    // Admin state
    const stats = reactive({
      totalRevenue: 0, totalOrders: 0,
      pendingOrders: 0, shippedOrders: 0, deliveredOrders: 0,
      topProducts: []
    });
    const deliveries = ref([]);
    const allProducts = ref([]);
    const allOrders = ref([]);
    const orderFilter = ref('all');

    // Product form
    const showProductForm = ref(false);
    const editingProduct = ref(null);
    const productForm = reactive({
      name: '', description: '', price: 0, image_url: '', stock: 0, active: true
    });

    // Helper: get Telegram init data header
    function getHeaders() {
      const initData = tg?.initData || '';
      return {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
      };
    }

    // API helper
    async function api(path, options = {}) {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...options.headers }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
      }
      return res.json();
    }

    // Load products
    async function loadProducts() {
      loading.value = true;
      try {
        products.value = await api('/products');
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        loading.value = false;
      }
    }

    // Cart functions
    async function loadCart() {
      try {
        const data = await api('/cart');
        cart.items = data.items;
        cart.total = data.total;
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }

    async function addToCart(product) {
      try {
        const data = await api('/cart', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id, quantity: 1 })
        });
        cart.items = data.items;
        cart.total = data.total;
        tg?.HapticFeedback?.impactOccurred('light');
      } catch (err) {
        console.error('Failed to add to cart:', err);
      }
    }

    async function updateQuantity(item, newQty) {
      if (newQty < 1) return;
      try {
        const data = await api(`/cart/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: newQty })
        });
        cart.items = data.items;
        cart.total = data.total;
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
    }

    async function removeFromCart(item) {
      try {
        const data = await api(`/cart/${item.id}`, { method: 'DELETE' });
        cart.items = data.items;
        cart.total = data.total;
        tg?.HapticFeedback?.impactOccurred('medium');
      } catch (err) {
        console.error('Failed to remove from cart:', err);
      }
    }

    function isInCart(productId) {
      return cart.items.some(i => i.product_id === productId);
    }

    // Checkout
    async function placeOrder() {
      placingOrder.value = true;
      checkoutError.value = '';

      const address = `${checkout.name}, ${checkout.address}, ${checkout.city}, ${checkout.phone}`;

      try {
        const order = await api('/orders', {
          method: 'POST',
          body: JSON.stringify({ shipping_address: address })
        });
        orderSuccess.value = order;
        cart.items = [];
        cart.total = 0;
        tg?.HapticFeedback?.notificationOccurred('success');

        // Reset form
        checkout.name = '';
        checkout.address = '';
        checkout.city = '';
        checkout.phone = '';
      } catch (err) {
        checkoutError.value = err.message;
        tg?.HapticFeedback?.notificationOccurred('error');
      } finally {
        placingOrder.value = false;
      }
    }

    // My Orders
    async function loadMyOrders() {
      try {
        myOrders.value = await api('/orders');
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
    }

    // Admin: Stats
    async function loadStats() {
      try {
        const data = await api('/admin/stats');
        Object.assign(stats, data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    // Admin: Deliveries
    async function loadDeliveries() {
      try {
        deliveries.value = await api('/admin/deliveries');
      } catch (err) {
        console.error('Failed to load deliveries:', err);
      }
    }

    async function shipOrder(order) {
      if (!confirm(`Mark order #${order.id} as shipped?`)) return;
      try {
        const tracking = prompt('Enter tracking number (optional):') || null;
        await api(`/orders/${order.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'shipped', tracking_number: tracking })
        });
        tg?.HapticFeedback?.notificationOccurred('success');
        await loadDeliveries();
        await loadStats();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    async function shipOrderFromList(order) {
      if (!confirm(`Mark order #${order.id} as shipped?`)) return;
      try {
        const tracking = prompt('Enter tracking number (optional):') || null;
        await api(`/orders/${order.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'shipped', tracking_number: tracking })
        });
        tg?.HapticFeedback?.notificationOccurred('success');
        await loadAllOrders();
        await loadStats();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    async function cancelOrder(order) {
      if (!confirm(`Cancel order #${order.id}? Stock will be restored.`)) return;
      try {
        await api(`/orders/${order.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'cancelled' })
        });
        await loadAllOrders();
        await loadStats();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    // Admin: Products
    async function loadAllProducts() {
      try {
        allProducts.value = await api('/products/all');
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    }

    function openProductForm(product = null) {
      editingProduct.value = product;
      if (product) {
        Object.assign(productForm, {
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
          active: !!product.active
        });
      } else {
        Object.assign(productForm, {
          name: '', description: '', price: 0, image_url: '', stock: 0, active: true
        });
      }
      showProductForm.value = true;
    }

    async function saveProduct() {
      try {
        if (editingProduct.value) {
          await api(`/products/${editingProduct.value.id}`, {
            method: 'PUT',
            body: JSON.stringify(productForm)
          });
        } else {
          await api('/products', {
            method: 'POST',
            body: JSON.stringify(productForm)
          });
        }
        showProductForm.value = false;
        await loadAllProducts();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    async function deleteProduct(product) {
      if (!confirm(`Deactivate "${product.name}"?`)) return;
      try {
        await api(`/products/${product.id}`, { method: 'DELETE' });
        await loadAllProducts();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    async function reseedProducts() {
      if (!confirm('This will DELETE all products and load defaults. Continue?')) return;
      try {
        const data = await api('/admin/reseed', { method: 'POST' });
        alert(`Done! ${data.count} products loaded.`);
        await loadAllProducts();
      } catch (err) {
        alert('Failed: ' + err.message);
      }
    }

    // Admin: All Orders
    async function loadAllOrders() {
      try {
        const filter = orderFilter.value;
        const query = filter === 'all' ? '?all=1' : `?status=${filter}`;
        allOrders.value = await api(`/orders${query}`);
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
    }

    const filteredOrders = computed(() => {
      if (orderFilter.value === 'all') return allOrders.value;
      return allOrders.value.filter(o => o.status === orderFilter.value);
    });

    // Date formatting
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'Z');
      return d.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    // Telegram Main Button integration
    function setupMainButton() {
      if (!tg) return;

      tg.MainButton.setParams({
        text: 'PLACE ORDER',
        color: tg.themeParams.button_color || '#2481cc',
        text_color: tg.themeParams.button_text_color || '#ffffff'
      });

      tg.MainButton.onClick(() => {
        if (view.value === 'checkout' && !placingOrder.value) {
          placeOrder();
        }
      });
    }

    // Watch view changes for MainButton
    function updateMainButton() {
      if (!tg) return;
      if (view.value === 'checkout' && !orderSuccess.value) {
        tg.MainButton.show();
      } else {
        tg.MainButton.hide();
      }
    }

    // Lifecycle
    onMounted(async () => {
      setupMainButton();

      if (isAdmin.value) {
        await loadStats();
      } else {
        await Promise.all([loadProducts(), loadCart()]);
      }

      // Initial icon render
      refreshIcons();
    });

    // Re-render Lucide icons after every Vue DOM update
    onUpdated(refreshIcons);

    // Watch view for MainButton (simple interval check)
    setInterval(updateMainButton, 300);

    return {
      view, loading, isAdmin,
      products, cart, checkout, placingOrder, checkoutError, orderSuccess, myOrders,
      stats, deliveries, allProducts, allOrders, orderFilter,
      showProductForm, editingProduct, productForm,
      loadProducts, loadCart, addToCart, updateQuantity, removeFromCart, isInCart,
      placeOrder, loadMyOrders,
      loadStats, loadDeliveries, shipOrder, shipOrderFromList, cancelOrder,
      loadAllProducts, openProductForm, saveProduct, deleteProduct, reseedProducts,
      loadAllOrders, filteredOrders, formatDate
    };
  }
});

app.mount('#app');
