// Calcula se uma OP está em andamento (dentro do prazo) ou atrasada,
// comparando a previsão de término com a data de hoje.
export function getOpSituacao(previsaoTermino) {
  if (!previsaoTermino) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prev = new Date(previsaoTermino)
  prev.setHours(0, 0, 0, 0)
  return prev >= hoje ? 'andamento' : 'atrasado'
}

// Retorna um texto curto: "Faltam 3 dias" ou "Atrasada há 2 dias"
export function getOpPrazoTexto(previsaoTermino) {
  if (!previsaoTermino) return '—'
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prev = new Date(previsaoTermino)
  prev.setHours(0, 0, 0, 0)
  const diffDias = Math.round((prev - hoje) / 86400000)
  if (diffDias === 0) return 'Vence hoje'
  if (diffDias > 0) return `Faltam ${diffDias} dia${diffDias !== 1 ? 's' : ''}`
  return `Atrasada há ${Math.abs(diffDias)} dia${Math.abs(diffDias) !== 1 ? 's' : ''}`
}
