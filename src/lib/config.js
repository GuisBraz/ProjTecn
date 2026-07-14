// Configuração compartilhada da fábrica: horário de expediente e paradas programadas.
// Fica em Firestore (não é por usuário) — todo mundo lê, só quem programa edita.
import { useEffect, useState } from 'react'
import { db } from './firebase'
import {
  doc, onSnapshot, setDoc, collection, addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'

const DEFAULT_EXPEDIENTE = { horaInicio: 6, horaFim: 22 }

export function useExpediente() {
  const [expediente, setExpediente] = useState(DEFAULT_EXPEDIENTE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'geral'), (snap) => {
      if (snap.exists() && snap.data().horaInicio != null && snap.data().horaFim != null) {
        setExpediente({ horaInicio: Number(snap.data().horaInicio), horaFim: Number(snap.data().horaFim) })
      } else {
        setExpediente(DEFAULT_EXPEDIENTE)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return { expediente, loading }
}

export async function salvarExpediente(horaInicio, horaFim) {
  await setDoc(doc(db, 'config', 'geral'), { horaInicio, horaFim, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Paradas programadas (feriados, manutenção) ──
export function useParadas() {
  const [paradas, setParadas] = useState([])
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'paradas'), (snap) => {
      setParadas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])
  return paradas
}

export async function addParada({ data, maquina, motivo }) {
  await addDoc(collection(db, 'paradas'), { data, maquina, motivo: motivo || '', createdAt: serverTimestamp() })
}

export async function removeParada(id) {
  await deleteDoc(doc(db, 'paradas', id))
}

// Verifica se uma data (Date) está bloqueada pra uma máquina
export function isDataBloqueada(date, maquina, paradas) {
  const iso = date.toISOString().slice(0, 10)
  return paradas.some((p) => p.data === iso && (p.maquina === maquina || p.maquina === 'AMBAS'))
}
