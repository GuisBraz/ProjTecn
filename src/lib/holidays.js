// Feriados de Contagem/MG, calculados por ano (não depende de internet).
// Fontes: feriados nacionais (Lei 9.093/1995 + Lei 14.759/2023 p/ Consciência
// Negra), Data Magna de MG (21/04, mesma data de Tiradentes) e o feriado
// municipal de Contagem — Jubileu de Nossa Senhora das Dores (Lei 3.484/2001),
// sexta-feira que antecede o Domingo de Ramos.

function pad(n) { return String(n).padStart(2, '0') }
function toISO(y, m, d) { return `${y}-${pad(m)}-${pad(d)}` }

// Algoritmo de Meeus/Jones/Butcher pro Domingo de Páscoa
function pascoa(ano) {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function addDiasISO(date, dias) {
  const d = new Date(date)
  d.setDate(d.getDate() + dias)
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function getFeriadosContagemMG(ano) {
  const pascoaData = pascoa(ano)

  return [
    { data: toISO(ano, 1, 1), nome: 'Confraternização Universal' },
    { data: addDiasISO(pascoaData, -48), nome: 'Carnaval (segunda)' },
    { data: addDiasISO(pascoaData, -47), nome: 'Carnaval (terça)' },
    { data: addDiasISO(pascoaData, -9), nome: 'Jubileu de N. Sra. das Dores (municipal)' },
    { data: addDiasISO(pascoaData, -2), nome: 'Sexta-feira Santa' },
    { data: toISO(ano, 4, 21), nome: 'Tiradentes / Data Magna de MG' },
    { data: toISO(ano, 5, 1), nome: 'Dia do Trabalho' },
    { data: addDiasISO(pascoaData, 60), nome: 'Corpus Christi' },
    { data: toISO(ano, 9, 7), nome: 'Independência do Brasil' },
    { data: toISO(ano, 10, 12), nome: 'Nossa Senhora Aparecida' },
    { data: toISO(ano, 11, 2), nome: 'Finados' },
    { data: toISO(ano, 11, 15), nome: 'Proclamação da República' },
    { data: toISO(ano, 11, 20), nome: 'Consciência Negra' },
    { data: toISO(ano, 12, 25), nome: 'Natal' },
  ].sort((a, b) => a.data.localeCompare(b.data))
}
