var selectedProblem = null;
// bo'sh qatorli manzil - frontend backend bilan bir xil serverdan xizmat qilgani uchun
// (server.js dagi express.static) domenni qattiq yozib qo'yish shart emas,
// shunda saytni boshqa domenga ko'chirganda ham kod o'zgarmaydi
var API_MANZIL = '';
var adminToken = null;

// HTML ichiga foydalanuvchi kiritgan matnni xavfsiz joylashtirish uchun
// (masalan buyurtma tavsifi yoki usta ismida <script> bo'lib qolmasligi uchun)
function ekranlaHtml(matn) {
  var div = document.createElement('div');
  div.textContent = matn == null ? '' : String(matn);
  return div.innerHTML;
}

// ===================== TAB =====================
function showTab(tabName) {
  var customerPage = document.getElementById('customerPage');
  var adminPage = document.getElementById('adminPage');
  var customerBtn = document.getElementById('tabCustomerBtn');
  var adminBtn = document.getElementById('tabAdminBtn');

  if (tabName === 'customer') {
    customerPage.style.display = 'block';
    adminPage.style.display = 'none';
    customerBtn.classList.add('active');
    adminBtn.classList.remove('active');
  } else {
    customerPage.style.display = 'none';
    adminPage.style.display = 'block';
    adminBtn.classList.add('active');
    customerBtn.classList.remove('active');

    // Admin panel ochilganda avtomatik login qilamiz
    adminLoginKeyinYukla();
  }
}

// ===================== ADMIN LOGIN =====================
function adminLoginKeyinYukla() {
  // Agar token allaqachon bor bo‘lsa, to‘g‘ridan-to‘g‘ri yuklaymiz
  if (adminToken) {
    yuklaAdminMalumotlari();
    return;
  }

  // Default admin bilan kirish
  fetch(API_MANZIL + '/api/admin/kirish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telefon: '+998900000000',
      parol: 'admin123'
    })
  })
    .then(function (javob) {
      if (!javob.ok) throw new Error('Admin login xato');
      return javob.json();
    })
    .then(function (data) {
      adminToken = data.token;
      yuklaAdminMalumotlari();
    })
    .catch(function (xato) {
      console.error('Admin login xato:', xato);
      alert('Admin panelga kira olmadik. Backend ishlab turganiga va admin paroli to‘g‘riligiga ishonch hosil qiling.');
    });
}

// ===================== ADMIN MA'LUMOTLAR =====================
function yuklaAdminMalumotlari() {
  var headers = {
    'Authorization': 'Bearer ' + adminToken
  };

  // 1. Statistika
  fetch(API_MANZIL + '/api/statistika', { headers: headers })
    .then(function (javob) { return javob.json(); })
    .then(function (stat) {
      document.getElementById('statBugungi').textContent = stat.bugungiBuyurtmalar;
      document.getElementById('statFaolUstalar').textContent = stat.faolUstalar;
      document.getElementById('statBandBosh').textContent =
        stat.bandUstalar + ' band, ' + stat.boshUstalar + ' bo\'sh';
      document.getElementById('statBandSoni').textContent = stat.bandUstalar;
    })
    .catch(function (xato) {
      console.error('Statistika xato:', xato);
    });

  // 2. Buyurtmalar
  fetch(API_MANZIL + '/api/buyurtmalar', { headers: headers })
    .then(function (javob) { return javob.json(); })
    .then(function (buyurtmalar) {
      var jadvalTana = document.getElementById('ordersTableBody');

      if (!buyurtmalar || buyurtmalar.length === 0) {
        jadvalTana.innerHTML = '<tr><td colspan="5">Hali buyurtma yo\'q</td></tr>';
        return;
      }

      var qatorlarHtml = '';
      for (var i = 0; i < buyurtmalar.length; i++) {
        var b = buyurtmalar[i];

        var holatPill = '';
        if (b.holat === 'yolda') {
          holatPill = '<span class="pill pill-active">Yo\'lda</span>';
        } else if (b.holat === 'bajarildi') {
          holatPill = '<span class="pill pill-done">Bajarildi</span>';
        } else {
          holatPill = '<span class="pill pill-wait">Kutilmoqda</span>';
        }

        var vaqt = b.yaratilgan_vaqt
          ? b.yaratilgan_vaqt.slice(11, 16)   // faqat soat:daqiqa
          : '-';

        qatorlarHtml += '<tr>';
        qatorlarHtml += '<td>' + ekranlaHtml(b.tavsif || '-') + '</td>';
        qatorlarHtml += '<td>' + ekranlaHtml(b.muammo_turi || '-') + '</td>';
        qatorlarHtml += '<td>' + ekranlaHtml(b.usta_ism || '-') + '</td>';
        qatorlarHtml += '<td>' + holatPill + '</td>';
        qatorlarHtml += '<td>' + vaqt + '</td>';
        qatorlarHtml += '</tr>';
      }

      jadvalTana.innerHTML = qatorlarHtml;
    })
    .catch(function (xato) {
      console.error('Buyurtmalar xato:', xato);
    });

  // 3. Ustalar
  fetch(API_MANZIL + '/api/ustalar', { headers: headers })
    .then(function (javob) { return javob.json(); })
    .then(function (ustalar) {
      var konteyner = document.getElementById('ustaListContainer');
      var qatorlarHtml = '';

      for (var i = 0; i < ustalar.length; i++) {
        var u = ustalar[i];
        var nuqtaKlass = (u.holat === 'band') ? 'dot-busy' : 'dot-free';
        var holatSoz = (u.holat === 'band') ? 'band' : 'bo\'sh';

        qatorlarHtml += '<div class="usta-row">';
        qatorlarHtml += '<div class="dot ' + nuqtaKlass + '"></div>';
        qatorlarHtml += '<div>';
        qatorlarHtml += '<div class="usta-row-name">' + ekranlaHtml(u.ism) + '</div>';
        qatorlarHtml += '<div class="usta-row-sub">' + ekranlaHtml(u.turi) + ', ' + holatSoz + '</div>';
        qatorlarHtml += '</div>';
        qatorlarHtml += '</div>';
      }

      konteyner.innerHTML = qatorlarHtml || '<div class="usta-row">Ustalar topilmadi</div>';
    })
    .catch(function (xato) {
      console.error('Ustalar xato:', xato);
    });
}

