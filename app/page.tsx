"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, RotateCcw, Play, Skull, Trophy, Crown, AlertTriangle } from "lucide-react"

const rouletteNumbers = Array.from({ length: 24 }, (_, i) => ({
  number: i + 1,
  color: (i + 1) % 2 === 1 ? "red" : "black",
}))

// Componente de Ficha Visual
const ChipComponent = ({ value, size = "sm" }: { value: number; size?: "xs" | "sm" | "md" }) => {
  const getChipColor = (val: number) => {
    if (val === 10) return "bg-amber-600 border-amber-700" // Bronze
    if (val === 50) return "bg-gray-400 border-gray-500" // Prata
    if (val === 100) return "bg-yellow-500 border-yellow-600" // Ouro
    if (val === 1000) return "bg-purple-600 border-purple-700" // Diamante
    if (val === 5000) return "bg-red-600 border-red-700" // Rubi
    return "bg-gray-600 border-gray-700"
  }

  const sizeClasses = {
    xs: "w-4 h-4 text-xs",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
  }

  const getDisplayValue = (val: number) => {
    if (val >= 5000) return "5K"
    if (val >= 1000) return "1K"
    return val.toString()
  }

  return (
    <div
      className={`${getChipColor(value)} ${sizeClasses[size]} rounded-full border-2 flex items-center justify-center text-white font-bold shadow-lg`}
    >
      {getDisplayValue(value)}
    </div>
  )
}

