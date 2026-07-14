// Histórico de alterações (auditoria) — grava em 'pgm_logs' quem fez o quê e quando.
// Best-effort: se a gravação do log falhar, não interrompe a ação principal.
import { db } from './firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore'

export async function logAction({ user, action, pgmId, pgmLabel, details }) {
  try {
    await addDoc(collection(db, 'pgm_logs'), {
      action,                                   // 'criou' | 'editou' | 'excluiu' | 'iniciou corte' | 'finalizou corte' | 'reativou' | 'programou' | 'removeu da programação' | 'salvou CR'
      pgmId: pgmId || null,
      pgmLabel: pgmLabel || '',
      details: details || null,
      userName: user?.displayName || user?.email || 'Desconhecido',
      userId: user?.uid || user?.id || null,
      at: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Falha ao gravar log de auditoria:', e)
  }
}

export async function fetchLogsForPgm(pgmId, max = 50) {
  // Sem orderBy na query para não exigir índice composto no Firestore;
  // a ordenação é feita aqui no cliente.
  const q = query(
    collection(db, 'pgm_logs'),
    where('pgmId', '==', pgmId),
    limit(200),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0))
    .slice(0, max)
}
