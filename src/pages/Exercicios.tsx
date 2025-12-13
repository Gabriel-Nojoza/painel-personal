import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/exercicios.css";

type Exercicio = {
  id: number;
  nome: string;
  musculo: string | null;
  imagem_url: string | null;
  video_url: string | null;
};

type Aluno = {
  id: string;
  nome: string;
  email?: string | null;
};

type TreinoItemForm = {
  exercicio_id: number;
  nome_exercicio: string;
  series: string;
  repeticoes: string;
  descanso: string;
  carga: string;
};

export default function Exercicios() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [nome, setNome] = useState("");
  const [musculo, setMusculo] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  // === ESTADO DO TREINO ===
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [showModalTreino, setShowModalTreino] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [nomeTreino, setNomeTreino] = useState("");
  const [diaTreino, setDiaTreino] = useState("");
  const [itensTreino, setItensTreino] = useState<TreinoItemForm[]>([]);
  const [salvandoTreino, setSalvandoTreino] = useState(false);

  // ==================================================
  // CARREGAMENTO DE DADOS
  // ==================================================

  useEffect(() => {
    carregarExercicios();
    carregarAlunos();
  }, []);

  async function carregarExercicios() {
    const { data, error } = await supabase.from("exercicios").select("*");

    if (!error && data) setExercicios(data as Exercicio[]);
  }

  async function carregarAlunos() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email")
      .eq("tipo", "aluno")
      .order("nome", { ascending: true });

    if (!error && data) setAlunos(data);
  }

  // ==================================================
  // UPLOAD
  // ==================================================

  async function uploadArquivo(file: File, pasta: string) {
    const nomeArquivo = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("exercicios-media")
      .upload(`${pasta}/${nomeArquivo}`, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) return null;

    const { data } = supabase.storage
      .from("exercicios-media")
      .getPublicUrl(`${pasta}/${nomeArquivo}`);

    return data.publicUrl;
  }

  // ==================================================
  // CADASTRAR EXERCÍCIO
  // ==================================================

  async function cadastrarExercicio(e: React.FormEvent) {
    e.preventDefault();

    let imagem_url: string | null = null;
    let video_url: string | null = null;

    if (imagem) imagem_url = await uploadArquivo(imagem, "imagens");
    if (video) video_url = await uploadArquivo(video, "videos");

    const { error } = await supabase
      .from("exercicios")
      .insert([{ nome, musculo, imagem_url, video_url }]);

    if (error) {
      alert("Erro ao cadastrar exercício!");
      return;
    }

    alert("Exercício cadastrado com sucesso!");
    setNome("");
    setMusculo("");
    setImagem(null);
    setVideo(null);
    carregarExercicios();
  }

  // ==================================================
  // EXCLUIR EXERCÍCIO
  // ==================================================

  async function excluirExercicio(id: number) {
    if (!confirm("Excluir este exercício?")) return;

    await supabase.from("exercicios").delete().eq("id", id);
    carregarExercicios();
  }

  // ==================================================
  // MODAL DE TREINO
  // ==================================================

  function abrirModalTreino() {
    setAlunoSelecionado("");
    setNomeTreino("");
    setDiaTreino("");
    setItensTreino([]);
    setShowModalTreino(true);
  }

  function fecharModalTreino() {
    if (!salvandoTreino) setShowModalTreino(false);
  }

  function toggleExercicioNoTreino(ex: Exercicio) {
    const existe = itensTreino.some((i) => i.exercicio_id === ex.id);

    if (existe) {
      setItensTreino((prev) =>
        prev.filter((i) => i.exercicio_id !== ex.id)
      );
    } else {
      setItensTreino((prev) => [
        ...prev,
        {
          exercicio_id: ex.id,
          nome_exercicio: ex.nome,
          series: "",
          repeticoes: "",
          descanso: "",
          carga: "",
        },
      ]);
    }
  }

  function atualizarCampoItem(id: number, campo: string, valor: string) {
    setItensTreino((prev) =>
      prev.map((i) =>
        i.exercicio_id === id ? { ...i, [campo]: valor } : i
      )
    );
  }

  // ==================================================
  // SALVAR TREINO (COM FUSÃO DE EXERCÍCIOS)
  // ==================================================

  async function salvarTreino() {
    if (!alunoSelecionado) return alert("Selecione o aluno.");
    if (!nomeTreino.trim()) return alert("Digite o nome do treino.");
    if (itensTreino.length === 0) return alert("Selecione exercícios.");

    setSalvandoTreino(true);

    try {
      // 1) VERIFICAR SE O ALUNO JÁ POSSUI UM TREINO COM ESSE NOME
      const { data: treinoExistente } = await supabase
        .from("treinos")
        .select("*")
        .eq("aluno_id", alunoSelecionado)
        .eq("nome", nomeTreino)
        .maybeSingle();

      let treinoId: number;

      // 2) SE EXISTIR → apenas adicionar exercícios
      if (treinoExistente) {
        treinoId = treinoExistente.id;
      } else {
        // Criar um novo treino
        const { data: novoTreino, error: erroCriar } = await supabase
          .from("treinos")
          .insert([
            {
              aluno_id: alunoSelecionado,
              nome: nomeTreino,
              dia: diaTreino || null,
            },
          ])
          .select("id")
          .single();

        if (erroCriar) throw erroCriar;

        treinoId = novoTreino.id;
      }

      // 3) INSERIR EXERCÍCIOS NO TREINO
      const payload = itensTreino.map((item, index) => ({
        treino_id: treinoId,
        exercicio_id: item.exercicio_id,
        series: Number(item.series) || null,
        repeticoes: Number(item.repeticoes) || null,

        // 🔥 CONVERSÃO CORRETA
        descanso: item.descanso
          ? Number(item.descanso) * 60
          : null,

        carga: Number(item.carga) || null,
        ordem: index + 1,
      }));


      await supabase.from("treinos_exercicios").insert(payload);

      alert("Treino salvo com sucesso!");
      setShowModalTreino(false);
    } catch (err) {
      alert("Erro ao salvar treino.");
      console.error(err);
    }

    setSalvandoTreino(false);
  }

  const diasSemana = [
    { value: "", label: "Sem dia específico" },
    { value: "segunda", label: "Segunda" },
    { value: "terca", label: "Terça" },
    { value: "quarta", label: "Quarta" },
    { value: "quinta", label: "Quinta" },
    { value: "sexta", label: "Sexta" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" },
  ];

  const isExSelecionado = (id: number) =>
    itensTreino.some((i) => i.exercicio_id === id);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="page ex-container">
      {/* HEADER */}
      <div className="page-header-row">
        <h1 className="page-title">Gerenciar Exercícios</h1>
        <button className="btn-primary btn-small" onClick={abrirModalTreino}>
          + Criar treino para aluno
        </button>
      </div>

      {/* FORM EXERCÍCIO */}
      <form className="ex-form" onSubmit={cadastrarExercicio}>
        <input
          type="text"
          placeholder="Nome do exercício"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          type="text"
          placeholder="Grupo muscular"
          value={musculo}
          onChange={(e) => setMusculo(e.target.value)}
        />

        <label className="file-label">
          Upload Imagem
          <input type="file" accept="image/*" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
        </label>

        <label className="file-label">
          Upload Vídeo (MP4)
          <input type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
        </label>

        <button className="btn-primary" type="submit">Cadastrar</button>
      </form>

      {/* LISTA DE EXERCÍCIOS */}
      <h2 className="section-title">Lista de Exercícios</h2>
      <div className="ex-list">
        {exercicios.map((ex) => (
          <div key={ex.id} className="ex-card">
            <div className="ex-header">
              <h3>{ex.nome}</h3>
              <span>{ex.musculo || "Sem grupo muscular"}</span>
            </div>

            <div className="ex-media-wrapper">
              {ex.imagem_url && <img src={ex.imagem_url} alt={ex.nome} className="ex-img" />}
              {ex.video_url && <video src={ex.video_url} controls className="ex-video" />}
            </div>

            <button className="btn-danger" onClick={() => excluirExercicio(ex.id)}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* MODAL TREINO */}
      {showModalTreino && (
        <div className="modal-backdrop" onClick={fecharModalTreino}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar treino para aluno</h2>
              <button className="modal-close" onClick={fecharModalTreino}>×</button>
            </div>

            <div className="modal-body">
              <div className="treino-form-grid">

                {/* ALUNO */}
                <div className="treino-field">
                  <label>Aluno</label>
                  <select value={alunoSelecionado} onChange={(e) => setAlunoSelecionado(e.target.value)}>
                    <option value="">Selecione um aluno</option>
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>

                {/* NOME TREINO */}
                <div className="treino-field">
                  <label>Nome do treino</label>
                  <input
                    type="text"
                    value={nomeTreino}
                    onChange={(e) => setNomeTreino(e.target.value)}
                    placeholder="Ex: Treino A"
                  />
                </div>

                {/* DIA */}
                <div className="treino-field">
                  <label>Dia do treino</label>
                  <select value={diaTreino} onChange={(e) => setDiaTreino(e.target.value)}>
                    {diasSemana.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* LISTA EXERCÍCIOS */}
              <div className="modal-section">
                <h3>Selecione os exercícios</h3>

                <div className="treino-ex-list">
                  {exercicios.map((ex) => (
                    <button
                      type="button"
                      key={ex.id}
                      className={"treino-ex-card" + (isExSelecionado(ex.id) ? " selected" : "")}
                      onClick={() => toggleExercicioNoTreino(ex)}
                    >
                      <span>{ex.nome}</span>
                      <span>{ex.musculo || "—"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DETALHES DOS EXERCÍCIOS */}
              {itensTreino.length > 0 && (
                <div className="modal-section">
                  <h3>Detalhes do treino</h3>

                  <div className="treino-itens-table">
                    <div className="treino-itens-header">
                      <span>Exercício</span>
                      <span>Séries</span>
                      <span>Reps</span>
                      <span>Desc. (min)</span>
                      <span>Carga</span>
                    </div>

                    {itensTreino.map((item) => (
                      <div key={item.exercicio_id} className="treino-itens-row">

                        <span>{item.nome_exercicio}</span>

                        <input
                          type="number"
                          value={item.series}
                          onChange={(e) =>
                            atualizarCampoItem(item.exercicio_id, "series", e.target.value)
                          }
                        />

                        <input
                          type="number"
                          value={item.repeticoes}
                          onChange={(e) =>
                            atualizarCampoItem(item.exercicio_id, "repeticoes", e.target.value)
                          }
                        />

                        <input
                          type="number"
                          value={item.descanso}
                          onChange={(e) =>
                            atualizarCampoItem(item.exercicio_id, "descanso", e.target.value)
                          }
                        />

                        <input
                          type="number"
                          value={item.carga}
                          onChange={(e) =>
                            atualizarCampoItem(item.exercicio_id, "carga", e.target.value)
                          }
                        />

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={fecharModalTreino}>Cancelar</button>

              <button
                className="btn-primary"
                disabled={salvandoTreino}
                onClick={salvarTreino}
              >
                {salvandoTreino ? "Salvando..." : "Salvar treino"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
