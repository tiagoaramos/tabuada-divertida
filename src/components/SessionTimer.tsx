import "./SessionTimer.css";

interface SessionTimerProps {
  display: string;
}

export function SessionTimer({ display }: SessionTimerProps) {
  return (
    <div className="session-timer" aria-label="Tempo da sessão" role="timer">
      <span className="session-timer__digits">{display}</span>
    </div>
  );
}
