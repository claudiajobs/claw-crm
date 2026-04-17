'use client'

import { useState } from 'react'
import TaskCreateForm from './TaskCreateForm'

interface Option {
  id: string
  label: string
}

interface TaskCreateToggleProps {
  leads: Option[]
  contacts: Option[]
}

export default function TaskCreateToggle({ leads, contacts }: TaskCreateToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tarefas</h1>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            + Nova tarefa
          </button>
        )}
      </div>
      {open && (
        <div className="mb-6">
          <TaskCreateForm leads={leads} contacts={contacts} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
