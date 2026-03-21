"use client";

import { useState, useEffect } from "react";
import { Trash2, Shield, ShieldOff } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { favorites: number; watchProgress: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`${newRole === "admin" ? "Promover" : "Rebaixar"} ${user.name}?`))
      return;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deletar usuário "${name}"? Esta ação não pode ser desfeita.`))
      return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-gray-400 text-left">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3 hidden md:table-cell">Stats</th>
                  <th className="px-4 py-3 hidden md:table-cell">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-border hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.role === "admin"
                            ? "bg-primary/20 text-primary"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                      {user._count.favorites} favs · {user._count.watchProgress}{" "}
                      assistidos
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleRole(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                          title={
                            user.role === "admin"
                              ? "Rebaixar para usuário"
                              : "Promover a admin"
                          }
                        >
                          {user.role === "admin" ? (
                            <ShieldOff size={14} className="text-yellow-400" />
                          ) : (
                            <Shield size={14} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-center py-10 text-gray-500">Nenhum usuário</p>
          )}
        </div>
      )}
    </div>
  );
}
