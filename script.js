// Variável global para armazenar os dados
let dadosCombinados = [];
let perguntas2 = [];
let perguntas3 = [];
let alteracoesPendentes = 0;
let dadosEditados = {
  perguntas2: null,
  perguntas3: null
};

async function main() {
  try {
    [perguntas, perguntas2, perguntas3, config] = await Promise.all([
      d3.dsv(",", "perguntas.csv"),
      d3.dsv(",", "perguntas2.csv"),
      d3.dsv(",", "perguntas3.csv"),
      fetch("config.json").then(response => response.json())
    ]);

    dadosCombinados = combinarDados(perguntas, perguntas2, perguntas3);
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
    const modal = document.getElementById("modal-edicao");
    const span = document.querySelector(".fechar-modal");

    span.onclick = function() {
      modal.style.display = "none";
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    document.getElementById("form-edicao").onsubmit = function(e) {
      e.preventDefault();
      salvarEdicao();
    };

    // Configurar o botão de salvar
    document.getElementById('btn-salvar').addEventListener('click', exportarParaCSV);

    // Inicializar contador
    atualizarContador();
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

      // Obter todos os valores únicos (incluindo os de campos com múltiplos valores)
      const todosValores = perguntas2.flatMap(linha => 
        linha[coluna] ? linha[coluna].split('|').map(v => v.trim()) : []
      );
      const valoresUnicos = [...new Set(todosValores)].filter(v => v);

      // Botões para valores únicos
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
  if (!dados || !Array.isArray(dados) || !coluna) return [];

  // Obter todos os valores individuais (separados por |)
  const todosValores = dados.flatMap(linha => 
    linha[coluna] ? linha[coluna].split('|').map(v => v.trim()) : []
  );

  // Filtrar valores vazios e duplicados (case insensitive)
  const valoresUnicos = [...new Set(todosValores)]
    .filter(v => v)
    .sort((a, b) => a.localeCompare(b));

  return valoresUnicos;
}

function contarPerguntas(dados, coluna, valor) {
  return dados.reduce((count, linha) => {
    try {
      if (!linha[coluna]) return count;
      const valores = linha[coluna].split('|').map(v => v.trim());
      return valores.includes(valor) ? count + 1 : count;
    } catch (e) {
      console.error("Erro ao contar perguntas:", e);
      return count;
    }
  }, 0);
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
    bolinha.textContent = pergunta.COD;
    bolinha.dataset.cod = pergunta.COD;

    if (passaFiltros(pergunta, filtrosAtivos)) {
      bolinha.classList.add("ativa");
      
      // Evento para highlight
      bolinha.addEventListener("mouseover", () => highlightPergunta(pergunta.COD));
      bolinha.addEventListener("mouseout", removeHighlight);
      
      // Evento para edição
      bolinha.addEventListener("click", () => abrirModalEdicao(pergunta.COD));
    } else {
      bolinha.classList.add("inativa");
    }

    bolinhasContainer.appendChild(bolinha);
  });
}

// Função para atualizar o contador
function atualizarContador() {
  const contador = document.getElementById('contador-edicoes');
  contador.textContent = `${alteracoesPendentes} alteração${alteracoesPendentes !== 1 ? 'ões' : ''} pendente${alteracoesPendentes !== 1 ? 's' : ''}`;
  
  const btnSalvar = document.getElementById('btn-salvar');
  btnSalvar.disabled = alteracoesPendentes === 0;
}

function abrirModalEdicao(cod) {
  const pergunta = dadosCombinados.find(p => p.COD === cod);
  const modal = document.getElementById("modal-edicao");
  const camposFiltros = document.getElementById("campos-filtros");
  
  document.getElementById("modal-cod").textContent = cod;
  camposFiltros.innerHTML = '';

  const fieldGroups = {
    "Classificação Principal": Object.keys(perguntas2[0]).filter(col => col !== "COD"),
    "Classificação DSK": Object.keys(perguntas3[0]).filter(col => col !== "COD")
  };

  for (const [groupName, columns] of Object.entries(fieldGroups)) {
    if (columns.length > 0) {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = groupName;
      fieldset.appendChild(legend);
      
      columns.forEach(coluna => {
        const div = document.createElement("div");
        
        if (groupName.includes("DSK")) {
          // Campo booleano
          div.innerHTML = `
            <label for="${coluna}">${coluna}</label>
            <select id="${coluna}" name="${coluna}">
              <option value="0" ${pergunta[coluna] === "0" ? 'selected' : ''}>Não</option>
              <option value="1" ${pergunta[coluna] === "1" ? 'selected' : ''}>Sim</option>
            </select>
          `;
        } else {
          // Campo com valores múltiplos
          const valoresExistentes = obterValoresUnicos(perguntas2, coluna);
          const valoresAtuais = pergunta[coluna] ? 
            pergunta[coluna].split('|').map(v => v.trim()) : [];

          valoresAtuais.forEach(valor => {
            if (!valoresExistentes.includes(valor)) {
              valoresExistentes.push(valor);
            }
          });
          
          div.innerHTML = `
            <label for="${coluna}">${coluna}</label>
            <select id="${coluna}" name="${coluna}" multiple style="height:100px">
              ${valoresExistentes.map(valor => 
                `<option value="${valor}" ${valoresAtuais.includes(valor) ? 'selected' : ''}>${valor}</option>`
              ).join('')}
            </select>
            <div class="adicionar-valor">
              <input type="text" id="novo-${coluna}" placeholder="Novo valor">
              <button type="button" onclick="adicionarValor('${coluna}')">+</button>
            </div>
          `;
        }
        
        fieldset.appendChild(div);
      });
      
      camposFiltros.appendChild(fieldset);
    }
  }

  modal.style.display = "block";
}

