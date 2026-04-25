import { useState, useRef, useEffect } from 'react';
import { cloudLogin, cloudLogout, getCloudStats } from '../../utils/cloudDB';
import styles from './CloudModal.module.css';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );
}

function CloudIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}

function UserIcon({ size = 40 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function formatKb(kb) {
  if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
  return kb + ' KB';
}

export default function CloudModal({ session, onLogin, onLogout, onClose }) {
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const usernameRef = useRef(null);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!session) { usernameRef.current?.focus(); return; }
    getCloudStats().then(setStats).catch(() => {});
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await cloudLogin(username.trim(), password);
      if (result.ok) {
        onLogin(result);
      } else {
        setError(result.error || 'Erro ao entrar');
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (!logoutConfirm) { setLogoutConfirm(true); return; }
    cloudLogout();
    onLogout();
    setLogoutConfirm(false);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <CloudIcon size={22} />
          </div>
          <span className={styles.headerTitle}>Galeria em Nuvem</span>
        </div>

        {session ? (
          /* ── Conta logada ── */
          <div className={styles.accountInfo}>
            <div className={styles.avatar}>
              <UserIcon size={36} />
            </div>
            <div className={styles.accountDetails}>
              <p className={styles.accountName}>{session.user}</p>
              <p className={styles.accountSub}>Conta pessoal</p>
            </div>

            {stats && (
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span className={styles.statValue}>{stats.count}</span>
                  <span className={styles.statLabel}>fotos</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                  <span className={styles.statValue}>{formatKb(stats.sizeKb)}</span>
                  <span className={styles.statLabel}>usados</span>
                </div>
              </div>
            )}

            <button
              className={logoutConfirm ? styles.logoutBtnConfirm : styles.logoutBtn}
              onClick={handleLogout}
            >
              {logoutConfirm ? 'Confirmar saída?' : 'Sair da conta'}
            </button>
            {logoutConfirm && (
              <button className={styles.cancelSmall} onClick={() => setLogoutConfirm(false)}>
                Cancelar
              </button>
            )}
          </div>
        ) : (
          /* ── Formulário de login ── */
          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <p className={styles.hint}>
              Entre com sua conta ou crie uma nova automaticamente.
            </p>

            <label className={styles.fieldLabel}>Usuário</label>
            <input
              ref={usernameRef}
              className={styles.field}
              type="text"
              autoComplete="username"
              placeholder="ex.: meunome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
              required
            />

            <label className={styles.fieldLabel}>Senha</label>
            <div className={styles.passWrap}>
              <input
                className={styles.field}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="mínimo 4 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={64}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button
              className={styles.loginBtn}
              type="submit"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? 'Entrando…' : 'Entrar / Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
