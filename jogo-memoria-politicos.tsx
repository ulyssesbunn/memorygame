"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase, isSupabaseAvailable, type RankingEntry } from "./lib/supabase"

interface CartaPolitico {
  id: number
  politico: string
  nome: string
  partido: string
  virada: boolean
  encontrada: boolean
}

// Função para embaralhar array (movida para fora do componente)
function embaralharArray<T>(array: T[]): T[] {
  const novoArray = [...array]
  for (let i = novoArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[novoArray[i], novoArray[j]] = [novoArray[j], novoArray[i]]
  }
  return novoArray
}

export default function Component() {
  const politicos = [
    { politico: "🍺", nome: "Lula", partido: "PT" },
    { politico: "⚡", nome: "Bolsonaro", partido: "PL" },
    { politico: "🌹", nome: "Dilma", partido: "PT" },
    { politico: "📚", nome: "FHC", partido: "PSDB" },
    { politico: "🏛️", nome: "Temer", partido: "MDB" },
    { politico: "💰", nome: "Collor", partido: "PRN" },
    { politico: "🎭", nome: "Sarney", partido: "PMDB" },
    { politico: "⚖️", nome: "Itamar", partido: "PMDB" },
    { politico: "🚁", nome: "Ciro", partido: "PDT" },
    { politico: "🌿", nome: "Marina", partido: "REDE" },
    { politico: "📖", nome: "Ulysses", partido: "MDB" },
    { politico: "💣", nome: "Eneas", partido: "PRONA" },
    { politico: "⛓️", nome: "Xandão", partido: "STF" },
    { politico: "❄️", nome: "Aécio", partido: "PSDB" },
    { politico: "💩", nome: "Boulos", partido: "PSOL" },
    { politico: "🤡", nome: "Tiririca", partido: "PL" },
    { politico: "💄", nome: "Clodovil", partido: "PR" },
    { politico: "🏙️", nome: "Greca", partido: "DEM" },
    { politico: "🦅", nome: "Requião", partido: "MDB" },
    { politico: "🎸", nome: "Celso Pita", partido: "PP" },
  ]

  const mensagensPoliticos = {
    Lula: "LADRÃO DE GALINHA! 🍗",
    Bolsonaro: "MITO! 💪",
    Dilma: "TCHAU QUERIDA! 👋",
    FHC: "VELHO CANALHA! 📚",
    Temer: "GOLPISTA! ⚡",
    Collor: "CONFISCOU! 💰",
    Sarney: "SARNENTO! 🎭",
    Itamar: "PLANO REAL MEU PAU! 💵",
    Ciro: "CORONÉ MANE! 🤠",
    Marina: "TARTARUGA VELHA! 🌿",
    Ulysses: "CONSTITUINTE! 📖",
    Eneas: "MEU NOME É ENÉAS! 💣",
    Xandão: "CENSURA! ⛓️",
    Aécio: "AÉCIO COCA! ❄️",
    Boulos: "INVASOR! 💩",
    Tiririca: "FLORENTINA! 🤡",
    Clodovil: "FASHION! 💄",
    Greca: "CURITIBANO! 🏙️",
    Requião: "PARANAENSE! 🦅",
    "Celso Pita": "ROCKEIRO! 🎸",
  }

  const criarCartas = (numPares: number): CartaPolitico[] => {
    // Embaralhar a lista de políticos para dar chance a todos aparecerem
    const politicosEmbaralhados = embaralharArray(politicos)
    const politicosSelecionados = politicosEmbaralhados.slice(0, numPares)
    console.log(
      "Políticos selecionados para este jogo:",
      politicosSelecionados.map((p) => p.nome),
    )

    const cartasDuplicadas = politicosSelecionados.flatMap((pol, index) => [
      {
        id: index * 2,
        politico: pol.politico,
        nome: pol.nome,
        partido: pol.partido,
        virada: false,
        encontrada: false,
      },
      {
        id: index * 2 + 1,
        politico: pol.politico,
        nome: pol.nome,
        partido: pol.partido,
        virada: false,
        encontrada: false,
      },
    ])

    return cartasDuplicadas.sort(() => Math.random() - 0.5)
  }

  const [cartas, setCartas] = useState<CartaPolitico[]>([])
  const [cartasSelecionadas, setCartasSelecionadas] = useState<CartaPolitico[]>([])
  const [paresEncontrados, setParesEncontrados] = useState(0)
  const [jogadas, setJogadas] = useState(0)
  const [jogoCompleto, setJogoCompleto] = useState(false)
  const [mostrarLadrao, setMostrarLadrao] = useState("")
  const [jogoIniciado, setJogoIniciado] = useState(false)
  const [nomeJogador, setNomeJogador] = useState("")
  const [inputNome, setInputNome] = useState("")
  const [ranking, setRanking] = useState<{ [key: number]: RankingEntry[] }>({})
  const [novoRecorde, setNovoRecorde] = useState(false)
  const [carregandoRanking, setCarregandoRanking] = useState(true)
  const [erroRanking, setErroRanking] = useState("")
  const [numeroPares, setNumeroPares] = useState(8)
  const [statusConexao, setStatusConexao] = useState<"online" | "offline" | "conectando">("conectando")
  const [tempoSuportado, setTempoSuportado] = useState(true)
  const [modoExtremoLiberado, setModoExtremoLiberado] = useState(false)

  // Estados para cronômetro
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [jogoAtivo, setJogoAtivo] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const niveisJogo = [
    { pares: 4, nome: "Muito Fácil", emoji: "😊", cor: "bg-green-100 border-green-300" },
    { pares: 6, nome: "Fácil", emoji: "🙂", cor: "bg-blue-100 border-blue-300" },
    { pares: 8, nome: "Normal", emoji: "😐", cor: "bg-yellow-100 border-yellow-300" },
    { pares: 10, nome: "Difícil", emoji: "😅", cor: "bg-orange-100 border-orange-300" },
    { pares: 12, nome: "Muito Difícil", emoji: "😰", cor: "bg-red-100 border-red-300" },
    { pares: 15, nome: "Impossível", emoji: "🤯", cor: "bg-purple-100 border-purple-300" },
    { pares: 20, nome: "Extremo", emoji: "💀", cor: "bg-black text-white border-gray-800" },
  ]

  // Função para formatar tempo em MM:SS
  const formatarTempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`
  }

  // Cronômetro
  useEffect(() => {
    if (jogoAtivo && !jogoCompleto) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [jogoAtivo, jogoCompleto])

  // Carregar ranking público do Supabase
  const carregarRanking = async () => {
    try {
      setCarregandoRanking(true)
      setErroRanking("")
      setStatusConexao("conectando")

      if (isSupabaseAvailable()) {
        // Tentar carregar todos os dados incluindo tempo
        let { data, error } = await supabase!
          .from("ranking_politicos")
          .select("*")
          .gt("jogadas", 0) // FILTRAR APENAS JOGADAS > 0
          .order("jogadas", { ascending: true })
          .then((result) => {
            // Se temos dados, ordenar por jogadas e depois por tempo
            if (result.data && result.data.length > 0) {
              const sortedData = result.data.sort((a, b) => {
                if (a.jogadas === b.jogadas) {
                  return (a.tempo || 999999) - (b.tempo || 999999) // Tempo como desempate
                }
                return a.jogadas - b.jogadas
              })
              return { ...result, data: sortedData }
            }
            return result
          })

        if (error) {
          if (error.message.includes('relation "public.ranking_politicos" does not exist')) {
            setErroRanking("⚠️ Tabela do ranking não foi criada ainda. Execute o script SQL primeiro!")
            setStatusConexao("offline")
          } else if (error.message.includes('column "ranking_politicos.tempo" does not exist')) {
            console.log("Coluna tempo não existe, carregando sem tempo...")
            setTempoSuportado(false)
            const result = await supabase!
              .from("ranking_politicos")
              .select("id, nome, jogadas, data_criacao")
              .gt("jogadas", 0) // FILTRAR APENAS JOGADAS > 0
              .order("jogadas", { ascending: true })

            data = result.data
            error = result.error
          } else {
            throw error
          }
        } else if (data && data.length > 0) {
          // Verificar se temos dados de tempo
          const temTempoValido = data.some((entry) => entry.tempo !== undefined && entry.tempo !== null)
          setTempoSuportado(temTempoValido)
          console.log("Tempo suportado:", temTempoValido)
        }

        if (!error && data) {
          // Separar ranking por dificuldade
          const rankingPorDificuldade: { [key: number]: RankingEntry[] } = {}
          niveisJogo.forEach((nivel) => {
            const entradas = data
              .filter((entry) => entry.nome.includes(`(${nivel.pares} pares)`) && entry.jogadas > 0) // FILTRAR JOGADAS > 0
              .map((entry) => ({
                ...entry,
                tempo: entry.tempo || 0, // Garantir que tempo existe
              }))
              .slice(0, 5) // Limitar a top 5

            rankingPorDificuldade[nivel.pares] = entradas
          })
          setRanking(rankingPorDificuldade)
          setStatusConexao("online")
        }
      } else {
        // Usar localStorage quando Supabase não estiver disponível
        const rankingLocal = localStorage.getItem("ranking-politicos")
        if (rankingLocal) {
          const dados = JSON.parse(rankingLocal)
          const rankingPorDificuldade: { [key: number]: RankingEntry[] } = {}
          niveisJogo.forEach((nivel) => {
            rankingPorDificuldade[nivel.pares] = dados
              .filter((entry: RankingEntry) => entry.nome.includes(`(${nivel.pares} pares)`) && entry.jogadas > 0) // FILTRAR JOGADAS > 0
              .sort((a: RankingEntry, b: RankingEntry) => {
                if (a.jogadas === b.jogadas) {
                  return (a.tempo || 999999) - (b.tempo || 999999) // Desempate por tempo
                }
                return a.jogadas - b.jogadas
              })
              .slice(0, 5) // Limitar a top 5
          })
          setRanking(rankingPorDificuldade)
          setTempoSuportado(true) // localStorage sempre suporta tempo
        } else {
          setRanking({})
        }
        setStatusConexao("offline")
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error)
      setStatusConexao("offline")

      // Fallback para localStorage
      const rankingLocal = localStorage.getItem("ranking-politicos")
      if (rankingLocal) {
        const dados = JSON.parse(rankingLocal)
        const rankingPorDificuldade: { [key: number]: RankingEntry[] } = {}
        niveisJogo.forEach((nivel) => {
          rankingPorDificuldade[nivel.pares] = dados
            .filter((entry: RankingEntry) => entry.nome.includes(`(${nivel.pares} pares)`) && entry.jogadas > 0) // FILTRAR JOGADAS > 0
            .sort((a: RankingEntry, b: RankingEntry) => {
              if (a.jogadas === b.jogadas) {
                return (a.tempo || 999999) - (b.tempo || 999999) // Desempate por tempo
              }
              return a.jogadas - b.jogadas
            })
            .slice(0, 5) // Limitar a top 5
        })
        setRanking(rankingPorDificuldade)
        setTempoSuportado(true) // localStorage sempre suporta tempo
      } else {
        setRanking({})
      }

      setErroRanking("Erro ao conectar com o servidor. Usando dados locais.")
    } finally {
      setCarregandoRanking(false)
    }
  }

  // Salvar no ranking público
  const salvarNoRanking = async (nome: string, jogadas: number, tempo: number) => {
    try {
      // VALIDAÇÃO: Não salvar se jogadas for 0 ou inválido
      if (!jogadas || jogadas <= 0) {
        console.log("Tentativa de salvar com jogadas inválidas:", jogadas)
        return
      }

      // VALIDAÇÃO: Não salvar se tempo for inválido
      if (tempo < 0) {
        console.log("Tentativa de salvar com tempo inválido:", tempo)
        return
      }

      // VALIDAÇÃO: Não salvar se nome estiver vazio
      if (!nome || nome.trim().length === 0) {
        console.log("Tentativa de salvar com nome inválido:", nome)
        return
      }

      console.log("Salvando no ranking:", { nome, jogadas, tempo })

      if (isSupabaseAvailable()) {
        setStatusConexao("conectando")

        // Sempre incluir tempo nos dados de inserção
        const dadosInsercao = {
          nome: `${nome} (${numeroPares} pares)`,
          jogadas,
          tempo, // Sempre incluir tempo
        }

        const { data, error } = await supabase!.from("ranking_politicos").insert([dadosInsercao]).select()

        if (error) {
          // Verificar se é erro de tabela não existente
          if (error.message.includes('relation "public.ranking_politicos" does not exist')) {
            setErroRanking("⚠️ Tabela do ranking não foi criada ainda. Execute o script SQL primeiro!")
            setStatusConexao("offline")
            salvarNoRankingLocal(nome, jogadas, tempo)
            return
          } else if (error.message.includes('column "tempo" of relation "ranking_politicos" does not exist')) {
            // Se coluna tempo não existir, definir como não suportado
            setTempoSuportado(false)
            const { error: error2 } = await supabase!
              .from("ranking_politicos")
              .insert([
                {
                  nome: `${nome} (${numeroPares} pares)`,
                  jogadas,
                },
              ])
              .select()

            if (error2) {
              throw error2
            }
          } else {
            throw error
          }
        } else {
          // Sucesso - tempo foi salvo
          setTempoSuportado(true)
        }

        // Recarregar ranking após salvar
        await carregarRanking()
        const rankingAtual = ranking[numeroPares] || []
        const posicao = rankingAtual.findIndex((entry) => entry.nome.includes(nome) && entry.jogadas === jogadas)
        if (posicao !== -1) {
          setNovoRecorde(true)
        }
        setStatusConexao("online")
      } else {
        // Usar localStorage quando Supabase não estiver disponível
        salvarNoRankingLocal(nome, jogadas, tempo)
        setStatusConexao("offline")
      }
    } catch (error) {
      console.error("Erro ao salvar no ranking:", error)
      setStatusConexao("offline")
      // Fallback para localStorage
      salvarNoRankingLocal(nome, jogadas, tempo)
    }
  }

  // Adicionar nova função para salvar localmente:
  const salvarNoRankingLocal = (nome: string, jogadas: number, tempo: number) => {
    // VALIDAÇÃO: Não salvar se jogadas for 0 ou inválido
    if (!jogadas || jogadas <= 0) {
      console.log("Tentativa de salvar localmente com jogadas inválidas:", jogadas)
      return
    }

    const novaEntrada: RankingEntry = {
      nome: `${nome} (${numeroPares} pares)`,
      jogadas,
      tempo,
      data_criacao: new Date().toISOString(),
    }

    // Carregar dados existentes
    const rankingLocal = localStorage.getItem("ranking-politicos")
    const dadosExistentes = rankingLocal ? JSON.parse(rankingLocal) : []

    // Filtrar dados existentes para remover entradas com jogadas <= 0
    const dadosValidos = dadosExistentes.filter((entry: RankingEntry) => entry.jogadas > 0)

    // Adicionar nova entrada e ordenar
    const todosDados = [...dadosValidos, novaEntrada].sort((a, b) => {
      if (a.jogadas === b.jogadas) {
        return (a.tempo || 0) - (b.tempo || 0) // Desempate por tempo
      }
      return a.jogadas - b.jogadas
    })

    // Salvar todos os dados
    localStorage.setItem("ranking-politicos", JSON.stringify(todosDados))

    // Atualizar estado separado por dificuldade
    const rankingPorDificuldade: { [key: number]: RankingEntry[] } = {}
    niveisJogo.forEach((nivel) => {
      rankingPorDificuldade[nivel.pares] = todosDados
        .filter((entry: RankingEntry) => entry.nome.includes(`(${nivel.pares} pares)`) && entry.jogadas > 0) // FILTRAR JOGADAS > 0
        .slice(0, 5) // Limitar a top 5
    })
    setRanking(rankingPorDificuldade)

    // Verificar se entrou no top 5 da dificuldade atual
    const rankingAtual = rankingPorDificuldade[numeroPares] || []
    const posicao = rankingAtual.findIndex((entry) => entry.nome.includes(nome) && entry.jogadas === jogadas)
    if (posicao !== -1) {
      setNovoRecorde(true)
    }
  }

  useEffect(() => {
    carregarRanking()
  }, [])

  const iniciarJogo = () => {
    if (inputNome.trim()) {
      setNomeJogador(inputNome.trim())
      setJogoIniciado(true)
      reiniciarJogo()
    }
  }

  const clicarCarta = (carta: CartaPolitico) => {
    if (cartasSelecionadas.length >= 2 || carta.virada || carta.encontrada) {
      return
    }

    // Iniciar cronômetro na primeira jogada
    if (!jogoAtivo && jogadas === 0) {
      setJogoAtivo(true)
    }

    const novasCartas = cartas.map((c) => (c.id === carta.id ? { ...c, virada: true } : c))
    setCartas(novasCartas)

    const novasCartasSelecionadas = [...cartasSelecionadas, carta]
    setCartasSelecionadas(novasCartasSelecionadas)

    if (novasCartasSelecionadas.length === 2) {
      setJogadas(jogadas + 1)

      if (novasCartasSelecionadas[0].nome === novasCartasSelecionadas[1].nome) {
        const nomePolitico = novasCartasSelecionadas[0].nome
        const mensagem = mensagensPoliticos[nomePolitico as keyof typeof mensagensPoliticos] || "LADRÃO"
        setMostrarLadrao(mensagem)

        setTimeout(() => {
          setMostrarLadrao("")
        }, 1000)

        setTimeout(() => {
          setCartas((prev) => prev.map((c) => (c.nome === nomePolitico ? { ...c, encontrada: true } : c)))
          setParesEncontrados(paresEncontrados + 1)
          setCartasSelecionadas([])
        }, 1000)
      } else {
        setTimeout(() => {
          setCartas((prev) =>
            prev.map((c) =>
              novasCartasSelecionadas.some((selected) => selected.id === c.id) ? { ...c, virada: false } : c,
            ),
          )
          setCartasSelecionadas([])
        }, 1500)
      }
    }
  }

  const reiniciarJogo = () => {
    setCartas(criarCartas(numeroPares))
    setCartasSelecionadas([])
    setParesEncontrados(0)
    setJogadas(0)
    setJogoCompleto(false)
    setMostrarLadrao("")
    setNovoRecorde(false)
    setTempoDecorrido(0)
    setJogoAtivo(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const voltarAoInicio = () => {
    setJogoIniciado(false)
    setInputNome("")
    setNomeJogador("")
    reiniciarJogo()
    carregarRanking() // Recarregar ranking ao voltar
  }

  const obterGridCols = (numCartas: number) => {
    if (numCartas <= 8) return "grid-cols-4"
    if (numCartas <= 12) return "grid-cols-4 sm:grid-cols-6"
    if (numCartas <= 20) return "grid-cols-4 sm:grid-cols-5"
    return "grid-cols-4 sm:grid-cols-5 md:grid-cols-6"
  }

  useEffect(() => {
    if (paresEncontrados === numeroPares && jogoIniciado) {
      setJogoCompleto(true)
      setJogoAtivo(false)

      // VALIDAÇÃO FINAL: Só salvar se jogadas > 0
      if (jogadas > 0) {
        console.log("Jogo completo - salvando:", { nomeJogador, jogadas, tempoDecorrido })
        salvarNoRanking(nomeJogador, jogadas, tempoDecorrido)
      } else {
        console.log("Jogo completo mas jogadas = 0, não salvando no ranking")
      }
    }
  }, [paresEncontrados, jogoIniciado, nomeJogador, jogadas, numeroPares, tempoDecorrido])

  const verificarModoExtremo = (nome: string) => {
    if (!nome.trim()) {
      setModoExtremoLiberado(false)
      return
    }

    // Contar quantas vezes o nome aparece no ranking (em diferentes dificuldades)
    let aparicoes = 0
    const nomeFormatado = nome.trim()

    // Verificar em todas as dificuldades (exceto extremo)
    niveisJogo.slice(0, -1).forEach((nivel) => {
      const rankingNivel = ranking[nivel.pares] || []
      const temNome = rankingNivel.some(
        (entry) => entry.nome.replace(` (${nivel.pares} pares)`, "").toLowerCase() === nomeFormatado.toLowerCase(),
      )
      if (temNome) {
        aparicoes++
      }
    })

    console.log(`${nomeFormatado} aparece ${aparicoes} vezes no ranking`)
    setModoExtremoLiberado(aparicoes >= 3)
  }

  // Adicionar este useEffect após os outros useEffects existentes
  useEffect(() => {
    verificarModoExtremo(inputNome)
  }, [inputNome, ranking])

  if (!jogoIniciado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-2">🇧🇷 Jogo da Memória</h1>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 mb-2">Políticos Brasileiros</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">Encontre os pares de políticos brasileiros!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-4">Digite seu nome</h2>
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Seu nome..."
                  value={inputNome}
                  onChange={(e) => setInputNome(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && iniciarJogo()}
                  className="flex-1 text-base"
                />
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-4">Escolha a Dificuldade</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {(modoExtremoLiberado ? niveisJogo : niveisJogo.slice(0, -1)).map((nivel) => (
                  <button
                    key={nivel.pares}
                    onClick={() => setNumeroPares(nivel.pares)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      numeroPares === nivel.pares
                        ? nivel.cor + " ring-2 ring-blue-400"
                        : nivel.pares === 20
                          ? "bg-gradient-to-r from-gray-800 to-black text-white border-red-500 hover:from-gray-700 hover:to-gray-900"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    } ${nivel.pares === 20 ? "relative overflow-hidden" : ""}`}
                  >
                    {nivel.pares === 20 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-purple-500/20 animate-pulse"></div>
                    )}
                    <div className="relative z-10">
                      <div className="text-lg sm:text-xl md:text-2xl mb-1">{nivel.emoji}</div>
                      <div className={`font-bold text-xs sm:text-sm ${nivel.pares === 20 ? "text-red-400" : ""}`}>
                        {nivel.nome}
                      </div>
                      <div className={`text-xs ${nivel.pares === 20 ? "text-gray-300" : "text-gray-600"}`}>
                        {nivel.pares} pares
                      </div>
                      {nivel.pares === 20 && (
                        <div className="text-xs text-red-400 font-bold mt-1">🔓 DESBLOQUEADO!</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="text-center mb-4 sm:mb-8">
            <Button
              onClick={iniciarJogo}
              disabled={!inputNome.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-12 py-3 sm:py-4 text-base sm:text-lg md:text-xl w-full sm:w-auto"
            >
              🎮 Começar Jogo ({numeroPares} pares)
            </Button>
          </div>

          {!modoExtremoLiberado && (
            <div className="text-center mb-4 p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300">
              <h3 className="text-sm sm:text-base font-bold text-gray-700 mb-1">🔒 MODO EXTREMO BLOQUEADO</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Para desbloquear o <span className="font-bold text-red-600">Modo Extremo (20 pares)</span>, você precisa
                aparecer no ranking de <span className="font-bold">3 dificuldades diferentes</span>!
              </p>
            </div>
          )}

          {modoExtremoLiberado && (
            <div className="text-center mb-4 p-3 bg-gradient-to-r from-red-100 to-purple-100 rounded-lg border-2 border-red-300 animate-pulse">
              <h3 className="text-sm sm:text-base font-bold text-red-700 mb-1">🔓 MODO EXTREMO DESBLOQUEADO!</h3>
              <p className="text-xs sm:text-sm text-red-600">
                Parabéns <span className="font-bold">{inputNome}</span>! Você conquistou o direito de enfrentar o
                <span className="font-bold"> Modo Extremo (20 pares)</span>! 💀
              </p>
            </div>
          )}

          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
            {/* Indicador de Status */}
            <div className="flex justify-center mb-4">
              <div
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${
                  statusConexao === "online"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : statusConexao === "offline"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    statusConexao === "online"
                      ? "bg-green-500 animate-pulse"
                      : statusConexao === "offline"
                        ? "bg-red-500"
                        : "bg-yellow-500 animate-pulse"
                  }`}
                ></div>
                <span className="hidden sm:inline">
                  {statusConexao === "online" && "🌐 Online - Ranking Mundial"}
                  {statusConexao === "offline" && "📱 Offline - Ranking Local"}
                  {statusConexao === "conectando" && "⏳ Conectando..."}
                </span>
                <span className="sm:hidden">
                  {statusConexao === "online" && "🌐 Online"}
                  {statusConexao === "offline" && "📱 Offline"}
                  {statusConexao === "conectando" && "⏳ Conectando"}
                </span>
              </div>
            </div>

            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-800 mb-2">
                {isSupabaseAvailable() ? "🌍 RANKING MUNDIAL TOP 5" : "🏆 RANKING LOCAL TOP 5"}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-yellow-700">
                {isSupabaseAvailable()
                  ? "Competição global - Os melhores jogadores do mundo!"
                  : "Ranking local - Seus melhores recordes!"}
              </p>
              {tempoSuportado && (
                <p className="text-xs sm:text-sm text-yellow-600 mt-1">Ordenado por jogadas • Tempo como desempate</p>
              )}
              <Button
                onClick={carregarRanking}
                variant="outline"
                size="sm"
                className="mt-2 text-xs sm:text-sm"
                disabled={carregandoRanking}
              >
                {carregandoRanking ? "🔄 Carregando..." : "🔄 Atualizar Ranking"}
              </Button>
            </div>

            {erroRanking && (
              <div className="text-center mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-600 text-xs sm:text-sm">{erroRanking}</p>
              </div>
            )}

            {carregandoRanking ? (
              <div className="text-center py-8">
                <div className="text-2xl sm:text-3xl md:text-4xl mb-4">⏳</div>
                <p className="text-sm sm:text-base md:text-lg text-gray-600">Carregando ranking mundial...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {niveisJogo.map((nivel) => {
                  const rankingNivel = ranking[nivel.pares] || []
                  return (
                    <div
                      key={nivel.pares}
                      className={`p-3 sm:p-4 rounded-lg border-2 ${nivel.cor} transition-all hover:shadow-md`}
                    >
                      <div className="text-center mb-3">
                        <div className="text-lg sm:text-xl md:text-2xl mb-1">{nivel.emoji}</div>
                        <h3 className="font-bold text-xs sm:text-sm">{nivel.nome}</h3>
                        <div className="text-xs text-gray-600">{nivel.pares} pares</div>
                      </div>

                      {rankingNivel.length > 0 ? (
                        <div className="space-y-1 sm:space-y-2">
                          {/* Cabeçalho da tabela */}
                          <div className="grid grid-cols-[2fr_1fr_1fr] gap-1 text-xs sm:text-sm font-bold text-gray-700 border-b border-gray-300 pb-1">
                            <div className="text-left">Nome</div>
                            <div className="text-center">Jogadas</div>
                            <div className="text-center">Tempo</div>
                          </div>

                          {/* Linhas da tabela */}
                          {rankingNivel.slice(0, 5).map((entry, index) => (
                            <div
                              key={entry.id || index}
                              className={`grid grid-cols-[2fr_1fr_1fr] gap-1 items-center p-1 sm:p-2 rounded text-xs sm:text-sm ${
                                index === 0
                                  ? "bg-yellow-200 border border-yellow-400"
                                  : index === 1
                                    ? "bg-gray-200 border border-gray-400"
                                    : index === 2
                                      ? "bg-orange-200 border border-orange-400"
                                      : index === 3
                                        ? "bg-blue-100 border border-blue-300"
                                        : "bg-purple-100 border border-purple-300"
                              }`}
                            >
                              {/* Coluna Nome */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm">
                                  {index === 0
                                    ? "🥇"
                                    : index === 1
                                      ? "🥈"
                                      : index === 2
                                        ? "🥉"
                                        : index === 3
                                          ? "4º"
                                          : "5º"}
                                </span>
                                <span
                                  className="font-medium text-xs sm:text-sm overflow-hidden"
                                  title={entry.nome.replace(` (${nivel.pares} pares)`, "")}
                                >
                                  {entry.nome.replace(` (${nivel.pares} pares)`, "").length > 20
                                    ? entry.nome.replace(` (${nivel.pares} pares)`, "").substring(0, 20) + "..."
                                    : entry.nome.replace(` (${nivel.pares} pares)`, "")}
                                </span>
                              </div>

                              {/* Coluna Jogadas */}
                              <div className="text-center">
                                <span className="font-bold text-blue-600 text-xs sm:text-sm">{entry.jogadas}</span>
                              </div>

                              {/* Coluna Tempo */}
                              <div className="text-center">
                                {tempoSuportado && entry.tempo !== undefined ? (
                                  <span className="text-gray-600 text-xs sm:text-sm">{formatarTempo(entry.tempo)}</span>
                                ) : (
                                  <span className="text-gray-400 text-xs sm:text-sm">--:--</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <div className="text-lg sm:text-xl md:text-2xl mb-1">🎯</div>
                          <p className="text-xs text-gray-600">Sem recordes</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  const nivelAtual = niveisJogo.find((n) => n.pares === numeroPares) || niveisJogo[2]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-2">
            🇧🇷 Jogo da Memória - Políticos Brasileiros
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Jogador: <span className="font-bold text-green-700">{nomeJogador}</span>
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>
            Dificuldade:{" "}
            <span className="font-bold text-purple-700">
              {nivelAtual.emoji} {nivelAtual.nome}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{paresEncontrados}</div>
            <div className="text-xs sm:text-sm text-gray-600">Pares Encontrados</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{jogadas}</div>
            <div className="text-xs sm:text-sm text-gray-600">Jogadas</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{numeroPares}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total de Pares</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg sm:text-xl md:text-2xl font-bold ${jogoAtivo ? "text-red-600 animate-pulse" : "text-gray-600"}`}
            >
              ⏱️ {formatarTempo(tempoDecorrido)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Tempo</div>
          </div>
        </div>

        {jogoCompleto && (
          <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 rounded-lg border-2 border-green-300">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 mb-2">🎉 Parabéns {nomeJogador}!</h2>
            <p className="text-sm sm:text-base text-green-700">
              Você encontrou todos os {numeroPares} pares em {jogadas} jogadas!
            </p>
            <p className="text-sm sm:text-base text-blue-600 font-bold">⏱️ Tempo: {formatarTempo(tempoDecorrido)}</p>
            <p className="text-sm sm:text-base text-purple-600 font-bold">
              Dificuldade: {nivelAtual.emoji} {nivelAtual.nome}
            </p>
            {novoRecorde && (
              <p className="text-sm sm:text-base text-yellow-600 font-bold mt-2">
                🏆 Você entrou no top 5 desta dificuldade!
              </p>
            )}
            <p className="text-sm sm:text-base text-red-600 font-bold mt-2">
              Se você chegou até aqui você é um desocupado.
            </p>
          </div>
        )}

        {mostrarLadrao && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
            <div className="bg-red-600 text-white text-2xl sm:text-4xl md:text-6xl font-bold px-4 sm:px-8 py-2 sm:py-4 rounded-lg shadow-2xl animate-pulse text-center max-w-sm sm:max-w-none">
              {mostrarLadrao}
            </div>
          </div>
        )}

        <div className={`grid ${obterGridCols(numeroPares * 2)} gap-2 sm:gap-3 mb-4 sm:mb-8 max-w-6xl mx-auto`}>
          {cartas.map((carta) => (
            <Card
              key={carta.id}
              className={`
                aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95
                ${
                  carta.virada || carta.encontrada
                    ? "bg-white border-2 border-blue-300 shadow-lg"
                    : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                }
                ${carta.encontrada ? "ring-2 sm:ring-4 ring-green-400" : ""}
              `}
              onClick={() => clicarCarta(carta)}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2">
                {carta.virada || carta.encontrada ? (
                  <>
                    <div className="text-lg sm:text-2xl md:text-3xl mb-1">{carta.politico}</div>
                    <div className="text-xs sm:text-sm font-bold text-center text-gray-800 leading-tight">
                      {carta.nome}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{carta.partido}</div>
                  </>
                ) : (
                  <div className="text-2xl sm:text-3xl md:text-4xl text-white">♛</div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              onClick={reiniciarJogo}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
            >
              🔄 Novo Jogo
            </Button>
            <Button
              onClick={voltarAoInicio}
              variant="outline"
              className="px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
            >
              🏠 Voltar ao Início
            </Button>
          </div>
        </div>

        <div className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>Clique nas cartas para virá-las e encontre os pares!</p>
        </div>
      </div>
    </div>
  )
}
