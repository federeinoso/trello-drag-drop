import { useState, useCallback, useEffect } from "react";
import "./App.css";

const initialColumns = [
  {
    name: "Upcoming",
    columnId: "column-a",
    cards: [
      { id: "a", label: "Buy cat food" },
      { id: "b", label: "File taxes" },
    ],
  },
  {
    name: "Finished",
    columnId: "column-b",
    cards: [
      { id: "c", label: "Buy Amina's birthday present" },
      { id: "d", label: "Schedule haircut" },
    ],
  },
];

export default function App() {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("trello-columns");
    return saved ? JSON.parse(saved) : initialColumns;
  });

  const [draggingId, setDraggingId] = useState(null);
  const [draggingLabel, setDraggingLabel] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [newCardLabel, setNewCardLabel] = useState("");

  // ── AGREGAR card a Upcoming ────────────────────
  function handleAddCard() {
    const trimmed = newCardLabel.trim();
    if (!trimmed) return;

    setColumns((prev) =>
      prev.map((col) =>
        col.columnId === "column-a"
          ? {
              ...col,
              cards: [
                ...col.cards,
                { id: Date.now().toString(), label: trimmed },
              ],
            }
          : col
      )
    );
    setNewCardLabel("");
  }

  // ── ELIMINAR card de Finished ──────────────────
  function handleDeleteCard(cardId) {
    setColumns((prev) =>
      prev.map((col) =>
        col.columnId === "column-b"
          ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
          : col
      )
    );
  }

  // Persistencia: guarda en localStorage cada vez que columns cambia
  useEffect(() => {
    localStorage.setItem("trello-columns", JSON.stringify(columns));
  }, [columns]);

  // ── MOUSE MOVE ─────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (draggingId === null) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  }, [draggingId]);

  // ── MOUSE DOWN ─────────────────────────────────
  function handleMouseDown(e, card) {
    e.preventDefault();
    setDraggingId(card.id);
    setDraggingLabel(card.label);
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  // ── MOUSE ENTER column ─────────────────────────
  function handleMouseEnterColumn(targetColumnId) {
    if (draggingId === null) return;

    setColumns((prev) => {
      const sourceColumn = prev.find((col) =>
        col.cards.some((card) => card.id === draggingId)
      );
      if (sourceColumn.columnId === targetColumnId) return prev;

      const movedCard = sourceColumn.cards.find((card) => card.id === draggingId);

      return prev.map((col) => {
        if (col.columnId === sourceColumn.columnId) {
          return { ...col, cards: col.cards.filter((card) => card.id !== draggingId) };
        }
        if (col.columnId === targetColumnId) {
          return { ...col, cards: [...col.cards, movedCard] };
        }
        return col;
      });
    });
  }

  // ── MOUSE UP ───────────────────────────────────
  function handleMouseUp() {
    setDraggingId(null);
    setDraggingLabel(null);
  }

  return (
    <main className="board" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {columns.map((column) => (
        <section
          className="column"
          key={column.columnId}
          onMouseEnter={() => handleMouseEnterColumn(column.columnId)}
        >
          <header>{column.name}</header>

          <div className="cards">
            {column.cards.map((card) => (
              <div className="card-row" key={card.id}>
                <button
                  className={`card ${draggingId === card.id ? "dragging" : ""} ${column.columnId === "column-b" ? "finished" : ""}`}
                  onMouseDown={(e) => handleMouseDown(e, card)}
                >
                  {card.label}
                </button>

                {column.columnId === "column-b" && (
                  <button className="btn-delete" onClick={() => handleDeleteCard(card.id)}>
                    ✕
                  </button>
                )}
              </div>
            ))}

            {column.columnId === "column-a" && (
              <div className="add-block">
                <input
                  type="text"
                  placeholder="Nueva tarea..."
                  value={newCardLabel}
                  onChange={(e) => setNewCardLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                />
                <button className="btn-add" onClick={handleAddCard}>
                  + Agregar
                </button>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* GHOST: left y top se mantienen inline porque son valores dinámicos del mouse */}
      {draggingId !== null && (
        <div
          className="ghost"
          style={{ left: mousePos.x - 100, top: mousePos.y - 20 }}
        >
          {draggingLabel}
        </div>
      )}
    </main>
  );
}
