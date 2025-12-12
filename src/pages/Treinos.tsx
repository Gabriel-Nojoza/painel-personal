import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import "../styles/treinos.css";

// ===============================
// TIPAGEM CORRETA DO SUPABASE
// ===============================
type TreinoDB = {
  id: number;
  nome: string;
  dia: string | null;
  aluno_id: string | null;
  usuarios: {
    nome: string;
  } | null;
};

export default function Treinos() {
  const [treinos, setTreinos] = useState<TreinoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarTreinos();
  }, []);

  // ===============================
  // CARREGAR TREINOS
  // ===============================
  async function carregarTreinos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("treinos")
      .select(`
        id,
        nome,
        dia,
        aluno_id,
        usuarios:aluno_id (
          nome
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar treinos:", error);
      setTreinos([]);
      setLoading(false);
      return;
    }

    setTreinos(data ?? []);
    setLoading(false);
  }

  // ===============================
  // EXCLUIR TREINO
  // ===============================
  async function excluirTreino(id: number) {
    if (!confirm("Deseja realmente excluir este treino?")) return;

    await supabase
      .from("treinos_exercicios")
      .delete()
      .eq("treino_id", id);

    const { error } = await supabase
      .from("treinos")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir treino");
      return;
    }

    carregarTreinos();
  }

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="treinos-page">
      <h1 className="treinos-title">Treinos Cadastrados</h1>

      {loading && <p className="loading-text">Carregando...</p>}

      {!loading && treinos.length === 0 && (
        <p className="empty-text">Nenhum treino cadastrado ainda.</p>
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
                {treino.usuarios?.nome || "Aluno não encontrado"}
              </p>

              <div className="acoes-card">
                <button
                  className="btn-editar"
                  onClick={() =>
                    navigate(`/treinos-editar/${treino.id}`)
                  }
                >
                  Editar
                </button>

                <button
                  className="btn-excluir"
                  onClick={() => excluirTreino(treino.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