// ===================== MUAMMO TANLASH =====================
function selectProblem(cardElement, problemName) {
  var allCards = document.querySelectorAll('.problem-card');
  for (var i = 0; i < allCards.length; i++) {
    allCards[i].classList.remove('selected');
  }

  cardElement.classList.add('selected');
  selectedProblem = problemName;

  document.getElementById('orderForm').style.display = 'block';
  document.getElementById('searchingBox').style.display = 'none';
  document.getElementById('matchedBox').style.display = 'none';
}

// ===================== BUYURTMA YUBORISH =====================
function sendOrder() {
  var desc = document.getElementById('descInput').value.trim();
  var addr = document.getElementById('addrInput').value.trim();

  if (!desc || !addr) {
    if (!desc) document.getElementById('descInput').style.borderColor = 'red';
    if (!addr) document.getElementById('addrInput').style.borderColor = 'red';
    return;
  }

  if (!selectedProblem) {
    alert('Avval muammo turini tanlang');
    return;
  }

  // Inputlarni tozalash
  document.getElementById('descInput').style.borderColor = '';
  document.getElementById('addrInput').style.borderColor = '';

  document.getElementById('orderForm').style.display = 'none';
  document.getElementById('matchedBox').style.display = 'none';
  document.getElementById('searchingBox').style.display = 'block';

  fetch(API_MANZIL + '/api/buyurtmalar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tavsif: desc,
      manzil: addr,
      muammoTuri: selectedProblem
    })
  })
    .then(function (javob) {
      if (!javob.ok) {
        return javob.json().then(function (err) {
          throw new Error(err.xato || 'Server xatolik qaytardi');
        });
      }
      return javob.json();
    })
    .then(function (natija) {
      document.getElementById('ustaAvatar').textContent = natija.usta.ism.charAt(0);
      document.getElementById('ustaName').textContent = natija.usta.ism;
      document.getElementById('ustaJobs').textContent = natija.usta.ishlarSoni + ' ta ish';
      document.getElementById('ustaType').textContent = natija.usta.turi;
      document.getElementById('etaNumber').textContent = natija.daqiqa;

      document.getElementById('searchingBox').style.display = 'none';
      document.getElementById('matchedBox').style.display = 'block';

      // Formani tozalash
      document.getElementById('descInput').value = '';
      document.getElementById('addrInput').value = '';
    })
    .catch(function (xato) {
      document.getElementById('searchingBox').style.display = 'none';
      document.getElementById('orderForm').style.display = 'block';
      alert('Xatolik: ' + xato.message);
      console.error(xato);
    });
}