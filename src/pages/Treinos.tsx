import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/treinos.css";

/* ===============================
   TIPOS (SEM CONFLITO)
================================ */

type UsuarioTreino = {
  nome: string;
};

type TreinoDB = {
  id: number;
  nome: string;
  dia: string | null;
  aluno_id: string | null;
  usuarios: UsuarioTreino[] | null;
};

/* ===============================
   COMPONENTE
================================ */

export default function Treinos() {
  const [treinos, setTreinos] = useState<TreinoDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTreinos();
  }, []);

  /* ===============================
     CARREGAR TREINOS
  ================================ */
  async function carregarTreinos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("treinos")
      .select(
        `
        id,
        nome,
        dia,
        aluno_id,
        usuarios:aluno_id (
          nome
        )
      `
      )
      .order("id", { ascending: false })
      .returns<TreinoDB[]>(); // 🔥 ESSENCIAL PARA O BUILD

    if (error) {
      console.error("Erro ao carregar treinos:", error);
      setTreinos([]);
      setLoading(false);
      return;
    }

    setTreinos(data ?? []);
    setLoading(false);
  }

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="page">
      <h1 className="page-title">Treinos</h1>

      {loading && <p>Carregando treinos...</p>}

      {!loading && treinos.length === 0 && (
        <p>Nenhum treino cadastrado.</p>
      )}

      {!loading && treinos.length > 0 && (
        <div className="treinos-grid">
          {treinos.map((treino) => (
            <div key={treino.id} className="treino-card">
              <h3 className="treino-nome">{treino.nome}</h3>

              <p className="treino-info">
                <b>Dia:</b> {treino.dia || "Não definido"}
              </p>

              <p className="treino-info">
                <b>Aluno:</b>{" "}
                {treino.usuarios?.[0]?.nome ?? "Aluno não encontrado"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
