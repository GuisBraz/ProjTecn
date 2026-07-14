// Motor da Programação de Corte.
// A Fila (ordem manual definida pela programadora) + o Tempo de Corte estimado
// de cada PGM geram automaticamente o cronograma — ninguém edita hora na
// Programação diretamente, ela é sempre um resultado calculado.

export const getMaquina = (esp) => {
  if (!esp || esp === 0) return null
  return Number(esp) < 23 ? 'PLASMA' : 'OXICORTE'
}

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const isoDay = (d) => d.toISOString().slice(0, 10)

// Empurra uma data pro próximo instante válido de expediente:
// dentro da janela [horaInicio, horaFim) e em um dia sem parada programada.
function proximoInstanteValido(date, maquina, paradas, horaInicio, horaFim) {
  let d = new Date(date)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const bloqueado = paradas.some((p) => p.data === isoDay(d) && (p.maquina === maquina || p.maquina === 'AMBAS'))
    const horaAtual = d.getHours() + d.getMinutes() / 60
    if (bloqueado || horaAtual >= horaFim) {
      d = new Date(d)
      d.setDate(d.getDate() + 1)
      d.setHours(horaInicio, 0, 0, 0)
      continue
    }
    if (horaAtual < horaInicio) {
      d.setHours(horaInicio, 0, 0, 0)
      continue
    }
    return d
  }
}

// Aloca `horas` a partir de `inicio`, respeitando o expediente e paradas.
// Retorna { inicio, fim, segmentos } — segmentos = pedaços por dia, pra
// desenhar corretamente quando o corte atravessa a virada do expediente.
function alocarBloco(inicioBruto, horas, maquina, paradas, horaInicio, horaFim) {
  let cursor = proximoInstanteValido(inicioBruto, maquina, paradas, horaInicio, horaFim)
  const inicio = new Date(cursor)
  let restante = horas
  const segmentos = []

  while (restante > 1e-6) {
    const fimExpedienteHoje = new Date(cursor)
    fimExpedienteHoje.setHours(horaFim, 0, 0, 0)
    const disponivelHoje = (fimExpedienteHoje.getTime() - cursor.getTime()) / 3600000
    const alocarAgora = Math.min(restante, disponivelHoje)
    const fimSegmento = new Date(cursor.getTime() + alocarAgora * 3600000)
    segmentos.push({ inicio: new Date(cursor), fim: fimSegmento })
    restante -= alocarAgora
    cursor = restante > 1e-6
      ? proximoInstanteValido(fimSegmento, maquina, paradas, horaInicio, horaFim)
      : fimSegmento
  }

  return { inicio, fim: cursor, segmentos, atravessaDias: segmentos.length > 1 }
}

// pgmsDaMaquina: todos os PGMs (Aguardando + Em Corte) de UMA máquina, já
// ordenados pela prioridade da Fila (o "Em Corte", se houver, deve vir primeiro).
export function calcularCronograma(pgmsDaMaquina, { paradas = [], horaInicio = 6, horaFim = 22, agora = new Date(), maquina }) {
  const resultados = []
  let cursor = agora

  pgmsDaMaquina.forEach((pgm) => {
    const horasEstimadas = Number(pgm.tempo_corte_estimado_horas) || 4

    if (pgm.status === 'Em Corte' && pgm.data_inicio_corte) {
      const inicioReal = new Date(pgm.data_inicio_corte)
      const previstoFim = new Date(inicioReal.getTime() + horasEstimadas * 3600000)
      const atrasado = agora > previstoFim
      const fimUsado = atrasado ? agora : previstoFim
      resultados.push({
        pgm, inicio: inicioReal, fim: fimUsado, segmentos: [{ inicio: inicioReal, fim: fimUsado }],
        atravessaDias: inicioReal.toDateString() !== fimUsado.toDateString(),
        emAndamento: true, atrasado, previstoFim,
        atrasoMin: atrasado ? Math.round((agora.getTime() - previstoFim.getTime()) / 60000) : 0,
      })
      cursor = fimUsado
      return
    }

    const bloco = alocarBloco(cursor, horasEstimadas, maquina, paradas, horaInicio, horaFim)
    resultados.push({ pgm, ...bloco, emAndamento: false, atrasado: false })
    cursor = bloco.fim
  })

  return resultados
}

// Ordena a fila de uma máquina: "Em Corte" sempre primeiro, depois
// "Aguardando Corte" pela prioridade manual (menor primeiro); sem
// prioridade definida, cai pra ordem de cadastro.
export function ordenarFila(pgmsDaMaquina) {
  const emCorte = pgmsDaMaquina.filter((p) => p.status === 'Em Corte')
  const aguardando = pgmsDaMaquina
    .filter((p) => p.status === 'Aguardando Corte')
    .sort((a, b) => {
      const pa = a.prioridade ?? (a.createdAt?.seconds || 0)
      const pb = b.prioridade ?? (b.createdAt?.seconds || 0)
      return pa - pb
    })
  return [...emCorte, ...aguardando]
}
