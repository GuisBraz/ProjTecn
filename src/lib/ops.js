import { db } from './firebase'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, where,
} from 'firebase/firestore'

const COL = 'ops'

export function listenOps(empreiteiraId, status, callback) {
  const q = query(
    collection(db, COL),
    where('empreiteiraId', '==', empreiteiraId),
    where('status', '==', status)
  )
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    callback(data)
  })
}

// Usado pelo dashboard — escuta todas as OPs de uma vez (independente de empreiteira/status)
export function listenAllOps(callback) {
  return onSnapshot(collection(db, COL), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function criarOp(payload) {
  return addDoc(collection(db, COL), {
    ...payload,
    status: 'ativa',
    createdAt: serverTimestamp(),
  })
}

export async function atualizarOp(id, payload) {
  return updateDoc(doc(db, COL, id), { ...payload, updatedAt: serverTimestamp() })
}

export async function finalizarOp(id) {
  return updateDoc(doc(db, COL, id), {
    status: 'finalizada',
    dataFinalizacao: new Date().toISOString(),
  })
}

export async function reabrirOp(id) {
  return updateDoc(doc(db, COL, id), { status: 'ativa', dataFinalizacao: null })
}

export async function excluirOp(id) {
  return deleteDoc(doc(db, COL, id))
}
