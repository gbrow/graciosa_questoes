async function main() {
  try {
    const [perguntas, perguntas2, perguntas3, config] = await Promise.all([
      d3.dsv(";", "perguntas.csv"), // Usar ; como delimitador
      d3.dsv(";", "perguntas2.csv"), // Usar ; como delimitador
      d3.dsv(";", "perguntas3.csv"), // Usar ; como delimitador
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
    criarFiltros(config, perguntas3);
    atualizarBolinhas(dadosCombinados, []);
    atualizarPerguntasFiltradas(dadosCombinados, []);

    // Eventos de filtro
    document.getElementById("filtros").addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
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
        atualizarContagemFiltros(perguntas3, filtrosAtivos);
      }
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

function combinarDados(perguntas, perguntas2, perguntas3) {
  return perguntas.map((pergunta, index) => ({
    ...pergunta,
    ...perguntas2[index],
    ...perguntas3[index]
  }));
}

function criarFiltros(config, perguntas3) {
  const filtrosContainer = document.getElementById("filtros");

  if (!perguntas3 || !Array.isArray(perguntas3)) {
    console.error("perguntas3 não é um array válido:", perguntas3);
    return;
  }

  config.filtros.forEach(filtro => {
    if (filtro.enabled) {
      const filtroDiv = document.createElement("div");
      filtroDiv.className = "filtro";

      // Título e descrição do filtro
      const titulo = document.createElement("h3");
      titulo.textContent = filtro.label;
      filtroDiv.appendChild(titulo);

      // Botões para valores únicos
      const valoresUnicos = obterValoresUnicos(perguntas3, filtro.id);
      valoresUnicos.forEach(valor => {
        const botao = document.createElement("button");
        botao.textContent = `${valor} (${contarPerguntas(perguntas3, filtro.id, valor)})`;
        botao.dataset.filtro = filtro.id;
        botao.dataset.valor = valor;
        filtroDiv.appendChild(botao);
      });

      filtrosContainer.appendChild(filtroDiv);
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

  dados.forEach((pergunta, index) => {
    const bolinha = document.createElement("div");
    bolinha.className = "bolinha";
    bolinha.textContent = index + 1; // Número da questão

    // Verificar se a pergunta passa pelos filtros
    if (passaFiltros(pergunta, filtrosAtivos)) {
      bolinha.classList.add("ativa");
    } else {
      bolinha.classList.add("inativa");
    }

    bolinhasContainer.appendChild(bolinha);
  });
}

function passaFiltros(pergunta, filtrosAtivos) {
  return filtrosAtivos.every(filtro => pergunta[filtro.filtro] === filtro.valor);
}

function atualizarPerguntasFiltradas(dados, filtrosAtivos) {
  const listaPerguntas = document.getElementById("lista-perguntas");
  listaPerguntas.innerHTML = "";

  const perguntasFiltradas = dados.filter(pergunta => passaFiltros(pergunta, filtrosAtivos));
  perguntasFiltradas.forEach((pergunta, index) => {
    const li = document.createElement("li");
    const numeroQuestao = document.createElement("span");
    numeroQuestao.className = "numero-questao";
    numeroQuestao.textContent = `${index + 1}.`;
    li.appendChild(numeroQuestao);
    li.appendChild(document.createTextNode(` ${pergunta.QUESTAO}`));
    listaPerguntas.appendChild(li);
  });
}

function atualizarContagemFiltros(perguntas3, filtrosAtivos) {
  const botoesFiltro = document.querySelectorAll("#filtros button");
  botoesFiltro.forEach(botao => {
    const filtro = botao.dataset.filtro;
    const valor = botao.dataset.valor;

    // Filtrar perguntas que passam pelos filtros ativos
    const perguntasFiltradas = perguntas3.filter(pergunta =>
      filtrosAtivos.every(f => pergunta[f.filtro] === f.valor)
    );

    // Contar perguntas que correspondem ao valor do filtro
    const contagem = perguntasFiltradas.filter(pergunta => pergunta[filtro] === valor).length;

    // Atualizar texto do botão
    botao.textContent = `${valor} (${contagem})`;
  });
}

// Iniciar aplicação
main();