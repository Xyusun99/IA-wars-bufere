import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon from './Icon';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="header__brand" aria-label="Bufete Popular, ir al listado de expedientes">
            <img className="header__logo" src="/umg.png" alt="" width="44" height="44" />
            <span className="header__title">
              <strong>Bufete Popular</strong>
              <span>Gestión de expedientes</span>
            </span>
            <span className="header__chip">Datos ficticios</span>
          </Link>
          <nav className="header__nav" aria-label="Navegación principal">
            <NavLink to="/" end>
              <Icon name="folder" /> Expedientes
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container main">{children}</main>
      {/* Región de notificaciones tipo toast (ver components/Alert.tsx) */}
      <div id="toast-region" className="toast-region" aria-live="polite" />
      <footer className="footer">
        Prototipo con datos ficticios para AI Code Wars · UMG 2026. No brinda asesoría jurídica.
      </footer>
    </>
  );
}
