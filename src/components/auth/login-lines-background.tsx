interface LoginLinesBackgroundProps {
  className?: string
}

/** Static CSS grid — zero patient JS, no canvas. */
export function LoginLinesBackground({ className }: LoginLinesBackgroundProps) {
  return (
    <div className={className} aria-hidden>
      <div className="login-lines-base absolute inset-0" />
      <div className="login-lines-grid absolute inset-0" />
      <div className="login-lines-grid login-lines-grid-fine absolute inset-0" />
      <div className="login-lines-diagonal absolute inset-0" />
      <div className="login-lines-vignette absolute inset-0" />
      <div className="login-lines-grain absolute inset-0" />
    </div>
  )
}
