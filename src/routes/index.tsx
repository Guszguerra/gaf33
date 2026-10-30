import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getResinMetrics } from "@/lib/resin-metrics.functions";
import hero from "@/assets/Leon.png";
import raw from "@/assets/Subaru.png";
import paint from "@/assets/Power.png";
import type { PaintLevel } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GAF33" },
      { name: "description", content: "Figures de personagens impressas em resina 3D, com estimativa de preço pela altura." },
      { property: "og:title", content: "Figures 3D sob encomenda" },
      { property: "og:description", content: "Impressão 3D em resina com pintura simples ou detalhada e estimativa de preço." },
    ],
  }),
  component: Index,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Quote() {
  const fn = useServerFn(getResinMetrics);
  const [height, setHeight] = useState(20);
  const [pnt, setPnt] = useState<PaintLevel>("simple");
  const [result, setResult] = useState<{
    price: number;
    resinPrice: {
      pricePerLiter: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fn({ data: { heightCm: height, paint: pnt } });
        setResult({ price: r.price, resinPrice: r.resinPrice });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [height, pnt, fn]);

  const paints: { k: PaintLevel; t: string }[] = [
    { k: "none", t: "Sem pintura" },
    { k: "simple", t: "Pintura simples" },
    { k: "detailed", t: "Pintura detalhada" },
  ];
  const selectedPaint = paints.find((option) => option.k === pnt)?.t ?? "Pintura simples";
  const emailSubject = encodeURIComponent("Pedido de orçamento - Figure 3D");
  const emailBody = encodeURIComponent(
    `Olá! Gostaria de solicitar um orçamento para uma figure 3D.\n\nAltura: ${height} cm\nAcabamento: ${selectedPaint}\nEstimativa no site: ${result === null ? "indisponível" : brl(result.price)}\n\nPersonagem/referências:\n`,
  );
  const quoteEmailHref = `mailto:gaf33c@gmail.com?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8 rounded-xl border border-border bg-card p-6 md:p-8">
        <section>
          <h3 className="mb-2 text-2xl text-primary">Altura da figure</h3>
          <p className="font-display text-6xl">{height} cm</p>
          <input type="range" min={5} max={60} step={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="mt-4 w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground"><span>5 cm</span><span>60 cm</span></div>
        </section>
        <section>
          <h3 className="mb-4 text-2xl text-primary">Acabamento</h3>
          <div className="grid grid-cols-3 gap-2">
            {paints.map((p) => (
              <button key={p.k} onClick={() => setPnt(p.k)} className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${pnt === p.k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
                {p.t}
              </button>
            ))}
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-xl border border-primary/40 bg-card p-6 shadow-glow lg:sticky lg:top-24">
        <div className="rounded-lg bg-fire p-5 text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-widest">Preço médio estimado</p>
          <p className={`font-display text-5xl transition-opacity ${loading ? "opacity-60" : ""}`}>
            {result === null ? "—" : brl(result.price)}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Resina usada como base: {result === null ? "carregando..." : `${brl(result.resinPrice.pricePerLiter)}/L`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Preço estimado; o valor oficial é definido no orçamento.
        </p>
        <a href={quoteEmailHref} className="mt-4 block rounded-md border border-border px-4 py-3 text-center font-bold hover:border-primary">Pedir orçamento</a>
      </aside>
    </div>
  );
}

function Index() {
  const nav = [["#inicio", "Início"], ["#galeria", "Galeria"], ["#calculadora", "Preço"], ["#contato", "Contato"]];
  return (
    <div id="inicio">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#inicio" className="font-display text-3xl">GAF<span className="text-fire"> 33</span></a>
          <nav className="hidden gap-6 text-sm font-semibold md:flex">
            {nav.map(([h, t]) => <a key={h} href={h} className="hover:text-primary">{t}</a>)}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-primary">Impressão 3D em resina</p>
          <h1 className="text-6xl leading-none md:text-8xl">Seus personagens favoritos. <span className="text-fire">Em 3D.</span></h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">Figures de animes, games, filmes e séries sob encomenda — com pintura simples ou detalhada à mão.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#calculadora" className="rounded-md bg-fire px-6 py-3 font-bold text-primary-foreground shadow-glow">Calcular preço</a>
            <a href="#galeria" className="rounded-md border border-border px-6 py-3 font-bold hover:border-primary">Ver galeria</a>
          </div>
        </div>
        <img src={hero} alt="Figure pintada à mão" width={1024} height={1280} className="mx-auto max-h-[600px] w-auto rounded-xl object-cover shadow-glow" />
      </section>

      <section id="galeria" className="border-y border-border bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-5xl">Do bruto ao <span className="text-fire">acabamento</span></h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [raw, "Impressão em resina", "Alta resolução, cada detalhe capturado."],
              [paint, "Pintura à mão", "Simples ou detalhada, você escolhe."],
              [hero, "Peça finalizada", "Pronta para a estante."],
            ].map(([img, t, d]) => (
              <figure key={t} className="overflow-hidden rounded-xl border border-border bg-card">
                <img
                  src={img}
                  alt={t}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className={`aspect-square w-full object-cover ${img === paint ? "object-top scale-[1.03] -translate-x-1 -translate-y-0.5" : ""}`}
                />
                <figcaption className="p-5"><h3 className="text-2xl">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="calculadora" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-5xl">Quanto custa a <span className="text-fire">sua figure?</span></h2>
        <p className="mb-10 mt-2 max-w-2xl text-muted-foreground">Escolha a altura e o acabamento e veja na hora o preço médio da sua figure.</p>
        <Quote />
      </section>

      <section id="contato" className="border-t border-border py-20 text-center">
        <h2 className="text-5xl">Pronto para ter sua figure?</h2>
        <p className="mt-2 text-muted-foreground">Solicite seu orçamento sem compromisso.</p>
        <a href="mailto:gaf33c@gmail.com" className="mt-8 inline-block rounded-md bg-fire px-8 py-4 font-bold text-primary-foreground shadow-glow">Enviar email</a>
      </section>
    </div>
  );
}
