"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  ListPlus,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

const ENVIOS_SIMULTANEOS = 2;

interface Criado {
  id: string;
  title: string;
  slug: string;
}

interface Ignorado {
  title: string;
  motivo: string;
}

interface Resultado {
  criados: Criado[];
  ignorados: Ignorado[];
}

interface ArquivoNaFila {
  id: string;
  file: File;
  titulo: string;
  progresso: number;
  estado: "espera" | "enviando" | "pronto" | "erro";
  videoUrl?: string;
}

/** "MEU AMOR SECRETO.mp4" -> "Meu Amor Secreto" */
function tituloDoArquivo(nome: string): string {
  const semExtensao = nome.replace(/\.[^.]+$/, "");
  return semExtensao
    .replace(/[_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

/** Sobe o arquivo direto pro R2 com barra de progresso (fetch não reporta progresso de upload). */
function enviarProR2(
  file: File,
  signedUrl: string,
  onProgresso: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Falha no envio (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Erro de conexão"));
    xhr.send(file);
  });
}

export default function ImportarPage() {
  const [aba, setAba] = useState<"arquivos" | "lista">("arquivos");
  const [fila, setFila] = useState<ArquivoNaFila[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [publicados, setPublicados] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const atualizarItem = (id: string, mudanca: Partial<ArquivoNaFila>) =>
    setFila((f) => f.map((i) => (i.id === id ? { ...i, ...mudanca } : i)));

  const adicionarArquivos = (files: FileList) => {
    const novos: ArquivoNaFila[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      titulo: tituloDoArquivo(file.name),
      progresso: 0,
      estado: "espera",
    }));
    setFila((f) => [
      ...f,
      ...novos.filter((n) => !f.some((i) => i.id === n.id)),
    ]);
    setResultado(null);
    setErro("");
  };

  const cadastrar = async (
    items: { title: string; videoUrl: string }[]
  ): Promise<Resultado | null> => {
    const res = await fetch("/api/admin/movies/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error || "Não foi possível cadastrar.");
      return null;
    }
    return data as Resultado;
  };

  const enviarArquivos = async () => {
    const pendentes = fila.filter((i) => i.estado !== "pronto");
    if (pendentes.length === 0) return;

    setOcupado(true);
    setErro("");
    setResultado(null);

    const restantes = [...pendentes];
    const prontos: { title: string; videoUrl: string }[] = [];

    const trabalhador = async () => {
      while (restantes.length > 0) {
        const item = restantes.shift();
        if (!item) return;
        atualizarItem(item.id, { estado: "enviando", progresso: 0 });
        try {
          const res = await fetch("/api/admin/upload-r2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: item.file.name,
              contentType: item.file.type || "video/mp4",
            }),
          });
          const { signedUrl, publicUrl, error } = await res.json();
          if (!res.ok || !signedUrl) throw new Error(error || "Falha ao preparar envio");

          await enviarProR2(item.file, signedUrl, (pct) =>
            atualizarItem(item.id, { progresso: pct })
          );

          atualizarItem(item.id, {
            estado: "pronto",
            progresso: 100,
            videoUrl: publicUrl,
          });
          prontos.push({ title: item.titulo, videoUrl: publicUrl });
        } catch {
          atualizarItem(item.id, { estado: "erro" });
        }
      }
    };

    await Promise.all(
      Array.from({ length: ENVIOS_SIMULTANEOS }, () => trabalhador())
    );

    if (prontos.length === 0) {
      setErro("Nenhum vídeo subiu. Confira sua internet e tente de novo.");
    } else {
      const r = await cadastrar(prontos);
      if (r) setResultado(r);
    }
    setOcupado(false);
  };

  const importarLista = async () => {
    const items = texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((linha) => {
        const partes = linha.split("|").map((p) => p.trim());
        if (partes.length >= 2) {
          return { title: partes[0], videoUrl: partes[1] };
        }
        // Só o link: tira o título do nome do arquivo na URL
        const nome = decodeURIComponent(
          partes[0].split("?")[0].split("/").pop() || ""
        );
        return { title: tituloDoArquivo(nome), videoUrl: partes[0] };
      });

    if (items.length === 0) {
      setErro("Cole pelo menos uma linha.");
      return;
    }

    setOcupado(true);
    setErro("");
    setResultado(null);
    const r = await cadastrar(items);
    if (r) setResultado(r);
    setOcupado(false);
  };

  const publicarTodos = async () => {
    if (!resultado) return;
    setPublicando(true);
    const res = await fetch("/api/admin/movies/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: resultado.criados.map((c) => c.id),
        status: "active",
      }),
    });
    const data = await res.json();
    setPublicados(data.atualizados || 0);
    setPublicando(false);
  };

  const abaClasse = (ativa: boolean) =>
    `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition ${
      ativa
        ? "bg-primary text-white"
        : "bg-dark-card text-gray-400 hover:text-white border border-dark-border"
    }`;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Importar em massa</h1>
        <p className="text-gray-300 text-base mt-1 leading-relaxed">
          Cadastre vários títulos de uma vez. Eles entram como rascunho — você
          confere e publica depois.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setAba("arquivos")} className={abaClasse(aba === "arquivos")}>
          <UploadCloud size={18} />
          Enviar vídeos
        </button>
        <button onClick={() => setAba("lista")} className={abaClasse(aba === "lista")}>
          <ListPlus size={18} />
          Colar lista
        </button>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-base mb-5">
          {erro}
        </div>
      )}

      {aba === "arquivos" ? (
        <div className="space-y-4">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={ocupado}
            className="w-full border-2 border-dashed border-dark-border hover:border-primary disabled:opacity-50 rounded-2xl py-10 flex flex-col items-center gap-3 transition"
          >
            <UploadCloud size={32} className="text-primary" />
            <span className="text-base font-medium">Escolher vídeos do computador</span>
            <span className="text-sm text-gray-400">
              Pode selecionar vários de uma vez
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) adicionarArquivos(e.target.files);
              e.target.value = "";
            }}
          />

          {fila.length > 0 && (
            <>
              <div className="space-y-2">
                {fila.map((item) => (
                  <div
                    key={item.id}
                    className="bg-dark-card border border-dark-border rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <input
                          value={item.titulo}
                          onChange={(e) =>
                            atualizarItem(item.id, { titulo: e.target.value })
                          }
                          disabled={ocupado}
                          className="w-full bg-transparent text-base text-white focus:outline-none focus:bg-dark-lighter rounded px-2 py-1 -mx-2"
                        />
                        <p className="text-xs text-gray-500 truncate px-0 mt-0.5">
                          {item.file.name} ·{" "}
                          {(item.file.size / 1024 / 1024).toFixed(0)} MB
                        </p>
                      </div>
                      {item.estado === "enviando" && (
                        <span className="text-sm text-primary shrink-0">
                          {item.progresso}%
                        </span>
                      )}
                      {item.estado === "pronto" && (
                        <Check size={20} className="text-green-400 shrink-0" />
                      )}
                      {item.estado === "erro" && (
                        <AlertCircle size={20} className="text-red-400 shrink-0" />
                      )}
                      {item.estado === "espera" && !ocupado && (
                        <button
                          onClick={() =>
                            setFila((f) => f.filter((i) => i.id !== item.id))
                          }
                          className="text-gray-500 hover:text-red-400 shrink-0"
                          aria-label={`Remover ${item.titulo}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    {item.estado === "enviando" && (
                      <div className="h-1.5 bg-dark-lighter rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progresso}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={enviarArquivos}
                disabled={ocupado}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 py-4 rounded-xl font-semibold text-base transition"
              >
                {ocupado && <Loader2 size={20} className="animate-spin" />}
                {ocupado
                  ? "Enviando... não feche esta página"
                  : `Enviar e cadastrar ${fila.length} vídeo${fila.length > 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
            Uma linha por título, assim:
            <pre className="mt-2 text-primary whitespace-pre-wrap break-all">
              Meu Amor Secreto | https://link-do-video.mp4
            </pre>
            Se colar só o link, eu tiro o título do nome do arquivo.
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={ocupado}
            rows={10}
            placeholder={"Meu Amor Secreto | https://...\nO Herdeiro Perdido | https://..."}
            className="w-full bg-dark-lighter border border-dark-border rounded-xl px-4 py-3 text-white text-base placeholder-gray-500 focus:outline-none focus:border-primary transition font-mono"
          />

          <button
            onClick={importarLista}
            disabled={ocupado || !texto.trim()}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 py-4 rounded-xl font-semibold text-base transition"
          >
            {ocupado && <Loader2 size={20} className="animate-spin" />}
            {ocupado ? "Cadastrando..." : "Cadastrar lista"}
          </button>
        </div>
      )}

      {resultado && (
        <div className="mt-6 bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
          <p className="text-lg font-semibold text-green-400">
            {resultado.criados.length} título
            {resultado.criados.length === 1 ? "" : "s"} cadastrado
            {resultado.criados.length === 1 ? "" : "s"}
          </p>

          {resultado.ignorados.length > 0 && (
            <div className="text-base text-gray-300 space-y-1">
              <p className="text-yellow-400">
                {resultado.ignorados.length} não entraram:
              </p>
              {resultado.ignorados.map((i, n) => (
                <p key={n} className="text-sm text-gray-400">
                  {i.title} — {i.motivo}
                </p>
              ))}
            </div>
          )}

          {publicados > 0 ? (
            <p className="text-base text-green-400">
              {publicados} publicado{publicados === 1 ? "" : "s"} no site.
            </p>
          ) : (
            resultado.criados.length > 0 && (
              <button
                onClick={publicarTodos}
                disabled={publicando}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 py-4 rounded-xl font-semibold text-base transition"
              >
                {publicando && <Loader2 size={20} className="animate-spin" />}
                Publicar todos no site
              </button>
            )
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/bulk-images"
              className="flex-1 text-center py-3 rounded-xl border border-dark-border text-base hover:border-primary transition"
            >
              Colocar as capas
            </Link>
            <Link
              href="/admin/movies"
              className="flex-1 text-center py-3 rounded-xl border border-dark-border text-base hover:border-primary transition"
            >
              Ver filmes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
