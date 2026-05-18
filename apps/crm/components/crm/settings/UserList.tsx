'use client'

import { useState } from 'react'
import { approveUser, suspendUser, reactivateUser } from '@/lib/actions/users'

interface User {
  id: string
  name: string | null
  email: string
  role: string | null
  status: string
  created_at: string
}

interface UserListProps {
  users: User[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  suspended: 'Suspenso',
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge badge-sq badge-amber',
  active:    'badge badge-sq badge-teal',
  suspended: 'badge badge-sq badge-coral',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  vendedor: 'Vendedor',
  sdr: 'SDR',
}

type UserRole = 'admin' | 'editor' | 'vendedor' | 'sdr'

export default function UserList({ users }: UserListProps) {
  const [filter, setFilter] = useState<string>('all')
  const [approveModal, setApproveModal] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendedor')
  const [loading, setLoading] = useState(false)

  const filtered = filter === 'all' ? users : users.filter((u) => u.status === filter)

  async function handleApprove() {
    if (!approveModal) return
    setLoading(true)
    await approveUser(approveModal, selectedRole)
    setApproveModal(null)
    setLoading(false)
  }

  async function handleSuspend(userId: string) {
    setLoading(true)
    await suspendUser(userId)
    setLoading(false)
  }

  async function handleReactivate(userId: string) {
    setLoading(true)
    await reactivateUser(userId)
    setLoading(false)
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'active', label: 'Ativos' },
          { key: 'suspended', label: 'Suspensos' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum usuario encontrado.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Role</th>
                <th>Status</th>
                <th>Criado em</th>
                <th style={{ textAlign: 'right' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name ?? '—'}</td>
                  <td style={{ color: 'var(--color-gray-600)' }}>{u.email}</td>
                  <td style={{ color: 'var(--color-gray-600)' }}>
                    {u.role ? (ROLE_LABEL[u.role] ?? u.role) : '—'}
                  </td>
                  <td>
                    <span className={STATUS_BADGE[u.status] ?? 'badge badge-sq badge-gray'}>
                      {STATUS_LABEL[u.status] ?? u.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-gray-400)' }}>
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      {u.status === 'pending' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setSelectedRole('vendedor')
                            setApproveModal(u.id)
                          }}
                          className="btn btn-sm btn-success"
                          style={{ opacity: loading ? 0.5 : 1 }}
                        >
                          Aprovar
                        </button>
                      )}
                      {u.status === 'active' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSuspend(u.id)}
                          className="btn btn-sm btn-danger"
                          style={{ opacity: loading ? 0.5 : 1 }}
                        >
                          Suspender
                        </button>
                      )}
                      {u.status === 'suspended' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleReactivate(u.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ opacity: loading ? 0.5 : 1 }}
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve modal */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 380, margin: 16, borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 16 }}>Aprovar usuario</h3>
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)', marginBottom: 16 }}>
              Selecione a role para o usuario:
            </p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="input"
              style={{ marginBottom: 16 }}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="vendedor">Vendedor</option>
              <option value="sdr">SDR</option>
            </select>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setApproveModal(null)} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="btn btn-success"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