// Função para adicionar novo valor
function adicionarValor(coluna) {
  const novoValorInput = document.getElementById(`novo-${coluna}`);
  const novoValor = novoValorInput.value.trim();
  
  if (novoValor) {
    const select = document.getElementById(coluna);
    
    // Verificar se o valor já existe (case insensitive)
    const valorExiste = Array.from(select.options).some(opt => 
      opt.value.toLowerCase() === novoValor.toLowerCase()
    );
    
    if (valorExiste) {
      alert("Este valor já existe!");
      return;
    }

    // Adicionar nova opção e selecionar
    const option = document.createElement("option");
    option.value = novoValor;
    option.textContent = novoValor;
    option.selected = true;
    select.appendChild(option);
    novoValorInput.value = '';
    
    // Atualizar dados na memória
    const cod = document.getElementById("modal-cod").textContent;
    const perguntaIndex = dadosCombinados.findIndex(p => p.COD === cod);
    
    // Obter valores atuais (sem duplicatas)
    const valoresAtuais = dadosCombinados[perguntaIndex][coluna] ? 
      [...new Set(dadosCombinados[perguntaIndex][coluna].split('|').map(v => v.trim()))] : [];
    
    // Adicionar novo valor se não existir
    if (!valoresAtuais.some(v => v.toLowerCase() === novoValor.toLowerCase())) {
      valoresAtuais.push(novoValor);
      dadosCombinados[perguntaIndex][coluna] = valoresAtuais.join('|');
      
      // Atualizar perguntas2
      const pergunta2Index = perguntas2.findIndex(p => p.COD === cod);
      perguntas2[pergunta2Index][coluna] = valoresAtuais.join('|');
    }

    // Atualizar filtros
    atualizarListaFiltros(coluna, novoValor);
  }
}
function atualizarListaFiltros(coluna, novoValor) {
  const filtrosContainer = document.getElementById("filtros");
  const filtroDivs = filtrosContainer.querySelectorAll('.filtro');
  
  for (const filtroDiv of filtroDivs) {
    const titulo = filtroDiv.querySelector('h3');
    if (titulo && titulo.textContent === coluna) {
      // Verificar se o valor já existe (case insensitive)
      const botaoExistente = Array.from(filtroDiv.querySelectorAll('button'))
        .find(b => b.dataset.valor.toLowerCase() === novoValor.toLowerCase());
      
      if (!botaoExistente) {
        // Criar novo botão para o valor
        const novoBotao = document.createElement("button");
        novoBotao.textContent = `${novoValor} (${contarPerguntas(perguntas2, coluna, novoValor)})`;
        novoBotao.dataset.filtro = coluna;
        novoBotao.dataset.valor = novoValor;
        
        // Inserir em ordem alfabética
        const botoes = Array.from(filtroDiv.querySelectorAll('button'));
        let inserido = false;
        
        for (let i = 0; i < botoes.length; i++) {
          if (novoValor.localeCompare(botoes[i].dataset.valor) < 0) {
            filtroDiv.insertBefore(novoBotao, botoes[i]);
            inserido = true;
            break;
          }
        }
        
        if (!inserido) {
          filtroDiv.appendChild(novoBotao);
        }
      }
      
      break;
    }
  }
}
function salvarEdicao() {
  const cod = document.getElementById("modal-cod").textContent;
  const form = document.getElementById("form-edicao");
  
  // Registrar alterações
  if (!dadosEditados.perguntas2) dadosEditados.perguntas2 = [...perguntas2];
  if (!dadosEditados.perguntas3) dadosEditados.perguntas3 = [...perguntas3];
  
  const pergunta2Index = perguntas2.findIndex(p => p.COD === cod);
  const pergunta3Index = perguntas3.findIndex(p => p.COD === cod);

  // Atualizar campos de perguntas2 (valores múltiplos)
  Object.keys(perguntas2[0]).forEach(coluna => {
    if (coluna !== "COD") {
      const select = document.getElementById(coluna);
      if (select) {
        if (select.multiple) {
          // Para campos múltiplos, juntar valores selecionados
          const selectedValues = Array.from(select.selectedOptions)
            .map(opt => opt.value)
            .filter(v => v); // Remover valores vazios
          
          perguntas2[pergunta2Index][coluna] = selectedValues.join('|');
        } else {
          perguntas2[pergunta2Index][coluna] = select.value;
        }
      }
    }
  });

  // Atualizar campos booleanos de perguntas3
  Object.keys(perguntas3[0]).forEach(coluna => {
    if (coluna !== "COD") {
      const select = document.getElementById(coluna);
      if (select) {
        perguntas3[pergunta3Index][coluna] = select.value;
      }
    }
  });

  // Atualizar dados combinados
  dadosCombinados = combinarDados(perguntas, perguntas2, perguntas3);
  
  // Forçar atualização completa da interface
  const filtrosAtivos = obterFiltrosAtivos();
  atualizarBolinhas(dadosCombinados, filtrosAtivos);
  atualizarPerguntasFiltradas(dadosCombinados, filtrosAtivos);
  atualizarContagemFiltros(dadosCombinados, filtrosAtivos);
  
  alteracoesPendentes++;
  atualizarContador();
  
  // Fechar modal
  document.getElementById("modal-edicao").style.display = "none";
}

