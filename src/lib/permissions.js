export const ROLE_CODES = {
  '01001': 'operacional_maquina',   // Programador (PCP) — cadastra e edita os PGMs
  '01011': 'operacional_pcp',       // Leitura geral (supervisão)
  '01100': 'gestao_fabrica',        // Gestão — acesso total
  '01101': 'executor_maquina',      // Operador de máquina — inicia/finaliza corte, preenche o CR
}

export const ROLE_LABELS = {
  operacional_maquina: 'Programador (PCP)',
  operacional_pcp: 'Operacional PCP (leitura)',
  gestao_fabrica: 'Gestão',
  executor_maquina: 'Operador de Máquina',
}

// operacional_pcp: somente leitura em tudo — view true, edit false
const PERMISSIONS = {
  operacional_maquina: {
    cargaMaquina: { view: true, edit: true },
  },
  operacional_pcp: {
    cargaMaquina: { view: true, edit: false },
  },
  gestao_fabrica: {
    cargaMaquina: { view: true, edit: true },
  },
  executor_maquina: {
    cargaMaquina: { view: true, edit: false },
  },
}

export function codeToRole(code) {
  return ROLE_CODES[code] || null
}

export function can(role, module, action = 'view') {
  if (!role || !PERMISSIONS[role]) return false
  return !!PERMISSIONS[role][module]?.[action]
}

// Apenas Programador (PCP) e Gestão cadastram novos PGMs
export function canCreatePGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

// Edição completa do formulário (todos os campos) — só quem programa
export function canEditPGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function canDeletePGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

// Operador de máquina (executor) + Programador + Gestão podem iniciar/finalizar corte
export function canStartCut(role) {
  return role === 'executor_maquina' || role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function canFinishCut(role) {
  return role === 'executor_maquina' || role === 'operacional_maquina' || role === 'gestao_fabrica'
}

// Único campo que o Operador de Máquina pode preencher/editar: o CR (código de rastreio)
export function canEditCR(role) {
  return role === 'executor_maquina' || role === 'operacional_maquina' || role === 'gestao_fabrica'
}

// Programação (calendário de corte): quem organiza a fila é o Programador (PCP) + Gestão
export function canSchedulePGMs(role) {
  return role === 'operacional_maquina' || role === 'gestao_fabrica'
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'Desconhecido'
}
