"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { FirebaseError } from "firebase/app";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const EMAIL_STORAGE_KEY = "schreibassistent-login-email";

function errorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
  }

  const messages: Record<string, string> = {
    "auth/invalid-email":
      "Bitte gib eine gültige E-Mail-Adresse ein.",
    "auth/expired-action-code":
      "Dieser Link ist abgelaufen. Fordere bitte einen neuen an.",
    "auth/invalid-action-code":
      "Dieser Link ist ungültig oder wurde bereits verwendet. Fordere einen neuen an.",
    "auth/invalid-credential":
      "Die Anmeldung ist fehlgeschlagen. Prüfe deine E-Mail-Adresse oder fordere einen neuen Link an.",
    "auth/unauthorized-continue-uri":
      "Die Adresse dieser App ist in Firebase noch nicht als autorisierte Domain eingetragen.",
    "auth/unauthorized-domain":
      "Diese Domain ist in Firebase noch nicht für die Anmeldung freigegeben.",
    "auth/operation-not-allowed":
      "Die Anmeldung per E-Mail-Link ist in Firebase noch nicht vollständig aktiviert.",
    "auth/too-many-requests":
      "Es gab zu viele Anfragen. Bitte warte etwas und versuche es später erneut.",
    "auth/quota-exceeded":
      "Das Versandlimit wurde erreicht. Bitte versuche es später erneut.",
    "auth/network-request-failed":
      "Die Verbindung ist fehlgeschlagen. Prüfe deine Internetverbindung.",
    "auth/user-disabled":
      "Dieses Konto wurde deaktiviert.",
  };

  return (
    messages[error.code] ??
    `Firebase meldet: ${error.code}. Schicke mir diesen Fehlercode.`
  );
}

