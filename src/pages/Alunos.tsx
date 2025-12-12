import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/alunos.css";

export default function Alunos() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    carregarAlunos();
  }, []);

  // -----------------------------------------------------
  //  CARREGAR ALUNOS
  // -----------------------------------------------------
  async function carregarAlunos() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("tipo", "aluno")
      .order("criado_em", { ascending: false });

    if (!error && data) {
      setAlunos(data);
    }
  }

  // -----------------------------------------------------
  //  CADASTRAR ALUNO
  // -----------------------------------------------------
  async function cadastrarAluno(e: any) {
    e.preventDefault();

    if (!nome || !email || !senha) {
      alert("Preencha todos os campos!");
      return;
    }

    const { error } = await supabase.from("usuarios").insert([
      {
        nome,
        email,
        senha,
        tipo: "aluno"
      }
    ]);

    if (error) {
      alert("Erro ao salvar aluno no banco: " + error.message);
      return;
    }

    alert("Aluno cadastrado com sucesso!");

    // Limpar campos
    setNome("");
    setEmail("");
    setSenha("");

    // CORRIGIDO: antes estava buscarAlunos()
    carregarAlunos();
  }

  // -----------------------------------------------------
  //  EXCLUIR ALUNO
  // -----------------------------------------------------
  async function excluirAluno(id: string, authId: string) {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;

    // Remover do Auth (se existir authId)
    if (authId) {
      await supabase.rpc("delete_user", { uid: authId });
    }

    // Remover do banco
    await supabase.from("usuarios").delete().eq("id", id);

    carregarAlunos();
  }

  return (
    <div className="page alunos-container">
      <h1>Gerenciar Alunos</h1>

      <form className="aluno-form" onSubmit={cadastrarAluno}>
        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          type="email"
          placeholder="E-mail do aluno"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha de acesso"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button className="btn-primary" type="submit">
          Cadastrar Aluno
        </button>
      </form>

      <h2>Lista de Alunos</h2>

      <table className="alunos-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id}>
              <td>{aluno.nome}</td>
              <td>{aluno.email}</td>
              <td>{new Date(aluno.criado_em).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn-danger"
                  onClick={() => excluirAluno(aluno.id, aluno.auth_id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
