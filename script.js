const filtersContainer = document.getElementById("filters");
const ballsContainer = document.getElementById("balls-container");

let questions = [];
let filters = {};
let config = {}; // Armazenará o mapeamento do JSON

// Função para carregar o JSON de configuração
async function loadConfig() {
  try {
    const response = await fetch("config.json");
    config = await response.json();
    loadCSV(); // Carrega o CSV após carregar o JSON
  } catch (err) {
    console.error("Erro ao carregar o arquivo de configuração:", err);
  }
}

// Função para carregar o CSV
function loadCSV() {
  Papa.parse("perguntas.csv", {
    download: true,
    header: true,
    delimiter: ";",
    encoding: "UTF-8",
    complete: function (results) {
      questions = results.data;
      createFilters(results.meta.fields); // Cria os filtros com base nas colunas
      renderBalls();
    },
    error: function (err) {
      console.error("Erro ao carregar o CSV:", err);
    },
  });
}

// Função para criar os filtros dinamicamente
function createFilters(columns) {
  filtersContainer.innerHTML = ""; // Limpa os filtros existentes

  columns.forEach(column => {
    if (column !== "COD" && column !== "QUESTAO") { // Ignora colunas específicas
      // Verifica se o filtro está habilitado no JSON
      if (config[column]?.enabled) {
        const filterId = `${column.toLowerCase()}-filter`;

        const filterGroup = document.createElement("div");
        filterGroup.className = "filter-group";

        const filterLabel = document.createElement("label");
        filterLabel.setAttribute("for", filterId);

        // Usa o mapeamento do JSON para o rótulo
        const labelText = config[column]?.label || column;
        filterLabel.textContent = labelText;

        // Adiciona o ícone de tooltip
        //if (config[column]?.description) {
          //const tooltipIcon = document.createElement("span");
          //tooltipIcon.className = "tooltip-icon";
          //tooltipIcon.setAttribute("data-tooltip", config[column].description);
          //tooltipIcon.textContent = "ⓘ"; // Ícone de informação
          //filterLabel.appendChild(tooltipIcon);
        //}

        // Cria o filtro com base no tipo especificado no JSON
        if (config[column].type === "list") {
          const filterSelect = document.createElement("select");
          filterSelect.id = filterId;
          filterSelect.innerHTML = '<option value="all">Todos</option>';

          filterGroup.appendChild(filterLabel);
          filterGroup.appendChild(filterSelect);
          filtersContainer.appendChild(filterGroup);

          // Adiciona event listener para atualizar os filtros
          filterSelect.addEventListener("change", () => {
            filters[column] = filterSelect.value;
            updateFilters();
            renderBalls();
          });
        } else if (config[column].type === "checkbox") {
          const filterCheckbox = document.createElement("input");
          filterCheckbox.type = "checkbox";
          filterCheckbox.id = filterId;

          filterGroup.appendChild(filterLabel);
          filterGroup.appendChild(filterCheckbox);
          filtersContainer.appendChild(filterGroup);

          // Adiciona event listener para atualizar os filtros
          filterCheckbox.addEventListener("change", () => {
            filters[column] = filterCheckbox.checked ? "1" : "all";
            updateFilters();
            renderBalls();
          });
        }

        // Inicializa o filtro com valor "all"
        filters[column] = "all";
      }
    }
  });

  updateFilterOptions(); // Atualiza as opções dos filtros
}

// Função para atualizar as opções dos filtros com base nas seleções
function updateFilters() {
  const filteredQuestions = questions.filter(q => {
    return Object.keys(filters).every(key => {
      return filters[key] === "all" || q[key] === filters[key];
    });
  });

  updateFilterOptions(filteredQuestions);
}

// Função para atualizar as opções de cada filtro
function updateFilterOptions(filteredQuestions = questions) {
  const filterSelects = filtersContainer.querySelectorAll("select");

  filterSelects.forEach(filterSelect => {
    const column = filterSelect.id.replace("-filter", "").toUpperCase();
    const currentValue = filterSelect.value;

    const uniqueValues = [...new Set(filteredQuestions.map(q => q[column]))];
    filterSelect.innerHTML = '<option value="all">Todos</option>';

    uniqueValues.forEach(value => {
      if (value) {
        const optionElement = document.createElement("option");
        optionElement.value = value;
        optionElement.textContent = value;
        filterSelect.appendChild(optionElement);
      }
    });

    // Mantém a seleção atual, se ainda estiver disponível
    if (uniqueValues.includes(currentValue)) {
      filterSelect.value = currentValue;
    } else {
      filterSelect.value = "all";
      filters[column] = "all";
    }
  });
}

// Função para renderizar as bolas
function renderBalls() {
  ballsContainer.innerHTML = "";

  questions.forEach(q => {
    const ball = document.createElement("div");
    ball.className = "ball";
    ball.textContent = q.COD;
    ball.setAttribute("data-question", q.QUESTAO);

    // Verifica se a bola deve ficar ativa ou inativa
    const isActive = Object.keys(filters).every(key => {
      return filters[key] === "all" || q[key] === filters[key];
    });

    if (!isActive) {
      ball.classList.add("inactive");
    }

    ballsContainer.appendChild(ball);
  });
}

// Carrega o JSON de configuração ao iniciar
loadConfig();