export default function RouletteGame() {
  const [balance, setBalance] = useState(1000)
  const [highScore, setHighScore] = useState(1000)
  const [selectedChipValue, setSelectedChipValue] = useState(10) // Valor da ficha selecionada
  const [gameOver, setGameOver] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasReached5000, setHasReached5000] = useState(false)
  const [hasReached1Million, setHasReached1Million] = useState(false)
  const [showMillionCelebration, setShowMillionCelebration] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [showAgiota, setShowAgiota] = useState(false)

  // Sistema de apostas por número - agora armazena array de valores apostados
  const [numberBets, setNumberBets] = useState<{ [key: number]: number[] }>({})

  // Apostas especiais - agora armazenam arrays de valores
  const [colorBets, setColorBets] = useState<{ red: number[]; black: number[] }>({ red: [], black: [] })
  const [dozenBets, setDozenBets] = useState<{ first: number[]; second: number[] }>({ first: [], second: [] })
  const [parityBets, setParityBets] = useState<{ even: number[]; odd: number[] }>({ even: [], odd: [] })

  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([])
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0)

  // Carregar recorde do localStorage ao iniciar
  useEffect(() => {
    const savedHighScore = localStorage.getItem("roletaum-highscore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  // Atualizar recorde sempre que o saldo mudar (apenas valores positivos)
  useEffect(() => {
    if (balance > highScore && balance > 0) {
      setHighScore(balance)
      localStorage.setItem("roletaum-highscore", balance.toString())
    }
  }, [balance, highScore])

  // Verificar se deve mostrar celebração quando atingir 5000
  useEffect(() => {
    if (balance >= 5000 && !hasReached5000 && !showCelebration) {
      setHasReached5000(true)
      setShowCelebration(true)

      // Esconder celebração após 5 segundos
      setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
    }
  }, [balance, hasReached5000, showCelebration])

  // Verificar se deve mostrar celebração quando atingir 1 milhão
  useEffect(() => {
    if (balance >= 1000000 && !hasReached1Million && !showMillionCelebration) {
      setHasReached1Million(true)
      setShowMillionCelebration(true)

      // Esconder celebração após 8 segundos (mais tempo para apreciar)
      setTimeout(() => {
        setShowMillionCelebration(false)
      }, 8000)
    }
  }, [balance, hasReached1Million, showMillionCelebration])

  // Calcular total de apostas
  const getTotalBets = () => {
    let total = 0

    // Somar apostas em números
    Object.values(numberBets).forEach((bets) => {
      total += bets.reduce((sum, bet) => sum + bet, 0)
    })

    // Somar apostas em cores
    total += colorBets.red.reduce((sum, bet) => sum + bet, 0)
    total += colorBets.black.reduce((sum, bet) => sum + bet, 0)

    // Somar apostas em dúzias
    total += dozenBets.first.reduce((sum, bet) => sum + bet, 0)
    total += dozenBets.second.reduce((sum, bet) => sum + bet, 0)

    // Somar apostas em paridade
    total += parityBets.even.reduce((sum, bet) => sum + bet, 0)
    total += parityBets.odd.reduce((sum, bet) => sum + bet, 0)

    return total
  }

  const canPlaceBet = () => {
    const totalBet = getTotalBets()
    const newBalance = balance - selectedChipValue
    // Permitir apostar até ficar devendo 50k
    return (
      newBalance >= -50000 && !isSpinning && !gameOver && !showCelebration && !showAgiota && !showMillionCelebration
    )
  }

  // Obter fichas disponíveis baseado no saldo
  const getAvailableChips = () => {
    const chips = [10, 50, 100]
    if (balance >= 2000) {
      chips.push(1000)
    }
    if (balance >= 10000) {
      chips.push(5000)
    }
    return chips
  }

  const placeBet = (number: number) => {
    if (canPlaceBet()) {
      setNumberBets((prev) => ({
        ...prev,
        [number]: [...(prev[number] || []), selectedChipValue],
      }))
    }
  }

  const placeColorBet = (color: "red" | "black") => {
    if (canPlaceBet()) {
      setColorBets((prev) => ({
        ...prev,
        [color]: [...prev[color], selectedChipValue],
      }))
    }
  }

  const placeDozenBet = (dozen: "first" | "second") => {
    if (canPlaceBet()) {
      setDozenBets((prev) => ({
        ...prev,
        [dozen]: [...prev[dozen], selectedChipValue],
      }))
    }
  }

  const placeParityBet = (parity: "even" | "odd") => {
    if (canPlaceBet()) {
      setParityBets((prev) => ({
        ...prev,
        [parity]: [...prev[parity], selectedChipValue],
      }))
    }
  }

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const generateSpinSequence = (finalNumber: number) => {
    const sequence = []
    const totalNumbers = 40 + Math.floor(Math.random() * 20)

    for (let i = 0; i < totalNumbers - 1; i++) {
      sequence.push(Math.floor(Math.random() * 24) + 1)
    }
    sequence.push(finalNumber)

    return sequence
  }

  const checkGameOver = (newBalance: number) => {
    if (newBalance <= -50000) {
      setFinalScore(balance) // Salvar pontuação final antes de zerar
      setIsNewRecord(balance === highScore && balance > 1000) // Verificar se é novo recorde
      setShowAgiota(true)
      showToastMessage("💀 Você deve 50 mil ao agiota!")
    }
  }

  const spinWheel = () => {
    const totalBet = getTotalBets()
    if (totalBet === 0 || isSpinning || gameOver || showCelebration || showAgiota || showMillionCelebration) return

    setIsSpinning(true)
    const newBalance = balance - totalBet
    setBalance(newBalance)

    const finalResult = Math.floor(Math.random() * 24) + 1
    const spinSequence = generateSpinSequence(finalResult)
    setDisplayNumbers(spinSequence)
    setCurrentDisplayIndex(0)

    let index = 0
    const totalDuration = 3000
    const startTime = Date.now()

    const animateSequence = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / totalDuration

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentInterval = 50 + easeOutQuart * 750

      if (index < spinSequence.length) {
        setCurrentDisplayIndex(index)
        index++

        if (elapsed >= totalDuration || index >= spinSequence.length) {
          setCurrentDisplayIndex(spinSequence.length - 1)

          setTimeout(() => {
            setLastResult(finalResult)
            setIsSpinning(false)

            let winAmount = 0
            let winMessage = ""

            // Verificar aposta em número específico
            if (numberBets[finalResult]) {
              const numberWin = numberBets[finalResult].reduce((sum, bet) => sum + bet * 24, 0)
              winAmount += numberWin
              winMessage += `Número ${finalResult}: +${numberWin} fichas! `
            }

            // Verificar aposta em cor
            const resultColor = finalResult % 2 === 1 ? "red" : "black"
            if (colorBets[resultColor].length > 0) {
              const colorWin = colorBets[resultColor].reduce((sum, bet) => sum + bet * 2, 0)
              winAmount += colorWin
              winMessage += `Cor: +${colorWin} fichas! `
            }

            // Verificar aposta em dúzia
            const isFirstDozen = finalResult <= 12
            const dozenKey = isFirstDozen ? "first" : "second"
            if (dozenBets[dozenKey].length > 0) {
              const dozenWin = dozenBets[dozenKey].reduce((sum, bet) => sum + bet * 2, 0)
              winAmount += dozenWin
              winMessage += `Dúzia: +${dozenWin} fichas! `
            }

            // Verificar aposta em paridade
            const isEven = finalResult % 2 === 0
            const parityKey = isEven ? "even" : "odd"
            if (parityBets[parityKey].length > 0) {
              const parityWin = parityBets[parityKey].reduce((sum, bet) => sum + bet * 2, 0)
              winAmount += parityWin
              winMessage += `Paridade: +${parityWin} fichas! `
            }

            const finalBalance = newBalance + winAmount

            if (winAmount > 0) {
              setBalance(finalBalance)
              showToastMessage(`🎉 Parabéns! ${winMessage}`)
            } else {
              const resultDozen = finalResult <= 12 ? "1ª dúzia" : "2ª dúzia"
              const resultParity = finalResult % 2 === 0 ? "par" : "ímpar"
              showToastMessage(`😔 ${finalResult} (${resultColor}, ${resultDozen}, ${resultParity}). Tente novamente!`)
            }

            // Verificar Game Over (agora só quando dever 50k)
            checkGameOver(finalBalance)

            // Reset das apostas
            setNumberBets({})
            setColorBets({ red: [], black: [] })
            setDozenBets({ first: [], second: [] })
            setParityBets({ even: [], odd: [] })
          }, 1000)
        } else {
          setTimeout(animateSequence, currentInterval)
        }
      }
    }

    animateSequence()
  }

  const resetGame = () => {
    setBalance(1000)
    setGameOver(false)
    setHasReached5000(false)
    setHasReached1Million(false)
    setShowCelebration(false)
    setShowMillionCelebration(false)
    setShowAgiota(false)
    setFinalScore(0)
    setIsNewRecord(false)
    setNumberBets({})
    setColorBets({ red: [], black: [] })
    setDozenBets({ first: [], second: [] })
    setParityBets({ even: [], odd: [] })
    setLastResult(null)
    setDisplayNumbers([])
    setShowToast(false)
    setSelectedChipValue(10)
  }

  const getNumberColor = (num: number) => {
    return num % 2 === 1 ? "red" : "black"
  }

  const totalBets = getTotalBets()
  const availableChips = getAvailableChips()

  // Tela do Agiota - quando deve 50k
  if (showAgiota) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 p-2 relative flex items-center justify-center">
        <Card className="bg-black/90 border-red-600 max-w-2xl w-full shadow-2xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h1 className="text-4xl font-bold text-red-500 mb-4 animate-pulse">⚠️ DÍVIDA CRÍTICA ⚠️</h1>

            <div className="mb-6">
              <img
                src="/agiota.jpg"
                alt="Agiota"
                className="w-64 h-64 mx-auto rounded-lg shadow-2xl object-cover border-4 border-red-600"
              />
            </div>

            <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">💰 SITUAÇÃO FINANCEIRA</h2>
              <div className="text-center mb-4">
                <span className="text-red-400 text-3xl font-bold">-{Math.abs(balance).toLocaleString()} fichas</span>
                <p className="text-gray-300 mt-2">Você deve ao agiota!</p>
              </div>

              <div className="border-t border-red-500 pt-4">
                <p className="text-yellow-400 text-lg font-bold mb-2">⏰ PRAZO FINAL</p>
                <p className="text-white text-xl">Você tem 24 horas para acertar a conta!</p>
                <p className="text-gray-300 text-sm mt-2">Caso contrário... bem, você sabe o que acontece.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-red-300 text-lg italic">"Não gosto de esperar... pague logo!"</p>

              <Button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 text-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Recomeçar e Quitar Dívida
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de Celebração 1 Milhão - VENCEU NA VIDA
  if (showMillionCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-2 relative flex items-center justify-center">
        <Card className="bg-black/90 border-gold-500 max-w-4xl w-full shadow-2xl">
          <CardContent className="p-8 text-center">
            <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h1 className="text-6xl font-bold text-yellow-500 mb-4 animate-pulse">👑 VENCEU NA VIDA! 👑</h1>
            <p className="text-white mb-6 text-2xl font-bold">Você atingiu 1 MILHÃO de fichas!</p>

            <div className="mb-6">
              <img
                src="/venceu-na-vida.jpg"
                alt="Venceu na Vida - Vida de Luxo"
                className="w-full max-w-2xl h-80 mx-auto rounded-lg shadow-2xl object-cover border-4 border-yellow-500"
              />
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border border-yellow-500 rounded-lg p-6 mb-6">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">🏆 CONQUISTA ÉPICA 🏆</h2>
              <p className="text-white text-xl mb-2">Vida de luxo desbloqueada!</p>
              <p className="text-yellow-300 text-lg">Iate, morenas e muito dinheiro! 💰🛥️</p>
              <div className="flex justify-center items-center gap-4 mt-4">
                <span className="text-4xl">🥂</span>
                <span className="text-white text-lg">Brinde ao sucesso!</span>
                <span className="text-4xl">🍾</span>
              </div>
            </div>

            <p className="text-yellow-300 text-xl font-bold animate-pulse">Continue jogando e mantenha o império!</p>
            <p className="text-white text-sm mt-2">Voltando ao jogo em alguns segundos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de Celebração 5000 pontos
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-2 relative flex items-center justify-center">
        <Card className="bg-black/80 border-yellow-500 max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold text-yellow-500 mb-4 animate-pulse">🎉 PARABÉNS! 🎉</h1>
            <p className="text-white mb-6 text-xl">Você atingiu 5000 fichas!</p>

            <div className="mb-6">
              <img
                src="/dilma-rindo.webp"
                alt="Celebração"
                className="w-64 h-64 mx-auto rounded-lg shadow-2xl object-cover"
              />
            </div>

            <p className="text-yellow-300 text-lg font-bold animate-pulse">Voltando ao jogo em alguns segundos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Game Over Overlay (removido pois agora só acontece com agiota)
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-2 relative flex items-center justify-center">
        <Card className="bg-black/80 border-red-500 max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h1>
            <p className="text-white mb-6">Seu saldo zerou! Não foi possível continuar jogando.</p>

            {/* Estatísticas do Jogo */}
            <div className="bg-black/40 rounded-lg p-4 mb-6 border border-gray-600">
              <h3 className="text-white font-bold mb-3 text-lg">📊 Estatísticas</h3>

              <div className="grid grid-cols-1 gap-3">
                {/* Pontuação Final */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pontuação Final:</span>
                  <span className="text-white font-bold">{finalScore} fichas</span>
                </div>

                {/* Recorde Atual */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Recorde Máximo:
                  </span>
                  <span className="text-yellow-400 font-bold">{highScore} fichas</span>
                </div>

                {/* Novo Recorde */}
                {isNewRecord && (
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-2 mt-2">
                    <p className="text-yellow-400 font-bold animate-pulse">🎉 NOVO RECORDE! 🎉</p>
                  </div>
                )}

                {/* Diferença para o recorde */}
                {!isNewRecord && finalScore < highScore && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Faltaram para o recorde:</span>
                    <span className="text-red-400">{highScore - finalScore} fichas</span>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3">
              <RotateCcw className="w-4 h-4 mr-2" />
              Jogar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-2 relative">
      <div className="max-w-4xl mx-auto">
        {/* Toast Message */}
        {showToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-3 rounded-lg shadow-lg border border-green-500 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-center font-semibold">{toastMessage}</div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">🎰 Roletaum do Rataum</h1>
          {balance >= 1000000 && (
            <p className="text-yellow-400 text-lg animate-pulse font-bold">👑 VENCEU NA VIDA! 👑</p>
          )}
          {balance >= 10000 && balance < 1000000 && (
            <p className="text-red-400 text-sm animate-pulse">💎 Ficha de 5000 desbloqueada! 💎</p>
          )}
          {balance >= 2000 && balance < 10000 && (
            <p className="text-yellow-400 text-sm animate-pulse">✨ Ficha de 1000 desbloqueada! ✨</p>
          )}
          {/* Mostrar recorde atual */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-400 text-sm">Recorde: {highScore}</span>
          </div>
        </div>

        {/* Game Stats com Seletor de Fichas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className={`${balance < 0 ? "bg-red-900/20 border-red-500" : "bg-black/20 border-green-500"}`}>
            <CardContent className="p-2 text-center">
              <div
                className={`flex items-center justify-center gap-2 ${balance < 0 ? "text-red-400" : "text-yellow-400"}`}
              >
                <Coins className="w-3 h-3" />
                <span className="text-sm font-bold">{balance < 0 ? `-${Math.abs(balance)}` : balance}</span>
              </div>
              <p className={`text-xs ${balance < 0 ? "text-red-200" : "text-green-200"}`}>
                {balance < 0 ? "Dívida" : "Saldo"}
              </p>
              {balance < 0 && <p className="text-xs text-red-300 mt-1">Limite: {50000 + balance}</p>}
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-green-500">
            <CardContent className="p-2 text-center">
              <div className="flex justify-center gap-1 mb-1 flex-wrap">
                {availableChips.map((value) => (
                  <Button
                    key={value}
                    onClick={() => setSelectedChipValue(value)}
                    className={`p-1 ${
                      selectedChipValue === value ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-green-900" : ""
                    } ${value === 1000 ? "animate-pulse" : ""} ${value === 5000 ? "animate-pulse" : ""}`}
                    variant="ghost"
                    disabled={isSpinning || gameOver || showCelebration || showAgiota || showMillionCelebration}
                    size="sm"
                  >
                    <ChipComponent value={value} size="sm" />
                  </Button>
                ))}
              </div>
              <p className="text-green-200 text-xs">Fichas</p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-green-500">
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-white">{totalBets}</div>
              <p className="text-green-200 text-xs">Aposta Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Roulette Container - PLAY | ROLETA | RESULTADO */}
        <Card className="bg-black/20 border-green-500 mb-4">
          <CardContent className="p-2">
            <div className="flex flex-row items-center justify-center gap-2">
              {/* Botão PLAY à esquerda */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {!isSpinning &&
                totalBets > 0 &&
                !gameOver &&
                !showCelebration &&
                !showAgiota &&
                !showMillionCelebration ? (
                  <Button
                    onClick={spinWheel}
                    className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full shadow-lg border-2 border-white flex flex-col items-center justify-center"
                  >
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 mb-1" />
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">PLAY</span>
                  </Button>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gray-600/50 border-2 border-gray-500 flex flex-col items-center justify-center">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 mb-1 text-gray-400" />
                    <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-400">
                      {isSpinning
                        ? "..."
                        : gameOver
                          ? "OVER"
                          : showCelebration
                            ? "🎉"
                            : showAgiota
                              ? "💀"
                              : showMillionCelebration
                                ? "👑"
                                : "PLAY"}
                    </span>
                  </div>
                )}
              </div>

              {/* Roleta no centro */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-40 md:h-40 lg:w-52 lg:h-52">
                  <img
                    src="/jodevan-v2.png"
                    alt="Jodevan - Roleta de Madeira"
                    className={`w-full h-full object-cover ${isSpinning ? "animate-spin" : ""}`}
                    style={{
                      clipPath: "circle(50%)",
                      animationDuration: isSpinning ? "3s" : "0s",
                      animationTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
                    }}
                  />
                </div>
              </div>

              {/* Resultado à direita */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-40 md:h-40 lg:w-52 lg:h-52 flex-shrink-0">
                <div className="bg-black/40 rounded-lg w-full h-full flex flex-col items-center justify-center border border-green-500/30">
                  <h3 className="text-white font-bold mb-1 text-xs sm:text-sm md:text-base lg:text-lg">Resultado</h3>

                  {isSpinning && displayNumbers.length > 0 ? (
                    <div className="text-center">
                      <div
                        className={`text-sm sm:text-lg md:text-3xl lg:text-5xl font-bold mb-1 transition-all duration-100 ${
                          getNumberColor(displayNumbers[currentDisplayIndex]) === "red" ? "text-red-500" : "text-white"
                        }`}
                      >
                        {displayNumbers[currentDisplayIndex]}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getNumberColor(displayNumbers[currentDisplayIndex]).toUpperCase()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">🎲</div>
                    </div>
                  ) : lastResult !== null ? (
                    <div className="text-center">
                      <div
                        className={`text-sm sm:text-lg md:text-3xl lg:text-5xl font-bold mb-1 ${
                          getNumberColor(lastResult) === "red" ? "text-red-500" : "text-white"
                        }`}
                      >
                        {lastResult}
                      </div>
                      <div className="text-xs text-gray-400">{getNumberColor(lastResult).toUpperCase()}</div>
                      <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                        {lastResult <= 12 ? "1ª Dúzia" : "2ª Dúzia"} • {lastResult % 2 === 0 ? "Par" : "Ímpar"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm sm:text-lg md:text-3xl lg:text-5xl text-gray-500">?</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Options - Compacto */}
        <Card className="bg-black/20 border-green-500 mb-4">
          <CardContent className="p-2">
            {/* Primeira linha - Cores */}
            <div className="flex gap-1 mb-2">
              <Button
                onClick={() => placeColorBet("red")}
                className={`flex-1 h-12 relative ${
                  colorBets.red.length > 0 ? "bg-red-800" : "bg-red-600 hover:bg-red-700"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                VERMELHO
                {colorBets.red.length > 0 && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    {colorBets.red.slice(0, 3).map((bet, index) => (
                      <ChipComponent key={index} value={bet} size="xs" />
                    ))}
                    {colorBets.red.length > 3 && <span className="text-xs">+{colorBets.red.length - 3}</span>}
                  </div>
                )}
              </Button>
              <Button
                onClick={() => placeColorBet("black")}
                className={`flex-1 h-12 relative ${
                  colorBets.black.length > 0 ? "bg-gray-900" : "bg-gray-800 hover:bg-gray-700"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                PRETO
                {colorBets.black.length > 0 && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    {colorBets.black.slice(0, 3).map((bet, index) => (
                      <ChipComponent key={index} value={bet} size="xs" />
                    ))}
                    {colorBets.black.length > 3 && <span className="text-xs">+{colorBets.black.length - 3}</span>}
                  </div>
                )}
              </Button>
            </div>

            {/* Segunda linha - Dúzias e Paridade */}
            <div className="grid grid-cols-4 gap-1">
              <Button
                onClick={() => placeDozenBet("first")}
                className={`h-12 relative ${
                  dozenBets.first.length > 0 ? "bg-green-900" : "bg-green-800 hover:bg-green-900"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                1/12
                {dozenBets.first.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <ChipComponent value={dozenBets.first[dozenBets.first.length - 1]} size="xs" />
                  </div>
                )}
              </Button>
              <Button
                onClick={() => placeDozenBet("second")}
                className={`h-12 relative ${
                  dozenBets.second.length > 0 ? "bg-green-900" : "bg-green-800 hover:bg-green-900"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                13/24
                {dozenBets.second.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <ChipComponent value={dozenBets.second[dozenBets.second.length - 1]} size="xs" />
                  </div>
                )}
              </Button>
              <Button
                onClick={() => placeParityBet("even")}
                className={`h-12 relative ${
                  parityBets.even.length > 0 ? "bg-green-900" : "bg-green-800 hover:bg-green-900"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                PAR
                {parityBets.even.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <ChipComponent value={parityBets.even[parityBets.even.length - 1]} size="xs" />
                  </div>
                )}
              </Button>
              <Button
                onClick={() => placeParityBet("odd")}
                className={`h-12 relative ${
                  parityBets.odd.length > 0 ? "bg-green-900" : "bg-green-800 hover:bg-green-900"
                } text-white font-bold text-xs`}
                disabled={!canPlaceBet()}
              >
                ÍMPAR
                {parityBets.odd.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <ChipComponent value={parityBets.odd[parityBets.odd.length - 1]} size="xs" />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Number Grid with Dozens Division */}
        <Card className="bg-black/20 border-green-500">
          <CardContent className="p-3">
            {/* First Dozen */}
            <div className="mb-3">
              <div className="grid grid-cols-4 gap-2 p-2 border-2 border-blue-500/30 rounded-lg bg-blue-500/5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                  const isRed = num % 2 === 1
                  const bets = numberBets[num] || []
                  return (
                    <Button
                      key={num}
                      onClick={() => placeBet(num)}
                      className={`h-12 relative ${
                        bets.length > 0
                          ? "bg-yellow-600"
                          : isRed
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-800 hover:bg-gray-700"
                      } text-white font-bold text-sm`}
                      disabled={!canPlaceBet()}
                    >
                      {num}
                      {bets.length > 0 && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          {bets.slice(0, 2).map((bet, index) => (
                            <ChipComponent key={index} value={bet} size="xs" />
                          ))}
                          {bets.length > 2 && <span className="text-xs">+{bets.length - 2}</span>}
                        </div>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Second Dozen */}
            <div className="mb-3">
              <div className="grid grid-cols-4 gap-2 p-2 border-2 border-purple-500/30 rounded-lg bg-purple-500/5">
                {Array.from({ length: 12 }, (_, i) => i + 13).map((num) => {
                  const isRed = num % 2 === 1
                  const bets = numberBets[num] || []
                  return (
                    <Button
                      key={num}
                      onClick={() => placeBet(num)}
                      className={`h-12 relative ${
                        bets.length > 0
                          ? "bg-yellow-600"
                          : isRed
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-800 hover:bg-gray-700"
                      } text-white font-bold text-sm`}
                      disabled={!canPlaceBet()}
                    >
                      {num}
                      {bets.length > 0 && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          {bets.slice(0, 2).map((bet, index) => (
                            <ChipComponent key={index} value={bet} size="xs" />
                          ))}
                          {bets.length > 2 && <span className="text-xs">+{bets.length - 2}</span>}
                        </div>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-center mt-3">
              <Button onClick={resetGame} variant="outline" className="bg-gray-700 text-white text-sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Jogo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
