fetch("/api/me", { credentials: "same-origin" })
  .then((response) => (response.ok ? response.json() : null))
  .then((user) => {
    const status = document.getElementById("status");
    const loginActions = document.getElementById("login-actions");
    const sessionActions = document.getElementById("session-actions");

    if (user) {
      status.textContent = `Sessão de ${user.email ?? user.displayName}.`;
      loginActions.classList.add("d-none");
      sessionActions.classList.remove("d-none");
    } else {
      status.textContent = "Nenhuma sessão neste navegador.";
      loginActions.classList.remove("d-none");
      sessionActions.classList.add("d-none");
    }
  });
