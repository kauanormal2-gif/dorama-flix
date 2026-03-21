"use client";

import { useState, useEffect, use } from "react";
import MovieForm from "../MovieForm";

interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  bannerUrl: string | null;
  year: number | null;
  duration: string | null;
  rating: number | null;
  featured: boolean;
  status: string;
  categories: { categoryId: string; category: { name: string } }[];
}

export default function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    fetch(`/api/admin/movies`)
      .then((r) => r.json())
      .then((d) => {
        const found = d.movies?.find((m: Movie) => m.id === id);
        setMovie(found || null);
      });
  }, [id]);

  if (!movie) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Filme</h1>
      <MovieForm movie={movie} />
    </div>
  );
}
