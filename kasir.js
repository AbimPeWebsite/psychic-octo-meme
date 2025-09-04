// Data produk
const products = [
    { id: 1, name: "Basic Ice", price: 12000 },
    { id: 2, name: "Basic Hot", price: 10000 },
    { id: 3, name: "Cofmik", price: 13000 },
    { id: 4, name: "Milo Milki", price: 13000 },
    { id: 5, name: "Ice Coklat", price: 12000 }
];

// Data LocalStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let rekap = JSON.parse(localStorage.getItem('rekap')) || [];
let rekapHistory = JSON.parse(localStorage.getItem('rekapHistory')) || [];
let currentDate = localStorage.getItem('currentDate') || new Date().toLocaleDateString();

// Render produk
const productContainer = document.getElementById('productContainer');
products.forEach(product => {
    const div = document.createElement('div');
    div.classList.add('product-card');
    div.innerHTML = `
        <h3>${product.name}</h3>
        <p>Rp ${product.price.toLocaleString()}</p>
        <button onclick="addToCart(${product.id})">Tambah</button>
    `;
    productContainer.appendChild(div);
});

// Tambah ke keranjang
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    renderCart();
}

// Render keranjang
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <p>${item.name} (x${item.qty}) - Rp ${(item.price * item.qty).toLocaleString()}</p>
            <button onclick="removeFromCart(${item.id})">Hapus</button>
        `;
        cartItems.appendChild(div);
    });

    document.getElementById('totalPrice').textContent = total.toLocaleString();
}

// Hapus dari keranjang
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

// Simpan keranjang
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Checkout
document.getElementById('checkoutBtn').addEventListener('click', () => {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert("Keranjang kosong!");
        return;
    }

    const name = prompt("Masukkan nama pemesan:");
    if (!name || name.trim() === "") {
        alert("Nama pemesan wajib diisi!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    rekap.push({
        id: Date.now(),
        date: currentDate,
        customer: name.trim(),
        total: total,
        payment: "BELUM BAYAR", // default baru
        items: [...cart],
        done: false
    });

    cart = [];
    saveCart();
    saveRekap();
    renderCart();
    renderRekap();

    alert("Pesanan berhasil ditambahkan ke rekapan.");
});

// Render rekapan
function renderRekap() {
    const rekapList = document.getElementById('rekapList');
    rekapList.innerHTML = '';

    let totalHargaHarian = 0;
    let totalCupHarian = 0;

    rekap.forEach(r => {
        if (r.date !== currentDate) return;

        totalHargaHarian += r.total;
        totalCupHarian += r.items.reduce((sum, i) => sum + i.qty, 0);

        const div = document.createElement('div');
        div.classList.add('rekap-item');
        if (r.done) div.classList.add('done');

        div.innerHTML = `
            <div>
                <strong>${r.customer}</strong> - Rp ${r.total.toLocaleString()} <br>
                <small>${r.date} | Pembayaran: <b>${r.payment}</b></small> <br>
                <em>${r.items.map(i => `${i.name} x${i.qty}`).join(', ')}</em>
            </div>
            <div>
                <input type="checkbox" ${r.done ? 'checked' : ''} onchange="toggleDone(${r.id})">
                <button onclick="setPayment(${r.id})">Set Pembayaran</button>
                <button onclick="deleteOrder(${r.id})">Hapus</button>
            </div>
        `;
        rekapList.appendChild(div);
    });

    const summaryDiv = document.createElement('div');
    summaryDiv.classList.add('rekap-summary');
    summaryDiv.innerHTML = `
        <hr>
        <strong>Total Cup Terjual:</strong> ${totalCupHarian} <br>
        <strong>Total Pendapatan:</strong> Rp ${totalHargaHarian.toLocaleString()}
    `;
    rekapList.appendChild(summaryDiv);
}

// Centang pesanan selesai
function toggleDone(orderId) {
    const item = rekap.find(r => r.id === orderId);
    if (item) {
        item.done = !item.done;
        saveRekap();
        renderRekap();
    }
}

// Hapus pesanan
function deleteOrder(orderId) {
    if (confirm("Apakah Anda yakin ingin menghapus pesanan ini?")) {
        const index = rekap.findIndex(r => r.id === orderId);
        if (index !== -1) {
            rekap.splice(index, 1);
            saveRekap();
            renderRekap();
        }
    }
}

// Set Pembayaran setelah checkout
function setPayment(orderId) {
    const order = rekap.find(r => r.id === orderId);
    if (!order) return;

    let paymentMethod = prompt("Metode pembayaran? (QRIS / CASH / BELUM BAYAR)", order.payment);
    if (!paymentMethod) return;

    paymentMethod = paymentMethod.trim().toUpperCase();
    if (!["QRIS", "CASH", "BELUM BAYAR"].includes(paymentMethod)) {
        alert("Metode pembayaran tidak valid!");
        return;
    }

    order.payment = paymentMethod;
    saveRekap();
    renderRekap();
}

// Tambah hari baru
document.getElementById('newDayBtn').addEventListener('click', () => {
    if (rekap.length > 0) {
        rekapHistory.push({
            date: currentDate,
            data: rekap.filter(r => r.date === currentDate)
        });
        localStorage.setItem('rekapHistory', JSON.stringify(rekapHistory));
    }

    rekap = [];
    currentDate = new Date().toLocaleDateString();
    localStorage.setItem('rekap', JSON.stringify(rekap));
    localStorage.setItem('currentDate', currentDate);

    renderRekap();
    alert("Hari baru dimulai! Rekapan lama tersimpan di Riwayat.");
});

// Lihat riwayat rekapan
function showHistory() {
    let historyText = "Riwayat Rekapan:\n\n";
    if (rekapHistory.length === 0) {
        historyText += "Belum ada riwayat.";
    } else {
        rekapHistory.forEach(day => {
            const total = day.data.reduce((sum, r) => sum + r.total, 0);
            historyText += `${day.date} - Total: Rp ${total.toLocaleString()} | Pesanan: ${day.data.length}\n`;
        });
    }
    alert(historyText);
}

// Simpan rekapan
function saveRekap() {
    localStorage.setItem('rekap', JSON.stringify(rekap));
}

// Render awal
renderCart();
renderRekap();
