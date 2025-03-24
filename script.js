async function main() {
  try {
    const [perguntas, perguntas2, perguntas3, config] = await Promise.all([
      d3.dsv(",", "perguntas.csv"), // Usar ; como delimitador
      d3.dsv(",", "perguntas2.csv"), // Usar ; como delimitador
      d3.dsv(",", "perguntas3.csv"), // Usar ; como delimitador
      fetch("config.json").then(response => response.json())
    ]);

    console.log("Perguntas:", perguntas);
    console.log("Perguntas2:", perguntas2);
    console.log("Perguntas3:", perguntas3);
    console.log("Config:", config);

    // Processar dados
    const dadosCombinados = combinarDados(perguntas, perguntas2, perguntas3);
    console.log("Dados Combinados:", dadosCombinados);

    // Criar interface
    criarFiltrosValoresUnicos(perguntas2); // Filtros baseados em valores únicos (perguntas2.csv)
    criarFiltrosBooleanos(perguntas3); // Filtros booleanos (perguntas3.csv)
    atualizarBolinhas(dadosCombinados, []);
    atualizarPerguntasFiltradas(dadosCombinados, []);

    // Eventos de filtro
    document.getElementById("filtros").addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON" && !event.target.classList.contains("desabilitado")) {
        const filtro = event.target.dataset.filtro;
        const valor = event.target.dataset.valor;

        // Alternar seleção do filtro
        event.target.classList.toggle("selecionado");

        // Obter filtros ativos
        const filtrosAtivos = obterFiltrosAtivos();

        // Atualizar bolinhas e perguntas
        atualizarBolinhas(dadosCombinados, filtrosAtivos);
        atualizarPerguntasFiltradas(dadosCombinados, filtrosAtivos);

        // Atualizar contagem nos filtros
        atualizarContagemFiltros(dadosCombinados, filtrosAtivos);
      }
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// Combinar dados dos três arquivos CSV
function combinarDados(perguntas, perguntas2, perguntas3) {
  return perguntas.map((pergunta, index) => {
    const pergunta2 = perguntas2[index] || {}; // Evitar erro se não houver correspondência
    const pergunta3 = perguntas3[index] || {}; // Evitar erro se não houver correspondência
    return {
      ...pergunta,
      ...pergunta2,
      ...pergunta3
    };
  });
}

// Criar filtros baseados em valores únicos (perguntas2.csv)
function criarFiltrosValoresUnicos(perguntas2) {
  const filtrosContainer = document.getElementById("filtros");

  if (!perguntas2 || !Array.isArray(perguntas2)) {
    console.error("perguntas2 não é um array válido:", perguntas2);
    return;
  }

  // Criar um grupo de filtros para cada coluna (exceto COD)
  Object.keys(perguntas2[0]).forEach(coluna => {
    if (coluna !== "COD") {
      const filtroDiv = document.createElement("div");
      filtroDiv.className = "filtro";

      // Título do grupo de filtros
      const titulo = document.createElement("h3");
      titulo.textContent = coluna;
      filtroDiv.appendChild(titulo);

      // Botões para valores únicos
      const valoresUnicos = obterValoresUnicos(perguntas2, coluna);
      valoresUnicos.forEach(valor => {
        const botao = document.createElement("button");
        botao.textContent = `${valor} (${contarPerguntas(perguntas2, coluna, valor)})`;
        botao.dataset.filtro = coluna;
        botao.dataset.valor = valor;
        filtroDiv.appendChild(botao);
      });

      filtrosContainer.appendChild(filtroDiv);
    }
  });
}

// Criar filtros booleanos (perguntas3.csv)
function criarFiltrosBooleanos(perguntas3) {
  const filtrosContainer = document.getElementById("filtros");

  if (!perguntas3 || !Array.isArray(perguntas3)) {
    console.error("perguntas3 não é um array válido:", perguntas3);
    return;
  }

  // Título do grupo de filtros
  const titulo = document.createElement("h3");
  titulo.textContent = "Classificação DSK";
  filtrosContainer.appendChild(titulo);

  // Criar um botão para cada coluna booleana (exceto COD)
  Object.keys(perguntas3[0]).forEach(coluna => {
    if (coluna !== "COD") {
      const botao = document.createElement("button");
      botao.textContent = `${coluna} (${contarPerguntas(perguntas3, coluna, "1")})`;
      botao.dataset.filtro = coluna;
      botao.dataset.valor = "1"; // Valor booleano (1)
      filtrosContainer.appendChild(botao);
    }
  });
}

function obterValoresUnicos(dados, coluna) {
  if (!dados || !Array.isArray(dados) || !coluna) {
    console.error("Dados ou coluna inválidos:", dados, coluna);
    return [];
  }

  const valores = dados.map(linha => linha[coluna]).filter((valor, index, self) => self.indexOf(valor) === index);
  return valores.filter(valor => valor); // Remover valores vazios
}

function contarPerguntas(dados, coluna, valor) {
  return dados.filter(linha => linha[coluna] === valor).length;
}

function obterFiltrosAtivos() {
  const botoesSelecionados = document.querySelectorAll("#filtros button.selecionado");
  return Array.from(botoesSelecionados).map(botao => ({
    filtro: botao.dataset.filtro,
    valor: botao.dataset.valor
  }));
}

function atualizarBolinhas(dados, filtrosAtivos) {
  const bolinhasContainer = document.getElementById("bolinhas");
  bolinhasContainer.innerHTML = "";

  dados.forEach((pergunta) => {
    const bolinha = document.createElement("div");
    bolinha.className = "bolinha";
    bolinha.textContent = pergunta.COD; // Usar COD em vez do índice
    bolinha.dataset.cod = pergunta.COD; // Armazenar COD para referência

    // Verificar se a pergunta passa pelos filtros
    if (passaFiltros(pergunta, filtrosAtivos)) {
      bolinha.classList.add("ativa");
      
      // Evento para highlight ao passar o mouse
      bolinha.addEventListener("mouseover", () => {
        highlightPergunta(pergunta.COD);
      });
      
      bolinha.addEventListener("mouseout", () => {
        removeHighlight();
      });
    } else {
      bolinha.classList.add("inativa");
    }

    bolinhasContainer.appendChild(bolinha);
  });
}

function highlightPergunta(cod) {
  const perguntas = document.querySelectorAll('#lista-perguntas li');
  perguntas.forEach(li => {
    if (li.dataset.cod === cod) {
      li.classList.add('destaque');
    }
  });
}

function removeHighlight() {
  document.querySelectorAll('#lista-perguntas li.destaque').forEach(li => {
    li.classList.remove('destaque');
  });
}

function passaFiltros(pergunta, filtrosAtivos) {
  return filtrosAtivos.every(filtro => {
    if (filtro.valor === "1") {
      // Filtro booleano (Classificação DSK)
      return pergunta[filtro.filtro] === "1";
    } else {
      // Filtro baseado em valores únicos
      return pergunta[filtro.filtro] === filtro.valor;
    }
  });
}

function atualizarPerguntasFiltradas(dados, filtrosAtivos) {
  const listaPerguntas = document.getElementById("lista-perguntas");
  listaPerguntas.innerHTML = "";

  const perguntasFiltradas = dados.filter(pergunta => passaFiltros(pergunta, filtrosAtivos));
  perguntasFiltradas.forEach((pergunta) => {
    const li = document.createElement("li");
    li.dataset.cod = pergunta.COD; // Armazenar COD no elemento li
    const numeroQuestao = document.createElement("span");
    numeroQuestao.className = "numero-questao";
    numeroQuestao.textContent = `${pergunta.COD}.`; // Usar COD em vez do índice
    li.appendChild(numeroQuestao);
    li.appendChild(document.createTextNode(` ${pergunta.QUESTAO}`));
    listaPerguntas.appendChild(li);
  });
}

function atualizarContagemFiltros(dadosCombinados, filtrosAtivos) {
  const botoesFiltro = document.querySelectorAll("#filtros button");
  botoesFiltro.forEach(botao => {
    const filtro = botao.dataset.filtro;
    const valor = botao.dataset.valor;

    // Filtrar perguntas que passam pelos filtros ativos
    const perguntasFiltradas = dadosCombinados.filter(pergunta =>
      filtrosAtivos.every(f => {
        if (f.valor === "1") {
          // Filtro booleano (Classificação DSK)
          return pergunta[f.filtro] === "1";
        } else {
          // Filtro baseado em valores únicos
          return pergunta[f.filtro] === f.valor;
        }
      })
    );

    // Contar perguntas que correspondem ao valor do filtro
    const contagem = perguntasFiltradas.filter(pergunta => {
      if (valor === "1") {
        // Filtro booleano (Classificação DSK)
        return pergunta[filtro] === "1";
      } else {
        // Filtro baseado em valores únicos
        return pergunta[filtro] === valor;
      }
    }).length;

    // Atualizar texto do botão
    botao.textContent = `${filtro}${valor === "1" ? "" : `: ${valor}`} (${contagem})`;

    // Desabilitar botão se a contagem for 0
    if (contagem === 0) {
      botao.classList.add("desabilitado");
      botao.disabled = true;
    } else {
      botao.classList.remove("desabilitado");
      botao.disabled = false;
    }
  });
}

// Iniciar aplicação
main();