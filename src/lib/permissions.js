export const ROLE_CODES = {
  '01001': 'operacional_maquina',
  '01010': 'operacional_fabrica',
  '01011': 'operacional_pcp',
  '01100': 'gestao_fabrica',
}

export const ROLE_LABELS = {
  operacional_maquina: 'Operacional Máquina',
  operacional_fabrica: 'Operacional Fábrica',
  operacional_pcp: 'Operacional PCP',
  gestao_fabrica: 'Gestão de Fábrica',
}

// operacional_pcp: somente leitura em tudo — view true, edit false em todos os módulos
const PERMISSIONS = {
  operacional_maquina: {
    cargaMaquina: { view: true, edit: true },
    cargaFabrica: { view: false, edit: false },
  },
  operacional_fabrica: {
    cargaMaquina: { view: false, edit: false },
    cargaFabrica: { view: true, edit: true },
  },
  operacional_pcp: {
    cargaMaquina: { view: true, edit: false },
    cargaFabrica: { view: true, edit: false },
  },
  gestao_fabrica: {
    cargaMaquina: { view: true, edit: true },
    cargaFabrica: { view: true, edit: true },
  },
}

export function codeToRole(code) {
  return ROLE_CODES[code] || null
}

export function can(role, module, action = 'view') {
  if (!role || !PERMISSIONS[role]) return false
  return !!PERMISSIONS[role][module]?.[action]
}

// PCP não pode gerenciar empreiteiras
export function canManageEmpreiteiras(role) {
  return role === 'gestao_fabrica'
}

// Apenas gestão cria OPs
export function canCreateOps(role) {
  return role === 'gestao_fabrica'
}

// Apenas gestão edita OPs
export function canEditOps(role) {
  return role === 'gestao_fabrica'
}

// Operacional fábrica e gestão podem finalizar/reabrir
export function canFinalizeOps(role) {
  return role === 'operacional_fabrica' || role === 'gestao_fabrica'
}

// Apenas gestão exclui
export function canDeleteOps(role) {
  return role === 'gestao_fabrica'
}

// PCP — somente leitura, sem nenhuma ação de escrita em PGMs
export function canEditPGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function canCreatePGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function canDeletePGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'Desconhecido'
}
