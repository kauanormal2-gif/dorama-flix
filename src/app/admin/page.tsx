"use client";

import { useState, useEffect } from "react";
import { Film, Users, Eye, Heart } from "lucide-react";

interface Stats {
  totalMovies: number;
  totalUsers: number;
  totalViews: number;
  totalFavorites: number;
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  createdAt: string;
  movie: { title: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setEvents(d.recentAnalytics || []);
      });
  }, []);

  const statCards = [
    { label: "Filmes", value: stats?.totalMovies || 0, icon: Film, color: "text-primary" },
    { label: "Usuários", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400" },
    { label: "Visualizações", value: stats?.totalViews || 0, icon: Eye, color: "text-green-400" },
    { label: "Favoritos", value: stats?.totalFavorites || 0, icon: Heart, color: "text-pink-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-dark-card border border-dark-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {card.label}
              </span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma atividade ainda</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm py-2 border-b border-dark-border last:border-0"
              >
                <div>
                  <span className="text-white">{event.movie.title}</span>
                  <span className="text-gray-500 ml-2">
                    ({event.eventType === "view" ? "visualização" : event.eventType === "watch_start" ? "assistiu" : "completou"})
                  </span>
                </div>
                <span className="text-gray-600 text-xs">
                  {new Date(event.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
