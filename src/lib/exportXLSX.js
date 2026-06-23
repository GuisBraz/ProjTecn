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
    'FORNECEDOR': p.fornecedor || '',
    'STATUS': p.status,
    'OBSERVAÇÕES': p.observacoes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
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

export function exportOps(ops, empreiteiraNome = '') {
  const rows = ops.map((o, i) => ({
    'ITEM': i + 1,
    'N° OP': o.numero_op,
    'N° PRODUTO': o.numero_produto || '',
    'COMMESSA': o.commessa,
    'DESENHO': o.desenho || '',
    'DESCRIÇÃO': o.descricao || '',
    'QUANTIDADE': o.quantidade ?? '',
    'PESO (KG)': o.peso ?? '',
    'EMPREITEIRA': o.empreiteiraNome || empreiteiraNome || '',
    'DATA DE INÍCIO': fmt(o.data_inicio),
    'PREVISÃO DE TÉRMINO': fmt(o.previsao_termino),
    'DATA DE FINALIZAÇÃO': fmtDT(o.dataFinalizacao),
    'STATUS': o.status === 'finalizada' ? 'Finalizada' : 'Ativa',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 18 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'OPs')

  const total = ops.length
  const finalizadas = ops.filter((o) => o.status === 'finalizada').length
  const ativas = total - finalizadas
  const pesoTotal = ops.reduce((s, o) => s + (Number(o.peso) || 0), 0)

  const summary = [
    ['RELATÓRIO — CARGA FÁBRICA'],
    [`Empreiteira: ${empreiteiraNome || 'Todas'}`],
    [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
    [],
    ['RESUMO', ''],
    ['Total de OPs', total],
    ['Ativas', ativas],
    ['Finalizadas', finalizadas],
    ['Peso Total (kg)', pesoTotal.toFixed(2)],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

  const filename = `OPs_${empreiteiraNome ? empreiteiraNome.replace(/\s+/g, '_') + '_' : ''}${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
  XLSX.writeFile(wb, filename)
}

export function exportAllOps(ops, empreiteiras = []) {
  const fmt = (d) => d ? format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) : ''
  const fmtDT = (d) => d ? format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''

  const wb = XLSX.utils.book_new()

  // Sheet por empreiteira
  empreiteiras.forEach((emp) => {
    const empOps = ops.filter(o => o.empreiteiraId === emp.id)
    if (empOps.length === 0) return
    const rows = empOps.map((o, i) => ({
      'ITEM': i + 1,
      'N° OP': o.numero_op,
      'N° PRODUTO': o.numero_produto || '',
      'COMMESSA': o.commessa,
      'DESENHO': o.desenho || '',
      'DESCRIÇÃO': o.descricao || '',
      'QUANTIDADE': o.quantidade ?? '',
      'PESO (KG)': o.peso ?? '',
      'DATA DE INÍCIO': fmt(o.data_inicio),
      'PREVISÃO TÉRMINO': fmt(o.previsao_termino),
      'FINALIZAÇÃO': fmtDT(o.dataFinalizacao),
      'STATUS': o.status === 'finalizada' ? 'Finalizada' : 'Ativa',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }]
    const sheetName = emp.nome.slice(0, 31).replace(/[\\/*?:[\]]/g, '')
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  // Sheet geral
  const allRows = ops.map((o, i) => ({
    'ITEM': i + 1,
    'N° OP': o.numero_op,
    'EMPREITEIRA': o.empreiteiraNome || '',
    'COMMESSA': o.commessa,
    'DESENHO': o.desenho || '',
    'DESCRIÇÃO': o.descricao || '',
    'QUANTIDADE': o.quantidade ?? '',
    'PESO (KG)': o.peso ?? '',
    'DATA DE INÍCIO': fmt(o.data_inicio),
    'PREVISÃO TÉRMINO': fmt(o.previsao_termino),
    'STATUS': o.status === 'finalizada' ? 'Finalizada' : 'Ativa',
  }))
  const wsAll = XLSX.utils.json_to_sheet(allRows)
  wsAll['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsAll, 'Todas as OPs')

  // Resumo
  const ativas     = ops.filter(o => o.status === 'ativa').length
  const finalizadas = ops.filter(o => o.status === 'finalizada').length
  const pesoTotal  = ops.reduce((s, o) => s + (Number(o.peso) || 0), 0)
  const summary = [
    ['RELATÓRIO GERAL — CARGA FÁBRICA'],
    [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
    [],
    ['RESUMO GERAL', ''],
    ['Total de OPs', ops.length],
    ['Ativas', ativas],
    ['Finalizadas', finalizadas],
    ['Peso Total (kg)', pesoTotal.toFixed(2)],
    [],
    ['POR EMPREITEIRA', 'Ativas', 'Finalizadas', 'Peso (kg)'],
    ...empreiteiras.map(emp => {
      const empOps = ops.filter(o => o.empreiteiraId === emp.id)
      return [
        emp.nome,
        empOps.filter(o => o.status === 'ativa').length,
        empOps.filter(o => o.status === 'finalizada').length,
        empOps.reduce((s, o) => s + (Number(o.peso) || 0), 0).toFixed(2),
      ]
    }),
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

  XLSX.writeFile(wb, `OPs_Geral_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`)
}
