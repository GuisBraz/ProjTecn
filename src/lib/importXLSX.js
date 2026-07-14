// Importador de PGMs via Excel.
// Colunas reconhecidas (cabeçalho na primeira linha, sem distinção de maiúsculas/acento):
//   PGM* | COMMESSA* | ESPESSURA (MM) | PESO (KG) | MATERIAL | CR | FORNECEDOR |
//   REV | DATA DE EMISSAO | OBSERVACOES | CORTES (quantidade de vezes que o PGM será cortado)
// Quando CORTES > 1, o PGM é desdobrado em N registros: PGM-0001-1, PGM-0001-2, ...
import * as XLSX from 'xlsx'

const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]/g, '')

const COLUMN_MAP = {
  PGM: 'pgm', PGMS: 'pgm',
  COMMESSA: 'commessa',
  ESPESSURA: 'espessura_mm', ESPESSURAMM: 'espessura_mm',
  PESO: 'peso_kg', PESOKG: 'peso_kg',
  MATERIAL: 'material',
  CR: 'cr',
  REV: 'rev', REVISAO: 'rev',
  DATADEEMISSAO: 'data_emissao', EMISSAO: 'data_emissao', DATAEMISSAO: 'data_emissao',
  OBSERVACOES: 'observacoes', OBS: 'observacoes',
  CORTES: 'cortes', QTDCORTES: 'cortes', QUANTIDADEDECORTES: 'cortes', VEZES: 'cortes',
  TEMPODECORTE: 'tempo_corte_estimado_horas', TEMPODECORTEH: 'tempo_corte_estimado_horas',
  TEMPODECORTEESTIMADO: 'tempo_corte_estimado_horas', TEMPODECORTEESTIMADOH: 'tempo_corte_estimado_horas',
  TEMPOCORTE: 'tempo_corte_estimado_horas',
}

function excelDateToISO(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    // Data serial do Excel
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(v).trim()
  // dd/mm/yyyy → yyyy-mm-dd
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return null
}

// Lê o arquivo e retorna { pgms, erros }
// pgms: já desdobrados pela quantidade de cortes, prontos para gravar.
export async function parsePGMsFromFile(file) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

  const pgms = []
  const erros = []

  raw.forEach((row, i) => {
    const linha = i + 2 // +1 do cabeçalho, +1 pra bater com o número da linha no Excel
    const r = {}
    Object.entries(row).forEach(([k, v]) => {
      const field = COLUMN_MAP[norm(k)]
      if (field) r[field] = v
    })

    const pgm = String(r.pgm || '').trim()
    const commessa = String(r.commessa || '').trim()
    if (!pgm && !commessa) return // linha vazia
    if (!pgm) { erros.push(`Linha ${linha}: PGM em branco`); return }
    if (!commessa) { erros.push(`Linha ${linha}: Commessa em branco`); return }

    const cortes = Math.max(1, Math.min(20, parseInt(r.cortes, 10) || 1))
    const base = {
      commessa,
      espessura_mm: r.espessura_mm !== '' && r.espessura_mm != null ? parseFloat(r.espessura_mm) : null,
      peso_kg: r.peso_kg !== '' && r.peso_kg != null ? parseFloat(r.peso_kg) : null,
      material: String(r.material || '').trim() || null,
      cr: String(r.cr || '').trim() || null,
      rev: String(r.rev || '').trim() || '00',
      data_emissao: excelDateToISO(r.data_emissao),
      observacoes: String(r.observacoes || '').trim() || null,
      tempo_corte_estimado_horas: r.tempo_corte_estimado_horas !== '' && r.tempo_corte_estimado_horas != null
        ? Math.max(0.5, parseFloat(r.tempo_corte_estimado_horas) || 4) : 4,
    }

    if (cortes === 1) {
      pgms.push({ ...base, pgm })
    } else {
      for (let c = 1; c <= cortes; c++) {
        pgms.push({ ...base, pgm: `${pgm}-${c}`, corte_n: c, corte_total: cortes })
      }
    }
  })

  return { pgms, erros }
}

// Gera uma planilha modelo para o usuário preencher
export function downloadModelo() {
  const rows = [{
    'PGM': 'PGM-2025-001', 'COMMESSA': '2025-006', 'ESPESSURA (MM)': 12.5, 'PESO (KG)': 125.5,
    'MATERIAL': 'ASTM A36', 'CR': '', 'REV': '00',
    'DATA DE EMISSAO': '01/07/2026', 'CORTES': 2, 'TEMPO DE CORTE (H)': 4,
    'OBSERVACOES': 'Exemplo: CORTES=2 vira PGM-2025-001-1 e -2',
  }]
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 40 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'PGMs')
  XLSX.writeFile(wb, 'modelo_importacao_pgms.xlsx')
}
