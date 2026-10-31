import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="header__brand">Bufete Popular · Expedientes</Link>
          <nav className="header__nav">
            <Link to="/">Listado</Link>
            <Link to="/expedientes/nuevo" className="btn btn--primary">Nuevo expediente</Link>
          </nav>
        </div>
      </header>
      <main className="container main">{children}</main>
      <footer className="footer container">
        Prototipo con datos ficticios para AI Code Wars UMG 2026. No brinda asesoría jurídica.
      </footer>
    </>
  );
}
