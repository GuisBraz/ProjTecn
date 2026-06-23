import { db } from './firebase'
import {
  collection, addDoc, updateDoc, doc, deleteDoc,
  serverTimestamp, onSnapshot, query, orderBy,
} from 'firebase/firestore'

const COL = 'empreiteiras'

export function listenEmpreiteiras(callback) {
  const q = query(collection(db, COL), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function criarEmpreiteira(nome) {
  return addDoc(collection(db, COL), {
    nome: nome.trim(),
    ativo: true,
    createdAt: serverTimestamp(),
  })
}

export async function renomearEmpreiteira(id, nome) {
  return updateDoc(doc(db, COL, id), { nome: nome.trim() })
}

export async function desativarEmpreiteira(id) {
  return updateDoc(doc(db, COL, id), { ativo: false })
}

export async function reativarEmpreiteira(id) {
  return updateDoc(doc(db, COL, id), { ativo: true })
}

export async function excluirEmpreiteira(id) {
  return deleteDoc(doc(db, COL, id))
}