export default function AuthPage() {
    const router = useRouter();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [emailLink, setEmailLink] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
    useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);


  useEffect(() => {
    // Prüfen, ob die Seite über einen Anmeldelink geöffnet wurde.
    setEmailLink(
      isSignInWithEmailLink(auth, window.location.href),
    );

    // Die Adresse wird nur in diesem Browser vorgemerkt.
    try {
      const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {
      // Ohne Browserspeicher kann die Adresse erneut eingegeben werden.
    }

    // Vorhandene Anmeldung erkennen und Änderungen beobachten.
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setChecking(false);
      },
      (authError) => {
        setError(errorMessage(authError));
        setChecking(false);
      },
    );

    return unsubscribe;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const address = email.trim();

    if (!address || busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (emailLink) {
        // Anmeldung mit dem Link aus dem Postfach abschließen.
        const result = await signInWithEmailLink(
          auth,
          address,
          window.location.href,
        );

        setUser(result.user);
        setEmailLink(false);

        try {
          localStorage.removeItem(EMAIL_STORAGE_KEY);
        } catch {
          // Fehlender Browserspeicher verhindert die Anmeldung nicht.
        }

        // Einmalcode nach erfolgreicher Anmeldung aus der URL entfernen.
        window.history.replaceState(
          null,
          "",
          window.location.pathname,
        );

        setMessage("Deine Anmeldung war erfolgreich.");
      } else {
        // Lokal geht der Link zurück zu localhost.
        // Nach der Veröffentlichung zurück zur aktuellen App-Domain.
        await sendSignInLinkToEmail(auth, address, {
          url: `${window.location.origin}/auth`,
          handleCodeInApp: true,
        });

        try {
          localStorage.setItem(EMAIL_STORAGE_KEY, address);
        } catch {
          // Auf einem anderen Browser wird die Adresse erneut abgefragt.
        }

        setMessage(
          `Der Anmeldelink wurde an ${address} gesendet. Öffne dein Postfach und prüfe gegebenenfalls auch den Spamordner.`,
        );
      }
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await signOut(auth);
      setUser(null);
      setMessage("Du bist jetzt abgemeldet.");
    } catch (signOutError) {
      setError(errorMessage(signOutError));
    } finally {
      setBusy(false);
    }
  }

  function requestNewLink() {
    window.history.replaceState(
      null,
      "",
      window.location.pathname,
    );

    setEmailLink(false);
    setError("");
    setMessage("");
  }

  return (
    <main className="login-screen">
      <style>{`
        .login-screen,
        .login-screen * {
          box-sizing: border-box;
        }

        .login-screen {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          overflow-y: auto;
          padding: 28px 18px;
          background:
            radial-gradient(ellipse at top left, #213b65, transparent 60%),
            #101827;
          color: #edf3ff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 450px;
          padding: 34px 28px;
          border: 1px solid #ffffff20;
          border-radius: 24px;
          background: #172439;
          box-shadow: 0 24px 80px #0004;
        }

        .login-badge {
          display: inline-block;
          margin-bottom: 20px;
          padding: 8px 12px;
          border-radius: 10px;
          background: #8caeff16;
          color: #afc6ff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .login-card h1 {
          margin: 0 0 14px;
          color: #fff;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -1px;
        }

        .login-intro {
          margin: 0 0 26px;
          color: #afbed3;
          font-size: 14px;
          line-height: 1.7;
        }

        .login-card label {
          display: block;
          margin-bottom: 9px;
          color: #e1eafa;
          font-size: 13px;
          font-weight: 700;
        }

        .login-input {
          width: 100%;
          padding: 14px;
          border: 1px solid #ffffff30;
          border-radius: 11px;
          outline: none;
          background: #101b2d;
          color: #fff;
          font: inherit;
          font-size: 16px;
        }

        .login-input:focus {
          border-color: #98b6ff;
          box-shadow: 0 0 0 3px #98b6ff20;
        }

        .login-button {
          width: 100%;
          margin-top: 16px;
          padding: 14px;
          border: 0;
          border-radius: 11px;
          background: #a6c0ff;
          color: #12203c;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .login-button:hover:not(:disabled) {
          background: #c2d3ff;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .login-button:focus-visible {
          outline: 3px solid #fff;
          outline-offset: 3px;
        }

        .login-secondary {
          background: transparent;
          border: 1px solid #ffffff30;
          color: #d6e3fb;
        }

        .login-secondary:hover:not(:disabled) {
          background: #ffffff0c;
        }

        .login-notice {
          margin: 20px 0 0;
          padding: 13px;
          border: 1px solid #6ee7b733;
          border-radius: 11px;
          background: #6ee7b710;
          color: #adf0d3;
          font-size: 13px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .login-error {
          border-color: #fda4af40;
          background: #fda4af10;
          color: #ffc1c9;
        }

        .login-account {
          margin: 18px 0;
          padding: 16px;
          border-radius: 12px;
          background: #ffffff08;
          color: #dce8ff;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .login-note {
          margin: 22px 0 0;
          color: #8ea3c0;
          font-size: 11px;
          line-height: 1.7;
        }
      `}</style>

      <section className="login-card">
        <div className="login-badge">KI-SCHREIBASSISTENT</div>

        {checking ? (
          <>
            <h1>Einen Moment …</h1>
            <p className="login-intro">
              Deine Anmeldung wird geprüft.
            </p>
          </>
        ) : user ? (
          <>
            <h1>Du bist angemeldet.</h1>

            <p className="login-intro">
              Die Verbindung zu Firebase funktioniert.
              Deine Schreiboberfläche ergänzen wir im nächsten
              Entwicklungsschritt.
            </p>

            <div className="login-account">{user.email}</div>

            <button
              className="login-button"
              onClick={handleSignOut}
              disabled={busy}
            >
              {busy ? "Bitte warten …" : "Abmelden"}
            </button>
          </>
        ) : (
          <>
            <h1>
              {emailLink
                ? "Anmeldung bestätigen"
                : "Willkommen zurück."}
            </h1>

            <p className="login-intro">
              {emailLink
                ? "Bestätige die E-Mail-Adresse, an die der Link geschickt wurde, und schließe deine Anmeldung ab."
                : "Melde dich ohne Passwort an. Wir schicken dir einen persönlichen Anmeldelink per E-Mail."}
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="login-email">
                Deine E-Mail-Adresse
              </label>

              <input
                id="login-email"
                className="login-input"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@beispiel.de"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />

              <button
                className="login-button"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Bitte warten …"
                  : emailLink
                    ? "Anmeldung abschließen"
                    : "Anmeldelink senden"}
              </button>
            </form>

            {emailLink && (
              <button
                className="login-button login-secondary"
                onClick={requestNewLink}
                disabled={busy}
              >
                Stattdessen neuen Link anfordern
              </button>
            )}

            <p className="login-note">
              Kein Passwort erforderlich. Verwende zum
              Abschließen dieselbe E-Mail-Adresse, an die der
              Link geschickt wurde.
            </p>
          </>
        )}

        {message && (
          <p className="login-notice" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="login-notice login-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
