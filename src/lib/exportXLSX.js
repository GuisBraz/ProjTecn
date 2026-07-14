import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = (d) => d ? format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) : ''
const fmtDT = (d) => d ? format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''

export function exportPGMs(pgms, filters = {}) {
  const rows = pgms.map((p, i) => ({
    'ITEM': i + 1,
    "PGM's": p.pgm,
    'COMMESSA': p.commessa,
    'ESPESSURA (MM)': p.espessura_mm,
    'MÁQUINA': p.maquina || '',
    'PESO (KG)': p.peso_kg,
    'Mês Corte': p.mes_corte || '',
    'DATA DE EMISSÃO': fmt(p.data_emissao),
    'INÍCIO DO CORTE': fmtDT(p.data_inicio_corte),
    'DATA DE CORTE': fmtDT(p.data_corte),
    'REV.': p.rev || '',
    'MATERIAL': p.material || '',
    'CR': p.cr || '',
    'TEMPO DE CORTE ESTIMADO (H)': p.tempo_corte_estimado_horas ?? '',
    'STATUS': p.status,
    'OBSERVAÇÕES': p.observacoes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'PGMs')

  // Summary sheet
  const total = pgms.length
  const cortados = pgms.filter(p => p.status === 'Cortado').length
  const aguardando = pgms.filter(p => p.status === 'Aguardando Corte').length
  const emCorte = pgms.filter(p => p.status === 'Em Corte').length
  const pesoTotal = pgms.reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)
  const pesoCortado = pgms.filter(p => p.status === 'Cortado').reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)

  const filterDesc = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ') || 'Todos os registros'

  const summary = [
    ['RELATÓRIO CNC - GESTÃO DE PLANOS DE CORTE'],
    [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
    [`Filtros: ${filterDesc}`],
    [],
    ['RESUMO', ''],
    ['Total de PGMs', total],
    ['Aguardando Corte', aguardando],
    ['Em Corte', emCorte],
    ['Cortados', cortados],
    ['Peso Total (kg)', pesoTotal.toFixed(2)],
    ['Peso Cortado (kg)', pesoCortado.toFixed(2)],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

  const filename = `PGMs_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
  XLSX.writeFile(wb, filename)
}
