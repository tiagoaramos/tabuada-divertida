import { useState } from "react";
import { useProgress } from "../context/ProgressContext";
import "./StudentSelectScreen.css";

export function StudentSelectScreen() {
  const { students, selectStudent, createStudent, deleteStudent } = useProgress();
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (trimmed.length === 0) return;
    createStudent(trimmed);
    setNewName("");
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewName("");
    }
  };

  const handleDelete = (studentId: string) => {
    deleteStudent(studentId);
    setConfirmDelete(null);
  };

  return (
    <div className="screen student-select-screen">
      <h1 className="student-select-screen__title">
        Olá! Quem vai praticar hoje? 👋
      </h1>
      <p className="student-select-screen__subtitle">
        Selecione seu nome ou crie um novo perfil
      </p>

      {students.length > 0 && (
        <div className="student-select-screen__list">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <button
                className="student-card__btn"
                onClick={() => selectStudent(student)}
                aria-label={`Entrar como ${student.name}`}
              >
                <span className="student-card__avatar">
                  {student.name.charAt(0).toUpperCase()}
                </span>
                <span className="student-card__name">{student.name}</span>
              </button>
              {confirmDelete === student.id ? (
                <div className="student-card__confirm-delete">
                  <span>Tem certeza?</span>
                  <button
                    className="student-card__confirm-yes"
                    onClick={() => handleDelete(student.id)}
                    aria-label={`Confirmar exclusão de ${student.name}`}
                  >
                    Sim
                  </button>
                  <button
                    className="student-card__confirm-no"
                    onClick={() => setConfirmDelete(null)}
                    aria-label="Cancelar exclusão"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  className="student-card__delete"
                  onClick={() => setConfirmDelete(student.id)}
                  aria-label={`Remover ${student.name}`}
                  title="Remover aluno"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isCreating ? (
        <div className="student-select-screen__create-form">
          <input
            className="student-select-screen__input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite seu nome..."
            autoFocus
            maxLength={30}
            aria-label="Nome do aluno"
          />
          <div className="student-select-screen__form-actions">
            <button
              className="student-select-screen__btn-confirm"
              onClick={handleCreate}
              disabled={newName.trim().length === 0}
            >
              Começar! 🚀
            </button>
            <button
              className="student-select-screen__btn-cancel"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          className="student-select-screen__btn-new"
          onClick={() => setIsCreating(true)}
        >
          <span>➕</span> Novo Aluno
        </button>
      )}
    </div>
  );
}
