import Link from "next/link";
import { Nunito, IBM_Plex_Mono } from "next/font/google";
import { PublicHeader } from "@/components/PublicHeader";
import { FaqAccordion } from "@/components/FaqAccordion";
import { LoyaltyCardDemo } from "@/components/LoyaltyCardDemo";
import styles from "@/styles/landing.module.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--next-nunito",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--next-plex-mono",
});

const STEPS = [
  {
    title: "Regístrate gratis",
    description:
      "Crea tu cuenta y recibe tu QR personal. Si tienes un negocio, configura tu promoción en minutos.",
  },
  {
    title: "Muestra tu QR en cada compra",
    description: "El negocio lo escanea y el sello se suma al instante.",
  },
  {
    title: "Canjea tu premio",
    description:
      "Sigue tu progreso desde la app y, cuando completes tus sellos, reclama tu recompensa.",
  },
];

const NEGOCIO_BENEFICIOS = [
  {
    title: "Crea tu promoción a tu medida",
    description: "Tú decides cuántos sellos y cuál es el premio.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
  },
  {
    title: "Registra compras en segundos",
    description: "Solo escaneas el QR del cliente, sin equipos ni instalaciones especiales.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2m10-16h2a1 1 0 0 1 1 1v2m-3 14h2a1 1 0 0 0 1-1v-2M8 12h8"
      />
    ),
  },
  {
    title: "Conoce a tus clientes frecuentes",
    description: "Sabe quién vuelve, cuánto y cuándo.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"
      />
    ),
  },
  {
    title: "Cero papel, cero impresión",
    description: "Adiós a las tarjetas que se pierden en la cartera.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3M4 7h16l-1 13H5L4 7Z"
      />
    ),
  },
];