function exportarParaCSV() {
  const dados = dadosEditados.perguntas2 ? dadosEditados : {
    perguntas2: perguntas2,
    perguntas3: perguntas3
  };

  const perguntas2CSV = [
    Object.keys(dados.perguntas2[0]).join(","),
    ...dados.perguntas2.map(obj => 
      Object.values(obj).map(v => `"${v}"`).join(",")
    )
  ].join("\n");

  const perguntas3CSV = [
    Object.keys(dados.perguntas3[0]).join(","),
    ...dados.perguntas3.map(obj => 
      Object.values(obj).map(v => `"${v}"`).join(",")
    )
  ].join("\n");

  criarDownload(perguntas2CSV, "perguntas2_editado.csv");
  criarDownload(perguntas3CSV, "perguntas3_editado.csv");
  
  // Resetar contador após salvamento
  alteracoesPendentes = 0;
  dadosEditados = { perguntas2: null, perguntas3: null };
  atualizarContador();
}

function criarDownload(conteudo, nomeArquivo) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function salvarCSVs() {
  // Simulação - na prática isso exigiria um backend
  console.log("Dados atualizados (simulação):");
  console.log("perguntas2.csv:", perguntas2);
  console.log("perguntas3.csv:", perguntas3);
  
  // Em um ambiente real, você precisaria enviar para um servidor:
  // fetch('/salvar-perguntas2', { method: 'POST', body: JSON.stringify(perguntas2) })
  // fetch('/salvar-perguntas3', { method: 'POST', body: JSON.stringify(perguntas3) })
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
  if (!filtrosAtivos.length) return true;
  
  return filtrosAtivos.every(filtro => {
    try {
      if (filtro.valor === "1") {
        return pergunta[filtro.filtro] === "1";
      } else {
        if (!pergunta[filtro.filtro]) return false;
        return pergunta[filtro.filtro]
          .split('|')
          .map(v => v.trim())
          .includes(filtro.valor);
      }
    } catch (e) {
      console.error("Erro ao processar filtro:", e);
      return false;
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
          return pergunta[f.filtro] === "1";
        } else {
          if (!pergunta[f.filtro]) return false;
          const valores = pergunta[f.filtro].split('|').map(v => v.trim());
          return valores.includes(f.valor);
        }
      })
    );

    // Contar perguntas que correspondem ao valor do filtro atual
    const contagem = perguntasFiltradas.filter(pergunta => {
      if (valor === "1") {
        return pergunta[filtro] === "1";
      } else {
        if (!pergunta[filtro]) return false;
        const valores = pergunta[filtro].split('|').map(v => v.trim());
        return valores.includes(valor);
      }
    }).length;

    // Atualizar texto do botão mantendo o formato original
    const textoOriginal = botao.textContent.split('(')[0].trim();
    botao.textContent = `${textoOriginal} (${contagem})`;

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