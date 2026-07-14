// Regras de temporizador do Carga Máquina:
// 1) Tempo aguardando corte — desde o cadastro (ou emissão) até agora, enquanto status = 'Aguardando Corte'.
//    Sinaliza como atrasado a partir de 3 dias.
// 2) Tempo de corte — intervalo entre o início e o fim do corte (ou "agora", se ainda em corte).

const DIAS_LIMITE_ESPERA = 3

function toDate(value) {
  if (!value) return null
  if (value.seconds) return new Date(value.seconds * 1000) // Firestore Timestamp
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// Retorna { dias, atrasado } ou null se não aplicável (já iniciou o corte / sem data base)
export function getEsperaCorte(pgm) {
  if (!pgm || pgm.status !== 'Aguardando Corte') return null
  const inicio = toDate(pgm.createdAt) || toDate(pgm.data_emissao)
  if (!inicio) return null
  const ms = Date.now() - inicio.getTime()
  const dias = Math.max(0, Math.floor(ms / 86400000))
  return { dias, atrasado: dias >= DIAS_LIMITE_ESPERA }
}

export function getEsperaTexto(pgm) {
  const e = getEsperaCorte(pgm)
  if (!e) return null
  if (e.dias === 0) return 'Aguardando há menos de 1 dia'
  return `Aguardando há ${e.dias} dia${e.dias !== 1 ? 's' : ''}`
}

// Duração do corte em ms — entre início e (fim OU agora, se ainda em corte)
export function getDuracaoCorteMs(pgm) {
  if (!pgm) return null
  const inicio = toDate(pgm.data_inicio_corte)
  if (!inicio) return null
  if (pgm.status === 'Em Corte') return Date.now() - inicio.getTime()
  const fim = toDate(pgm.data_corte)
  if (!fim) return null
  return fim.getTime() - inicio.getTime()
}

export function formatDuracao(ms) {
  if (ms == null || ms < 0) return '—'
  const totalMin = Math.floor(ms / 60000)
  const dias = Math.floor(totalMin / 1440)
  const horas = Math.floor((totalMin % 1440) / 60)
  const min = totalMin % 60
  if (dias > 0) return `${dias}d ${horas}h`
  if (horas > 0) return `${horas}h ${min}min`
  return `${min}min`
}

export function getTempoCorteTexto(pgm) {
  const ms = getDuracaoCorteMs(pgm)
  if (ms == null) return '—'
  return formatDuracao(ms)
}

export const LIMITE_DIAS_ESPERA = DIAS_LIMITE_ESPERA
