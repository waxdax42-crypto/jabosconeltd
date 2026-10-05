(() => {
  const money = n => `KES ${Number(n).toLocaleString()}`;
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];

  const cart = JSON.parse(localStorage.getItem("jaboscone_cart") || "[]");
  const saveCart = () => localStorage.setItem("jaboscone_cart", JSON.stringify(cart));

  window.Jaboscone = {
    money,
    addToCart(id, qty=1) {
      const product = JABOSCONE.products.find(p => p.id === Number(id));
      if(!product) return;
      const existing = cart.find(x => x.id === product.id);
      if(existing) existing.qty += qty;
      else cart.push({id:product.id, qty});
      saveCart();
      updateCartCount();
      toast(`${product.name} added to cart`);
    },
    cart,
    saveCart
  };

  function updateCartCount(){
    const count = cart.reduce((sum,x)=>sum+x.qty,0);
    qsa("[data-cart-count]").forEach(el => el.textContent = count);
  }

  function toast(message){
    const el = qs("#toast");
    if(!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__toast);
    window.__toast = setTimeout(()=>el.classList.remove("show"),2200);
  }

  function setupMenu(){
    const btn = qs(".menu-btn"), mobile = qs(".mobile-nav");
    if(!btn || !mobile) return;
    btn.addEventListener("click",()=>mobile.classList.toggle("open"));
  }

  function setupSearch(){
    const input = qs("[data-product-search]"), grid = qs("[data-product-grid]");
    if(!input || !grid) return;
    input.addEventListener("input",()=>{
      const term = input.value.toLowerCase().trim();
      qsa("[data-product-card]", grid).forEach(card=>{
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? "" : "none";
      });
    });
  }

  function renderProducts(){
    const grid = qs("[data-product-grid]");
    if(!grid) return;
    grid.innerHTML = JABOSCONE.products.map(p=>`
      <article class="card product-card" data-product-card>
        <div class="product-image"><span>${p.icon}</span></div>
        <div class="product-body">
          <div class="badge badge-green">${p.category}</div>
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div class="product-meta">
            <div><strong>${money(p.price)}</strong><div style="font-size:11px;color:#7a8a83">${p.unit} · ${p.stock>0?`${p.stock} in stock`:"Out of stock"}</div></div>
            ${p.stock>0 ? `<button class="btn btn-primary btn-sm" onclick="Jaboscone.addToCart(${p.id})">Add</button>` : `<span class="badge badge-red">Out of stock</span>`}
          </div>
        </div>
      </article>
    `).join("");
  }

  function renderServices(){
    const grid = qs("[data-service-grid]");
    if(!grid) return;
    grid.innerHTML = JABOSCONE.services.map(s=>`
      <article class="card service-card">
        <div class="icon-box">${s.icon}</div>
        <div class="badge badge-green" style="align-self:flex-start">${s.category}</div>
        <h3 style="margin-top:12px">${s.name}</h3>
        <p>${s.desc}</p>
        <div class="bottom">
          <div>
            <div class="price">From ${money(s.price)}</div>
            <div style="font-size:11px;color:#7a8a83">${s.duration}</div>
          </div>
          <a class="btn btn-secondary btn-sm" href="booking.html?service=${s.id}">Book</a>
        </div>
      </article>
    `).join("");
  }

  function renderFeaturedServices(){
    const grid = qs("[data-featured-services]");
    if(!grid) return;
    grid.innerHTML = JABOSCONE.services.slice(0,6).map(s=>`
      <article class="card service-card">
        <div class="icon-box">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <div class="bottom">
          <span class="price">From ${money(s.price)}</span>
          <a class="btn btn-outline btn-sm" href="booking.html?service=${s.id}">Book</a>
        </div>
      </article>
    `).join("");
  }

  function populateServiceSelect(){
    const select = qs("#service");
    if(!select) return;
    const params = new URLSearchParams(location.search);
    const chosen = params.get("service");
    select.innerHTML = `<option value="">Choose a service</option>` + JABOSCONE.services.map(s=>`<option value="${s.id}" ${chosen==s.id?"selected":""}>${s.name} — From ${money(s.price)}</option>`).join("");
    updateBookingEstimate();
  }

  function updateBookingEstimate(){
    const select = qs("#service"), estimate = qs("#estimate");
    if(!select || !estimate) return;
    const s = JABOSCONE.services.find(x=>x.id===Number(select.value));
    estimate.textContent = s ? money(s.price) : "KES 0";
  }

  function setupBooking(){
    const form = qs("#booking-form");
    if(!form) return;
    populateServiceSelect();
    qs("#service")?.addEventListener("change",updateBookingEstimate);
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const data = new FormData(form);
      const s = JABOSCONE.services.find(x=>x.id===Number(data.get("service")));
      if(!s) return toast("Please choose a service");
      const ref = "JAB-" + new Date().getFullYear() + "-" + Math.floor(1000+Math.random()*8999);
      const booking = {
        ref, service:s.name, date:data.get("date"), time:data.get("time"),
        status:"Pending", amount:s.price, address:data.get("address")
      };
      const saved = JSON.parse(localStorage.getItem("jaboscone_bookings") || "[]");
      saved.unshift(booking);
      localStorage.setItem("jaboscone_bookings", JSON.stringify(saved));
      location.href = `dashboard.html?confirmed=${encodeURIComponent(ref)}`;
    });
  }

  function renderCart(){
    const area = qs("#cart-items"), totalEl = qs("#cart-total"), countEl = qs("#cart-count");
    if(!area) return;
    if(!cart.length){
      area.innerHTML = `<div class="empty"><div style="font-size:40px">🛒</div><h3>Your cart is empty</h3><p>Add a few cleaning products and they will appear here.</p><a class="btn btn-primary" href="products.html">Browse Products</a></div>`;
      if(totalEl) totalEl.textContent=money(0);
      if(countEl) countEl.textContent=0;
      return;
    }
    let total=0;
    area.innerHTML = cart.map((item,idx)=>{
      const p=JABOSCONE.products.find(x=>x.id===item.id);
      if(!p) return "";
      const line=p.price*item.qty; total+=line;
      return `<div class="cart-row">
        <div class="cart-product"><div class="thumb">${p.icon}</div><div><strong>${p.name}</strong><div style="font-size:11px;color:#7a8a83">${p.unit}</div></div></div>
        <div style="display:flex;align-items:center;gap:7px"><button class="qty-btn" data-minus="${idx}">−</button><strong>${item.qty}</strong><button class="qty-btn" data-plus="${idx}">+</button></div>
        <div class="cart-price"><strong>${money(line)}</strong></div>
        <button class="btn btn-danger btn-sm cart-action" data-remove="${idx}">Remove</button>
      </div>`;
    }).join("");
    if(totalEl) totalEl.textContent=money(total);
    if(countEl) countEl.textContent=cart.reduce((a,b)=>a+b.qty,0);
    qsa("[data-plus]").forEach(b=>b.onclick=()=>{cart[+b.dataset.plus].qty++;saveCart();renderCart();updateCartCount()});
    qsa("[data-minus]").forEach(b=>b.onclick=()=>{cart[+b.dataset.minus].qty=Math.max(1,cart[+b.dataset.minus].qty-1);saveCart();renderCart()});
    qsa("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);saveCart();renderCart();updateCartCount()});
  }

  function renderDashboard(){
    const table = qs("#booking-table");
    if(!table) return;
    const saved = JSON.parse(localStorage.getItem("jaboscone_bookings") || "[]");
    const all = [...saved, ...JABOSCONE.bookings];
    table.innerHTML = all.map(b=>`<tr><td><strong>${b.ref}</strong></td><td>${b.service}</td><td>${b.date}</td><td>${b.time}</td><td><span class="badge ${b.status==="Completed"?"badge-green":"badge-yellow"}">${b.status}</span></td><td>${money(b.amount)}</td></tr>`).join("");
    const confirm = new URLSearchParams(location.search).get("confirmed");
    const banner=qs("#confirmation-banner");
    if(confirm && banner){banner.style.display="block";banner.textContent=`Booking ${confirm} created successfully. Your status is currently Pending.`;}
  }

  function setupCheckout(){
    const form=qs("#checkout-form");
    if(!form) return;
    const total=cart.reduce((sum,x)=>{
      const p=JABOSCONE.products.find(y=>y.id===x.id);
      return sum+(p?p.price*x.qty:0);
    },0);
    qs("#checkout-total")?.replaceChildren(document.createTextNode(money(total)));
    form.addEventListener("submit",e=>{
      e.preventDefault();
      if(!cart.length) return toast("Your cart is empty");
      const order="ORD-"+new Date().getFullYear()+"-"+Math.floor(1000+Math.random()*8999);
      localStorage.setItem("jaboscone_last_order", JSON.stringify({order,total,status:"Pending"}));
      cart.splice(0,cart.length);saveCart();updateCartCount();
      location.href="dashboard.html?order="+order;
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    updateCartCount();setupMenu();setupSearch();renderProducts();renderServices();renderFeaturedServices();
    setupBooking();renderCart();renderDashboard();setupCheckout();
  });
})();
