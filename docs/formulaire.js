// formulaire.js
// Logique client-side : aperçus photo, signatures (canvas), validations et flux "Veuillez attendre l'appel de confirmation".
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

 clientPhone.addEventListener('input', function() {
  // 1️⃣ Supprime tous les caractères sauf + et chiffres
  let val = this.value.replace(/[^+\d]/g, '');
  
  // 2️⃣ Autorise + seulement au début
  if (val.startsWith('+')) {
    val = '+' + val.slice(1).replace(/\+/g, '');
  } else {
    val = val.replace(/\+/g, '');
  }
  
  // 3️⃣ Limite la longueur des chiffres à 13 max
  let plus = val.startsWith('+') ? '+' : '';
  let numbersOnly = val.replace('+', '');
  if (numbersOnly.length > 14) {
    numbersOnly = numbersOnly.slice(0, 14);
  }
  
  // 4️⃣ Reconstruire la valeur finale
  this.value = plus + numbersOnly;

  // --- Aperçu des images
  function readPreview(input, imgEl) {
    if (!input || !imgEl) return;
    imgEl.style.display = 'none';
    const file = input.files && input.files[0];
    if (!file) { imgEl.src=''; return; }
    if (!file.type.startsWith('image/')) { imgEl.src=''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      imgEl.src = e.target.result;
      imgEl.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
  clientPhoto.addEventListener('change', () => readPreview(clientPhoto, clientPreview));
  agentPhoto.addEventListener('change', () => readPreview(agentPhoto, agentPreview));

  // --- Signature handling (setup for each canvas)
  function setupSignature(canvasId, hiddenInputId) {
    const canvas = document.getElementById(canvasId);
    const hidden = document.getElementById(hiddenInputId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // taille dynamique pour netteté
    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.4;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let drawing = false;
    let lastX = 0, lastY = 0;

    function getPointer(e) {
      if (e.touches && e.touches.length) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      } else {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      const p = getPointer(e);
      lastX = p.x; lastY = p.y;
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = getPointer(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    }
    function end(e) {
      if (!drawing) return;
      drawing = false;
    }

    // souris
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    // tactile
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end);

    // Effacer et sauvegarder via buttons avec attributs data-clear / data-save
    document.querySelectorAll(`[data-clear="${canvasId}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (hidden) hidden.value = '';
      });
    });
    document.querySelectorAll(`[data-save="${canvasId}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        // Convertit en dataURL (PNG)
        const dataUrl = canvas.toDataURL('image/png');
        if (hidden) hidden.value = dataUrl;
        // Indication utilisateur
        btn.textContent = 'Signature enregistrée';
        setTimeout(()=> btn.textContent = 'Enregistrer signature', 1500);
      });
    });

    // Pour éviter la soumission si pas de signature, on laisse champ hidden vide
  }

  setupSignature('sigClient', 'sigClientData');
  setupSignature('sigAgent', 'sigAgentData');

  // --- Validation additionnelle avant submit
  function validateSignatures() {
    const sigClient = document.getElementById('sigClientData').value;
    const sigAgent = document.getElementById('sigAgentData').value;
    if (!sigClient) {
      statusMessage.style.color = 'var(--danger, #b21)';
      statusMessage.textContent = 'La signature du client est requise. Cliquez sur "Enregistrer signature".';
      return false;
    }
    if (!sigAgent) {
      statusMessage.style.color = 'var(--danger, #b21)';
      statusMessage.textContent = "La signature de l'agent est requise. Cliquez sur \"Enregistrer signature\".";
      return false;
    }
    return true;
  }

  // --- Soumission (flux client-side)
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    statusMessage.style.color = '';
    statusMessage.textContent = '';

    // HTML5 validation native
    if (!form.checkValidity()) {
      // montre les erreurs
      form.reportValidity();
      return;
    }

    // Vérification signatures
    if (!validateSignatures()) return;

    // Toutes validations OK : afficher message "Veuillez attendre l'appel de confirmation"
    statusMessage.style.color = '';
    statusMessage.textContent = 'Veuillez attendre l\'appel de confirmation';
    // Désactiver bouton et champs sensibles pour éviter modifications
    document.getElementById('submitBtn').disabled = true;

    // Montre l'étape finale (bouton confirmer)
    finalStep.hidden = false;

    // Optionnel : ici tu peux préparer un FormData pour envoyer au serveur immédiatement
    // const fd = new FormData(form);
    // fetch('/api/payments', { method: 'POST', body: fd })
    //   .then(...).catch(...);

    // NOTE: on n'envoie rien automatiquement ici : on attend la confirmation manuelle via confirmPaymentBtn
  });

  // --- Confirmation finale (simulateur de paiement)
  confirmPaymentBtn.addEventListener('click', () => {
    // Ici tu peux effectuer l'appel final au backend (ex: exécuter le paiement)
    // Exemple (commenté) :
    /*
    const fd = new FormData(form);
    fetch('/api/confirm-payment', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(data => { // traiter la réponse
        statusMessage.textContent = 'Paiement confirmé. Réf: ' + data.transactionId;
      })
      .catch(err => {
        statusMessage.textContent = 'Erreur de confirmation : ' + err.message;
        document.getElementById('submitBtn').disabled = false;
      });
    */

    // Simulation côté client
    statusMessage.style.color = 'green';
    const txId = 'TX-' + Date.now().toString(36).slice(-8).toUpperCase();
    statusMessage.textContent = 'Confirmation du paiement réussie. Référence : ' + txId;

    // Masquer bouton confirmer, bloquer le formulaire
    confirmPaymentBtn.disabled = true;
    finalStep.hidden = true;
  });

  // --- Reset form : nettoyer aperçus et signatures cachées et messages
  document.getElementById('resetBtn').addEventListener('click', () => {
    clientPreview.src = '';
    agentPreview.src = '';
    statusMessage.textContent = '';
    document.getElementById('sigClientData').value = '';
    document.getElementById('sigAgentData').value = '';
    document.getElementById('submitBtn').disabled = false;
    finalStep.hidden = true;

    // Effacer canvases visuels (déclenche l'action effacer existante si présente)
    document.querySelectorAll('canvas').forEach(c => {
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,c.width,c.height);
    });
  });

})});
