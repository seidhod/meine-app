"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setChecking(false);

        if (!currentUser) {
          router.replace("/auth");
        }
      },
      () => {
        setError(
          "Die Anmeldung konnte nicht geprüft werden. Lade die Seite bitte erneut.",
        );
        setChecking(false);
      },
    );

    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    try {
      await signOut(auth);
      // Die Weiterleitung übernimmt der Anmeldestatus oben.
    } catch {
      setError(
        "Die Abmeldung ist fehlgeschlagen. Bitte versuche es erneut.",
      );
      setSigningOut(false);
    }
  }

  const wordCount = draft.trim()
    ? draft.trim().split(/\s+/).length
    : 0;

  return (
    <main className="writer-screen">
      <style>{`
        .writer-screen,
        .writer-screen * {
          box-sizing: border-box;
        }

        .writer-screen {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          padding: 28px 18px;
          background:
            radial-gradient(ellipse at top left, #213b65, transparent 60%),
            #101827;
          color: #edf3ff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .writer-layout {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .writer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          padding-bottom: 24px;
          border-bottom: 1px solid #ffffff18;
        }

        .writer-brand {
          margin: 0;
          color: #fff;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .writer-account {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          color: #b4c4da;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .writer-button {
          padding: 11px 16px;
          border: 1px solid #ffffff30;
          border-radius: 10px;
          background: #ffffff08;
          color: #e3ecff;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .writer-button:hover:not(:disabled) {
          background: #ffffff15;
        }

        .writer-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .writer-button:focus-visible {
          outline: 3px solid #a6c0ff;
          outline-offset: 3px;
        }

        .writer-welcome {
          padding: 42px 0 24px;
        }

        .writer-badge {
          display: inline-block;
          padding: 7px 10px;
          border-radius: 8px;
          background: #a6c0ff15;
          color: #b8ceff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .writer-welcome h1 {
          margin: 17px 0 12px;
          color: #fff;
          font-size: clamp(28px, 5vw, 42px);
          letter-spacing: -1.5px;
          line-height: 1.15;
        }

        .writer-welcome p,
        .writer-note {
          color: #aebfd5;
          font-size: 14px;
          line-height: 1.7;
        }

        .writer-panel {
          padding: 24px;
          border: 1px solid #ffffff20;
          border-radius: 20px;
          background: #172439;
          box-shadow: 0 18px 50px #0002;
        }

        .writer-panel label {
          display: block;
          margin-bottom: 13px;
          color: #edf3ff;
          font-size: 15px;
          font-weight: 700;
        }

        .writer-input {
          display: block;
          width: 100%;
          min-height: 280px;
          padding: 18px;
          resize: vertical;
          border: 1px solid #ffffff25;
          border-radius: 12px;
          outline: none;
          background: #101b2d;
          color: #edf3ff;
          font: inherit;
          font-size: 16px;
          line-height: 1.8;
        }

        .writer-input:focus {
          border-color: #a6c0ff;
          box-shadow: 0 0 0 3px #a6c0ff18;
        }

        .writer-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 15px;
          color: #9fb4ce;
          font-size: 12px;
        }

        .writer-note {
          margin: 20px 0 0;
          font-size: 12px;
        }

        .writer-error {
          padding: 13px;
          border: 1px solid #fda4af40;
          border-radius: 10px;
          background: #fda4af10;
          color: #ffc1c9;
          font-size: 13px;
          line-height: 1.7;
        }

        .writer-loading {
          width: 100%;
          max-width: 450px;
          margin: 15vh auto 0;
          padding: 26px;
          border: 1px solid #ffffff20;
          border-radius: 18px;
          background: #172439;
          text-align: center;
        }
      `}</style>

      {!user ? (
        <section className="writer-loading">
          {error ? (
            <p className="writer-error" role="alert">
              {error}
            </p>
          ) : (
            <p role="status">
              {checking
                ? "Deine Anmeldung wird geprüft …"
                : "Weiterleitung zur Anmeldung …"}
            </p>
          )}
        </section>
      ) : (
        <div className="writer-layout">
          <header className="writer-header">
            <p className="writer-brand">KI-Schreibassistent</p>

            <div className="writer-account">
              <span>{user.email}</span>

              <button
                className="writer-button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Bitte warten …" : "Abmelden"}
              </button>
            </div>
          </header>

          <section className="writer-welcome">
            <span className="writer-badge">DEIN SCHREIBBEREICH</span>

            <h1>Aus Gedanken werden Texte.</h1>

            <p>
              Hier entsteht dein persönlicher Schreibassistent.
              Du kannst bereits einen Textentwurf eingeben.
            </p>
          </section>

          {error && (
            <p className="writer-error" role="alert">
              {error}
            </p>
          )}

          <section className="writer-panel">
            <label htmlFor="draft">Dein Textentwurf</label>

            <textarea
              id="draft"
              className="writer-input"
              placeholder="Schreibe hier deine Idee oder füge einen Text ein …"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />

            <div className="writer-toolbar">
              <span>
                {wordCount} Wörter · {draft.length} Zeichen
              </span>

              <button
                className="writer-button"
                onClick={() => setDraft("")}
                disabled={!draft}
              >
                Entwurf leeren
              </button>
            </div>

            <p className="writer-note">
              Entwicklungsstand: Die Anmeldung funktioniert.
              KI-Antworten und das Speichern von Texten bauen wir
              anschließend ein. Dieser Entwurf bleibt derzeit nur
              auf der geöffneten Seite und geht beim Neuladen oder
              Verlassen verloren.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
