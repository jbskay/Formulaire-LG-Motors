// formulaire.js
console.log("JS chargé !");
document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('enregistrementForm');
  const clientPhone = document.getElementById('clientPhone');
  const clientPhoto = document.getElementById('clientPhoto');
  const agentPhoto = document.getElementById('agentPhoto');
  const clientPreview = document.getElementById('clientPhotoPreview');
  const agentPreview = document.getElementById('agentPhotoPreview');
  const statusMessage = document.getElementById('statusMessage');
  const finalStep = document.getElementById('finalStep');
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');

  // --------- Aperçu images ----------
  function readPreview(input, imgEl) {
    imgEl.style.display = 'none';
    const file = input.files && input.files[0];
    if (!file || !file.type.startsWith('image/')) {
      imgEl.src = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      imgEl.src = e.target.result;
      imgEl.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  clientPhoto.addEventListener('change', () => readPreview(clientPhoto, clientPreview));
  agentPhoto.addEventListener('change', () => readPreview(agentPhoto, agentPreview));

  // --------- Validation téléphone ----------
  clientPhone.addEventListener('input', function() {
    let val = this.value.replace(/[^+\d]/g, '');
    if (val.startsWith('+')) {
      val = '+' + val.slice(1).replace(/\+/g, '');
    } else {
      val = val.replace(/\+/g, '');
    }
    let plus = val.startsWith('+') ? '+' : '';
    let numbersOnly = val.replace('+', '');
    if (numbersOnly.length > 14) numbersOnly = numbersOnly.slice(0, 14);
    this.value = plus + numbersOnly;
  });

  // --------- Signatures ----------
  function setupSignature(canvasId, hiddenId) {
    const canvas = document.getElementById(canvasId);
    const hidden = document.getElementById(hiddenId);
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineWidth = 2.5;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let drawing = false, lastX = 0, lastY = 0;

    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
        y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      };
    }

    function start(e) { e.preventDefault(); drawing = true; const p = pos(e); lastX = p.x; lastY = p.y; }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    }
    function end() { drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive:false });
    canvas.addEventListener('touchmove', move, { passive:false });
    canvas.addEventListener('touchend', end);

    document.querySelector(`[data-clear="${canvasId}"]`).onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hidden.value = "";
    };

    document.querySelector(`[data-save="${canvasId}"]`).onclick = (e) => {
      hidden.value = canvas.toDataURL("image/png");
      e.target.textContent = "Signature enregistrée";
      setTimeout(() => e.target.textContent = "Enregistrer signature", 1500);
    };
  }

  setupSignature("sigClient", "sigClientData");
  setupSignature("sigAgent", "sigAgentData");

  // --------- Validation + étapes ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) return form.reportValidity();
    if (!document.getElementById('sigClientData').value) {
      statusMessage.textContent = "Signature client requise."; return;
    }
    if (!document.getElementById('sigAgentData').value) {
      statusMessage.textContent = "Signature agent requise."; return;
    }

    statusMessage.textContent = "Veuillez attendre l'appel de confirmation.";
    document.getElementById('submitBtn').disabled = true;
    finalStep.hidden = false;
  });

  confirmPaymentBtn.addEventListener('click', () => {
    statusMessage.textContent = "Paiement confirmé";
    confirmPaymentBtn.disabled = true;
    finalStep.hidden = true;
  });

});
