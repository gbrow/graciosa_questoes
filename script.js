const ballsContainer = document.getElementById("balls-container");
const groupFilter = document.getElementById("group-filter");
const themeFilter = document.getElementById("theme-filter");
const originFilter = document.getElementById("origin-filter");
const csvUpload = document.getElementById("csv-upload");

let questions = [];

// Função para carregar o CSV manualmente
csvUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const csvData = e.target.result;
      parseCSV(csvData);
    };
    reader.readAsText(file, "UTF-8"); // Força a leitura como UTF-8
  }
});

// Função para carregar o CSV automaticamente (se estiver no servidor)
function loadCSV() {
  Papa.parse("perguntas.csv", {
    download: true,
    header: true,
    delimiter: ";",
    encoding: "UTF-8", // Garante a codificação UTF-8
    complete: function (results) {
      questions = results.data;
      populateFilters();
      renderBalls();
    },
    error: function (err) {
      console.error("Erro ao carregar o CSV:", err);
    },
  });
}

// Função para processar o CSV
function parseCSV(csvData) {
  Papa.parse(csvData, {
    header: true,
    delimiter: ";",
    encoding: "UTF-8", // Garante a codificação UTF-8
    complete: function (results) {
      questions = results.data;
      populateFilters();
      renderBalls();
    },
    error: function (err) {
      console.error("Erro ao processar o CSV:", err);
    },
  });
}

// Função para popular os filtros
function populateFilters() {
  const groups = [...new Set(questions.map(q => q.TEMA))];
  const themes = [...new Set(questions.map(q => q.SUBTEMA))];
  const origins = [...new Set(questions.map(q => q.ORIGEM))];

  populateFilter(groupFilter, groups);
  populateFilter(themeFilter, themes);
  populateFilter(originFilter, origins);
}

// Função para adicionar opções aos filtros
function populateFilter(filter, options) {
  filter.innerHTML = '<option value="all">Todos</option>'; // Reseta o filtro
  options.forEach(option => {
    if (option) {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      filter.appendChild(optionElement);
    }
  });
}

// Função para renderizar as bolas
function renderBalls() {
  const selectedGroup = groupFilter.value;
  const selectedTheme = themeFilter.value;
  const selectedOrigin = originFilter.value;

  ballsContainer.innerHTML = "";

  questions.forEach(q => {
    const ball = document.createElement("div");
    ball.className = "ball";
    ball.textContent = q.COD;
    ball.setAttribute("data-question", q.QUESTAO);
    ball.setAttribute("data-group", q.TEMA);
    ball.setAttribute("data-theme", q.SUBTEMA);
    ball.setAttribute("data-origin", q.ORIGEM);

    // Verifica se a bola deve ficar ativa ou inativa
    if (
      (selectedGroup !== "all" && q.TEMA !== selectedGroup) ||
      (selectedTheme !== "all" && q.SUBTEMA !== selectedTheme) ||
      (selectedOrigin !== "all" && q.ORIGEM !== selectedOrigin)
    ) {
      ball.classList.add("inactive");
    }

    ballsContainer.appendChild(ball);
  });
}

// Event listeners para os filtros
groupFilter.addEventListener("change", renderBalls);
themeFilter.addEventListener("change", renderBalls);
originFilter.addEventListener("change", renderBalls);

// Carrega os dados do CSV ao iniciar (se estiver no servidor)
loadCSV();