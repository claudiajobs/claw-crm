'use client'

import { useState } from 'react'
import TaskCreateForm from './TaskCreateForm'
import { IconPlus } from '@tabler/icons-react'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="topbar-title">Tarefas</h1>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
            <IconPlus size={14} stroke={1.5} aria-hidden />
            Nova tarefa
          </button>
        )}
      </div>
      {open && (
        <div style={{ marginBottom: 24 }}>
          <TaskCreateForm leads={leads} contacts={contacts} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
