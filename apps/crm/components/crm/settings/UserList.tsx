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

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
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
      <div className="flex gap-2 mb-4">
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
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">Nenhum usuario encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {u.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {u.role ? (ROLE_LABEL[u.role] ?? u.role) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[u.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABEL[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.status === 'pending' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setSelectedRole('vendedor')
                            setApproveModal(u.id)
                          }}
                          className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                      )}
                      {u.status === 'active' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSuspend(u.id)}
                          className="text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}
                      {u.status === 'suspended' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleReactivate(u.id)}
                          className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aprovar usuario</h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecione a role para o usuario:
            </p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="vendedor">Vendedor</option>
              <option value="sdr">SDR</option>
            </select>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
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
