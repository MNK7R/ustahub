// tanlangan muammo turini shu yerda saqlab turamiz
var selectedProblem = null;

// tablarni almashtirish uchun funksiya
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

    // boshliq panelga o'tganda, har safar eng yangi ma'lumotni yuklaymiz
    yuklaAdminMalumotlari();
  }
}

// boshliq paneli uchun statistika, buyurtmalar va ustalarni backenddan olib kelamiz
function yuklaAdminMalumotlari() {
  // 1) statistika
  fetch(API_MANZIL + '/api/statistika')
    .then(function (javob) { return javob.json(); })
    .then(function (stat) {
      document.getElementById('statBugungi').textContent = stat.bugungiBuyurtmalar;
      document.getElementById('statFaolUstalar').textContent = stat.faolUstalar;
      document.getElementById('statBandBosh').textContent = stat.bandUstalar + ' band, ' + stat.boshUstalar + ' bo\'sh';
      document.getElementById('statBandSoni').textContent = stat.bandUstalar;
    })
    .catch(function (xato) {
      console.error('statistikani olishda xato', xato);
    });

  // 2) so'nggi buyurtmalar jadvali
  fetch(API_MANZIL + '/api/buyurtmalar')
    .then(function (javob) { return javob.json(); })
    .then(function (buyurtmalar) {
      var jadvalTana = document.getElementById('ordersTableBody');

      if (buyurtmalar.length === 0) {
        jadvalTana.innerHTML = '<tr><td colspan="5">Hali buyurtma yo\'q</td></tr>';
        return;
      }

      var qatorlarHtml = '';
      for (var i = 0; i < buyurtmalar.length; i++) {
        var b = buyurtmalar[i];

        // holatni chiroyliroq ko'rsatish uchun
        var holatPill = '';
        if (b.holat === 'yolda') {
          holatPill = '<span class="pill pill-active">Yo\'lda</span>';
        } else if (b.holat === 'bajarildi') {
          holatPill = '<span class="pill pill-done">Bajarildi</span>';
        } else {
          holatPill = '<span class="pill pill-wait">Kutilmoqda</span>';
        }

        qatorlarHtml += '<tr>';
        qatorlarHtml += '<td>' + b.tavsif + '</td>';
        qatorlarHtml += '<td>' + b.muammo_turi + '</td>';
        qatorlarHtml += '<td>' + (b.usta_ism || '-') + '</td>';
        qatorlarHtml += '<td>' + holatPill + '</td>';
        qatorlarHtml += '<td>' + b.yaratilgan_vaqt + '</td>';
        qatorlarHtml += '</tr>';
      }

      jadvalTana.innerHTML = qatorlarHtml;
    })
    .catch(function (xato) {
      console.error('buyurtmalarni olishda xato', xato);
    });

  // 3) ustalar ro'yxati
  fetch(API_MANZIL + '/api/ustalar')
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
        qatorlarHtml += '<div class="usta-row-name">' + u.ism + '</div>';
        qatorlarHtml += '<div class="usta-row-sub">' + u.turi + ', ' + holatSoz + '</div>';
        qatorlarHtml += '</div>';
        qatorlarHtml += '</div>';
      }

      konteyner.innerHTML = qatorlarHtml;
    })
    .catch(function (xato) {
      console.error('ustalarni olishda xato', xato);
    });
}

// muammo kartasi bosilganda ishlaydi
function selectProblem(cardElement, problemName) {
  // avval hamma kartadan selected classini olib tashlaymiz
  var allCards = document.querySelectorAll('.problem-card');
  for (var i = 0; i < allCards.length; i++) {
    allCards[i].classList.remove('selected');
  }

  // bosilgan kartaga selected qo'shamiz
  cardElement.classList.add('selected');
  selectedProblem = problemName;

  // forma ko'rinsin
  document.getElementById('orderForm').style.display = 'block';

  // eski natijalarni yashiramiz, yangi tanlov qilganda
  document.getElementById('searchingBox').style.display = 'none';
  document.getElementById('matchedBox').style.display = 'none';
}

// har xil muammo turi uchun namuna ustalar ro'yxati
var ustaPool = {
  'Santexnik': { name: 'Aziz Rahimov', jobs: '312 ta ish' },
  'Elektrik': { name: 'Bekzod Tursunov', jobs: '198 ta ish' },
  'Konditsioner': { name: 'Sardor Yusupov', jobs: '145 ta ish' },
  'Boshqa': { name: 'Farrux Nazarov', jobs: '89 ta ish' }
};

// backend qayerda ishlayotgani, shu manzilga so'rov yuboramiz
var API_MANZIL = 'http://localhost:3000';

// "Usta chaqirish" tugmasi bosilganda
function sendOrder() {
  var desc = document.getElementById('descInput').value;
  var addr = document.getElementById('addrInput').value;

  // ikkala maydon ham to'ldirilishi kerak
  if (desc.trim() === '' || addr.trim() === '') {
    if (desc.trim() === '') {
      document.getElementById('descInput').style.borderColor = 'red';
    }
    if (addr.trim() === '') {
      document.getElementById('addrInput').style.borderColor = 'red';
    }
    return;
  }

  // formani yashirib, qidirish animatsiyasini ko'rsatamiz
  document.getElementById('orderForm').style.display = 'none';
  document.getElementById('matchedBox').style.display = 'none';
  document.getElementById('searchingBox').style.display = 'block';

  // backendga haqiqiy so'rov yuboramiz
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
        throw new Error('server xatolik qaytardi');
      }
      return javob.json();
    })
    .then(function (natija) {
      // backend qaysi ustani tayinlaganini shu yerda ko'rsatamiz
      document.getElementById('ustaAvatar').textContent = natija.usta.ism.charAt(0);
      document.getElementById('ustaName').textContent = natija.usta.ism;
      document.getElementById('ustaJobs').textContent = natija.usta.ishlarSoni + ' ta ish';
      document.getElementById('ustaType').textContent = natija.usta.turi;
      document.getElementById('etaNumber').textContent = natija.daqiqa;

      document.getElementById('searchingBox').style.display = 'none';
      document.getElementById('matchedBox').style.display = 'block';
    })
    .catch(function (xato) {
      // agar backend ishlamayotgan bo'lsa yoki xato bo'lsa, shu yerda bildiramiz
      document.getElementById('searchingBox').style.display = 'none';
      document.getElementById('orderForm').style.display = 'block';
      alert('Xatolik: backend serverga ulanib bo\'lmadi. Server ishlab turganiga ishonch hosil qiling.');
      console.error(xato);
    });
}