const USUARIO_BENEFICIOS = [
  {
    title: "Un solo QR para todo",
    description: "Es tuyo y funciona en todos los negocios afiliados.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm11 1h5v5h-5v-5Z" />,
  },
  {
    title: "Tu progreso siempre a la vista",
    description: "Revisa cuántos sellos llevas y cuánto te falta.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16v-5m5 5V8m5 8v-3" />,
  },
  {
    title: "Premios que sí llegan",
    description: "Sabrás exactamente cuándo puedes canjear.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z" />,
  },
  {
    title: "Descubre nuevos lugares",
    description: "Encuentra negocios con promociones para ti.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  },
];

const FAQ_ITEMS = [
  { q: "¿Tiene costo usar Loyalty APP?", a: "Por ahora, registrarte y empezar a usarla no tiene costo." },
  { q: "¿Necesito descargar algo de una tienda de apps?", a: "No. Se instala directo desde tu navegador, en unos segundos." },
  { q: "¿Cómo acumulo sellos?", a: "Muestras tu QR en el negocio y listo, el sello se registra al instante." },
  { q: "¿Cómo canjeo mi premio?", a: "Cuando completes los sellos, la app te avisa y lo reclamas en el mismo negocio." },
  {
    q: "Tengo un negocio, ¿qué necesito para empezar?",
    a: "Solo registrarte, crear tu promoción y tener un celular o dispositivo con cámara para escanear.",
  },
  { q: "¿Funciona con cualquier tipo de negocio?", a: "Sí, cualquier negocio que quiera premiar a sus clientes recurrentes." },
];

export default function Home() {
  return (
    <main id="top" className={`${styles.page} ${nunito.variable} ${plexMono.variable}`}>
      <PublicHeader />

      <section className={styles.hero}>
        <div className={styles.bandInner}>
          <div>
            <span className={styles.eyebrow} style={{ color: "var(--text-dark-muted)" }}>
              Fidelización sin fricción
            </span>
            <h1>
              Cada compra cuenta.
              <br />
              <span className={styles.grad}>Y ahora, también te premia.</span>
            </h1>
            <p className={styles.heroSub}>
              Loyalty APP es la forma más simple de fidelizar clientes. Sin tarjetitas de cartón,
              sin complicaciones: solo tu QR, tus sellos y un premio esperándote.
            </p>
            <div className={styles.heroCtas}>
              <Link className={`${styles.btn} ${styles.btnGold}`} href="/login?modo=registro">
                Crear mi cuenta
              </Link>
              <Link className={`${styles.btn} ${styles.btnGhostDark}`} href="/login">
                Registrar mi negocio
              </Link>
            </div>
            <p className={styles.heroFoot}>
              <span className={styles.glowDot} />
              Instálala en tu celular en segundos, directo desde el navegador. Sin tiendas de apps.
            </p>
          </div>

          <LoyaltyCardDemo />
        </div>
      </section>

      <section id="como-funciona" className={`${styles.section} ${styles.sectionLight}`}>
        <div className={styles.bandInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow} style={{ color: "var(--gold-deep)" }}>
              Cómo funciona
            </span>
            <h2>Así de fácil funciona</h2>
            <p>Tres pasos y listo. Sin vueltas.</p>
          </div>

          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={step.title} className={styles.stepCard}>
                <span className={styles.stepNum}>PASO {String(i + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>

          <div className={styles.exampleStrip}>
            <b>Ejemplo</b>
            <p>
              En <strong>Cafetería Mi Tacita</strong>, 10 compras te dan el siguiente café gratis.
              Tú compras, escaneas y la app lleva la cuenta por ti.
            </p>
          </div>
        </div>
      </section>

      <section id="negocios" className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.bandInner}>
          <div className={styles.split}>
            <div>
              <span className={styles.eyebrow} style={{ color: "var(--gold)" }}>
                Para negocios
              </span>
              <h2 style={{ fontSize: "clamp(26px,3.6vw,36px)", marginTop: 14 }}>
                Haz que tus clientes vuelvan (y se lo cuenten a todos)
              </h2>
              <p style={{ marginTop: 14, color: "var(--text-dark-muted)", fontSize: 16 }}>
                Un cliente que regresa vale más que uno nuevo. Con Loyalty APP creas tu programa de
                recompensas en minutos y empiezas a premiar a quienes ya confían en ti, ya sea una
                barbería, un salón de belleza, una cafetería o un restaurante.
              </p>
              <Link className={`${styles.btn} ${styles.btnGold} ${styles.ctaInline}`} href="/login">
                Registrar mi negocio
              </Link>
            </div>

            <div className={styles.benefitGrid}>
              {NEGOCIO_BENEFICIOS.map((b) => (
                <div key={b.title} className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      {b.icon}
                    </svg>
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="usuarios" className={`${styles.section} ${styles.sectionLight}`}>
        <div className={styles.bandInner}>
          <div className={`${styles.split} ${styles.splitReverse}`}>
            <div>
              <span className={styles.eyebrow} style={{ color: "var(--gold-deep)" }}>
                Para ti
              </span>
              <h2 style={{ fontSize: "clamp(26px,3.6vw,36px)", marginTop: 14 }}>
                Tus lugares favoritos te lo agradecen
              </h2>
              <p style={{ marginTop: 14, color: "var(--text-paper-muted)", fontSize: 16 }}>
                Deja de cargar tarjetas y de preguntarte cuántos sellos llevas. Con Loyalty APP
                tienes todo en tu celular y cada visita te acerca a un premio.
              </p>
              <Link className={`${styles.btn} ${styles.btnOutlinePaper} ${styles.ctaInline}`} href="/login?modo=registro">
                Crear mi cuenta
              </Link>
            </div>

            <div className={styles.benefitGrid}>
              {USUARIO_BENEFICIOS.map((b) => (
                <div key={b.title} className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      {b.icon}
                    </svg>
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.sectionLight}`} style={{ background: "var(--paper-soft)" }}>
        <div className={styles.bandInner} style={{ maxWidth: 760 }}>
          <div className={styles.sectionHead} style={{ marginInline: "auto", textAlign: "center" }}>
            <span className={styles.eyebrow} style={{ color: "var(--gold-deep)" }}>
              Preguntas frecuentes
            </span>
            <h2>Lo que quizá te estás preguntando</h2>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      <section className={`${styles.section} ${styles.closing}`}>
        <div className={styles.bandInner}>
          <span className={styles.eyebrow} style={{ color: "var(--text-dark-muted)" }}>
            Únete hoy
          </span>
          <h2 style={{ marginTop: 14 }}>Es momento de que cada compra valga más</h2>
          <p>Ya seas cliente o dueño de negocio, Loyalty APP está hecha para ti.</p>
          <div className={styles.heroCtas}>
            <Link className={`${styles.btn} ${styles.btnGold}`} href="/login?modo=registro">
              Crear mi cuenta
            </Link>
            <Link className={`${styles.btn} ${styles.btnOutlineLight}`} href="/login">
              Registrar mi negocio
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.bandInner} ${styles.footerRow}`}>
          <div className={styles.footerLinks}>
            <a href="mailto:contacto@loyaltyapp.mx">Contacto</a>
            <a href="#">Redes sociales</a>
          </div>
          <p>© {new Date().getFullYear()} Loyalty APP</p>
        </div>
      </footer>
    </main>
  );
}
