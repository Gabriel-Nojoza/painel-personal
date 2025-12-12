import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/treinoeditar.css";

/* =========================
   TIPAGENS
========================= */
type Exercicio = {
  id: number;
  nome: string;
};

type ItemTreino = {
  id: number;
  exercicio_id: number;
  nome: string;
};

/* =========================
   COMPONENTE
========================= */
export default function TreinoEditar() {
  const { id } = useParams();
  const treinoId = Number(id);

  const [loading, setLoading] = useState(true);
  const [treinoNome, setTreinoNome] = useState("");
  const [itens, setItens] = useState<ItemTreino[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [showModal, setShowModal] = useState(false);

  /* =========================
     CARREGAR TREINO
  ========================= */
  async function carregarTreino() {
    setLoading(true);

    const { data: treino, error: erroTreino } = await supabase
      .from("treinos")
      .select("nome")
      .eq("id", treinoId)
      .single();

    if (erroTreino) {
      console.error("Erro ao carregar treino:", erroTreino);
      setLoading(false);
      return;
    }

    const { data: itensTreino, error: erroItens } = await supabase
      .from("treinos_exercicios")
      .select(
        `
        id,
        exercicio_id,
        exercicios ( nome )
      `
      )
      .eq("treino_id", treinoId)
      .order("id");

    if (erroItens) {
      console.error("Erro ao carregar exercícios:", erroItens);
      setLoading(false);
      return;
    }

    setTreinoNome(treino?.nome ?? "");

    const normalizado: ItemTreino[] = (itensTreino ?? []).map((item: any) => ({
      id: item.id,
      exercicio_id: item.exercicio_id,
      nome: item.exercicios?.nome ?? "",
    }));

    setItens(normalizado);
    setLoading(false);
  }

  /* =========================
     CARREGAR EXERCÍCIOS
  ========================= */
  async function carregarExercicios() {
    const { data, error } = await supabase
      .from("exercicios")
      .select("id, nome")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar exercícios:", error);
      return;
    }

    setExercicios(data ?? []);
  }

  useEffect(() => {
    carregarTreino();
    carregarExercicios();
  }, []);

  /* =========================
     ADICIONAR EXERCÍCIO
  ========================= */
  async function adicionarExercicio(ex: Exercicio) {
    const jaExiste = itens.some(
      (item) => item.exercicio_id === ex.id
    );

    if (jaExiste) {
      alert("Este exercício já está neste treino.");
      return;
    }

    const { error } = await supabase
      .from("treinos_exercicios")
      .insert({
        treino_id: treinoId,
        exercicio_id: ex.id,
      });

    if (error) {
      alert("Erro ao adicionar exercício.");
      return;
    }

    await carregarTreino();
    setShowModal(false);
  }

  /* =========================
     REMOVER EXERCÍCIO
  ========================= */
  async function removerExercicio(itemId: number) {
    if (!confirm("Remover este exercício do treino?")) return;

    const { error } = await supabase
      .from("treinos_exercicios")
      .delete()
      .eq("id", itemId);

    if (error) {
      alert("Erro ao remover exercício.");
      return;
    }

    carregarTreino();
  }

  /* =========================
     RENDERIZAÇÃO
  ========================= */
  if (loading) {
    return <p className="loading">Carregando treino...</p>;
  }

  return (
    <div className="treino-editar-page">
      {/* HEADER */}
      <div className="treino-editar-header">
        <h1 className="treino-editar-title">
          Editar Treino: {treinoNome}
        </h1>
        <p className="treino-editar-subtitle">
          Gerencie os exercícios deste treino
        </p>
      </div>

      {/* BOTÃO */}
      <button
        className="btn-adicionar"
        onClick={() => setShowModal(true)}
      >
        + Adicionar exercício
      </button>

      {/* LISTA */}
      {itens.length === 0 ? (
        <p className="empty-text">
          Nenhum exercício adicionado ainda.
        </p>
      ) : (
        <div className="exercicios-grid">
          {itens.map((item) => (
            <div key={item.id} className="exercicio-card">
              <div className="exercicio-info">
                <span className="exercicio-nome">
                  {item.nome}
                </span>
                <span className="exercicio-musculo">
                  Exercício do treino
                </span>
              </div>

              <div className="exercicio-actions">
                <button
                  className="btn-remover"
                  onClick={() => removerExercicio(item.id)}
                >
                  ✕ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">
              Adicionar exercício ao treino
            </h3>

            <div className="modal-exercicios">
              {exercicios.map((ex) => {
                const jaExiste = itens.some(
                  (i) => i.exercicio_id === ex.id
                );

                return (
                  <button
                    key={ex.id}
                    className="modal-exercicio-btn"
                    disabled={jaExiste}
                    onClick={() => adicionarExercicio(ex)}
                  >
                    {ex.nome}
                    {jaExiste && " • já adicionado"}
                  </button>
                );
              })}
            </div>

            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
