let map = null;
let marker = null;

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

const modal = document.getElementById("post-modal");

function openModal() {
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(initMap, 200);
  }
}

function closeModal() {
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";

    const form = document.getElementById("form-cartaz");
    if (form) form.reset();

    if (marker && map) {
      map.removeLayer(marker);
      marker = null;
    }
  }
}

function initMap() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  if (map !== null) {
    map.invalidateSize();
    return;
  }

  map = L.map("map").setView([-22.82, -47.26], 8);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ",
    },
  ).addTo(map);

  function placeMarker(lat, lng) {
    if (marker) {
      map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map);

    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
  }

  map.on("click", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    placeMarker(lat, lng);

    const inputLocation = document.getElementById("location");
    if (inputLocation) {
      inputLocation.value = "Buscando endereço...";

      fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lng},${lat}`,
      )
        .then((response) => response.json())
        .then((data) => {
          if (data && data.address && data.address.Match_addr) {
            inputLocation.value = data.address.Match_addr;
          } else {
            inputLocation.value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          }
        })
        .catch((err) => {
          console.error("Erro no endereço:", err);
          inputLocation.value = "Localização marcada no mapa";
        });
    }
  });

  const btnBuscar = document.getElementById("btn-buscar-cep");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", function () {
      const query = document.getElementById("location")?.value;
      if (!query || query === "Buscando endereço...") {
        showMessage("Digite um endereço para buscar.");
        return;
      }

      fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(query)}&outFields=Match_addr`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Erro na requisição");
          return response.json();
        })
        .then((data) => {
          if (data && data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            const lat = candidate.location.y;
            const lng = candidate.location.x;

            map.setView([lat, lng], 15);
            placeMarker(lat, lng);

            document.getElementById("location").value =
              candidate.address || query;
          } else {
            showMessage(
              "Endereço não encontrado. Tente incluir cidade e estado.",
            );
          }
        })
        .catch((err) => {
          console.error("Erro na busca de local:", err);
          showMessage("Erro ao consultar serviço de mapas.");
        });
    });
  }

  setTimeout(() => map.invalidateSize(), 300);
}

function openWhatsApp(phone, animalName, status) {
  if (!phone) {
    showMessage("Telefone de contato não informado.");
    return;
  }

  let cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = "55" + cleanPhone;
  }

  const statusTexto = status === "perdido" ? "perdido" : "visto/encontrado";
  const message = `Olá! Vi seu cartaz no *PI ANIMAL* sobre o animal *${animalName}* (${statusTexto}) e gostaria de mais informações.`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

function filterPosts(status) {
  const cards = document.querySelectorAll(".post-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const cardStatus = card.getAttribute("data-status");
    if (status === "todos" || cardStatus === status) {
      card.style.display = "flex";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  const noResultsMsg = document.getElementById("no-filter-results");
  if (noResultsMsg) {
    if (visibleCount === 0 && cards.length > 0) {
      noResultsMsg.classList.remove("hidden");
    } else {
      noResultsMsg.classList.add("hidden");
    }
  }

  const btnTodos = document.getElementById("btn-filter-todos");
  const btnVisto = document.getElementById("btn-filter-visto");
  const btnPerdido = document.getElementById("btn-filter-perdido");

  const defaultBtnClass =
    "px-4 py-1.5 rounded-full cursor-pointer transition bg-white text-gray-700 border border-gray-200";

  if (btnTodos)
    btnTodos.className =
      status === "todos"
        ? "px-4 py-1.5 rounded-full cursor-pointer transition bg-brand-orange text-white shadow-sm"
        : defaultBtnClass;
  if (btnVisto)
    btnVisto.className =
      status === "visto"
        ? "px-4 py-1.5 rounded-full cursor-pointer transition bg-status-found text-white shadow-sm"
        : defaultBtnClass;
  if (btnPerdido)
    btnPerdido.className =
      status === "perdido"
        ? "px-4 py-1.5 rounded-full cursor-pointer transition bg-status-lost text-white shadow-sm"
        : defaultBtnClass;
}

function showMessage(msg) {
  const msgBox = document.createElement("div");
  msgBox.className =
    "fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-[60] animate-fadeIn transition-opacity duration-300";
  msgBox.innerHTML = `<i class="fas fa-info-circle mr-2 text-brand-orange"></i> ${escapeHTML(msg)}`;
  document.body.appendChild(msgBox);

  setTimeout(() => {
    msgBox.style.opacity = "0";
    setTimeout(() => msgBox.remove(), 300);
  }, 3000);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.initMap = initMap;
window.openWhatsApp = openWhatsApp;
window.filterPosts = filterPosts;

// ==========================================
// CONTROLE DE ACESSIBILIDADE (LUPA & CONTRASTE)
// ==========================================

let currentZoom = parseInt(localStorage.getItem("user_zoom")) || 100;
let isHighContrast = localStorage.getItem("user_contrast") === "true";

// Aplica o nível de zoom na raiz do documento
function applyZoom() {
  document.documentElement.style.fontSize = currentZoom + "%";
  localStorage.setItem("user_zoom", currentZoom);
}

// Aumenta (+1) ou diminui (-1) o zoom em passos de 10% (Limite: 90% a 150%)
function changeZoom(delta) {
  currentZoom += delta * 10;
  if (currentZoom < 90) currentZoom = 90;
  if (currentZoom > 140) currentZoom = 140;
  applyZoom();
}

// Restaura o tamanho original de 100%
function resetZoom() {
  currentZoom = 100;
  applyZoom();
}

// Modo Alto Contraste
function applyContrast() {
  if (isHighContrast) {
    document.body.classList.add("contrast-mode");
  } else {
    document.body.classList.remove("contrast-mode");
  }
  localStorage.setItem("user_contrast", isHighContrast);
}

function toggleContrast() {
  isHighContrast = !isHighContrast;
  applyContrast();
}

// Carrega as preferências salvas assim que a página é carregada
document.addEventListener("DOMContentLoaded", function () {
  applyZoom();
  applyContrast();
});

// Torna as funções acessíveis globalmente nos botões HTML
window.changeZoom = changeZoom;
window.resetZoom = resetZoom;
window.toggleContrast = toggleContrast;
