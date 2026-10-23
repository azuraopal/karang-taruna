import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, HeartHandshake, Lightbulb, MessageCircle } from 'lucide-react';
import { Logo } from '../common/Logo';
import './OrganizationFlow.css';

interface OrganizationFlowProps {
  divisions: ReadonlyArray<{ nama: string; peran: string }>;
}

interface Wire {
  id: string;
  path: string;
}

export function OrganizationFlow({ divisions }: OrganizationFlowProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [visible, setVisible] = useState(false);
  const [openDivisions, setOpenDivisions] = useState<Set<string>>(() => new Set());
  const gradientId = `organization-flow-${useId().replace(/:/g, '')}`;
  const headingId = `${gradientId}-heading`;

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    let disposed = false;
    const mobile = window.matchMedia('(max-width: 1100px)');
    const edges = [
      ['aspirasi', 'hub'], ['ide', 'hub'],
      ...divisions.flatMap((_, index) => [
        ['hub', `division-${index}`], [`division-${index}`, 'manfaat'],
      ]),
    ];

    const draw = () => {
      if (disposed) return;
      if (mobile.matches) {
        setWires([]);
        return;
      }
      const bounds = graph.getBoundingClientRect();
      setWires(edges.flatMap(([from, to]) => {
        const source = graph.querySelector<HTMLElement>(`[data-flow-node="${from}"]`);
        const target = graph.querySelector<HTMLElement>(`[data-flow-node="${to}"]`);
        if (!source || !target) return [];
        const a = source.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const x1 = a.right - bounds.left;
        const y1 = a.top + a.height / 2 - bounds.top;
        const x2 = b.left - bounds.left;
        const y2 = b.top + b.height / 2 - bounds.top;
        const bend = Math.max(24, (x2 - x1) / 2);
        return [{ id: `${from}-${to}`, path: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}` }];
      }));
    };
    const resize = new ResizeObserver(draw);
    resize.observe(graph);
    graph.querySelectorAll<HTMLElement>('[data-flow-node]').forEach(node => resize.observe(node));
    mobile.addEventListener('change', draw);
    document.fonts.ready.then(draw);
    draw();
    return () => { disposed = true; resize.disconnect(); mobile.removeEventListener('change', draw); };
  }, [divisions]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    let inView = false;
    const sync = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(graph);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  return (
    <section className="organization-flow" aria-labelledby={headingId} data-running={visible}>
      <header className="organization-flow__header">
        <div>
          <p className="organization-flow__eyebrow">Dari kita, untuk warga</p>
          <h3 id={headingId}>Banyak peran. Satu gerakan.</h3>
          <p>Aspirasi dan ide bertemu, lalu tumbuh menjadi aksi bersama melalui 7 divisi bidang kerja pemuda.</p>
        </div>
      </header>

      <div className="organization-flow__graph" ref={graphRef}>
        <svg className="organization-flow__wires" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop offset="0" stopColor="#d97706" />
              <stop offset=".5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {wires.map((wire, index) => (
            <g key={wire.id} data-flow-edge={wire.id}>
              <path className="organization-flow__wire" d={wire.path} />
              <path className="organization-flow__pulse" d={wire.path} stroke={`url(#${gradientId})`} style={{ '--wire-index': index } as CSSProperties} />
            </g>
          ))}
        </svg>

        <div className="organization-flow__stage">
          <h4 className="organization-flow__label">01 · Berawal dari</h4>
          <div className="organization-flow__node" data-flow-node="aspirasi" data-out="">
            <MessageCircle className="organization-flow__icon" size={20} aria-hidden="true" />
            <h5>Aspirasi warga</h5>
            <p>Kebutuhan, masukan, dan harapan lingkungan kita.</p>
          </div>
          <div className="organization-flow__node" data-flow-node="ide" data-out="">
            <Lightbulb className="organization-flow__icon" size={20} aria-hidden="true" />
            <h5>Ide pemuda</h5>
            <p>Energi, kreativitas, dan semangat untuk ikut bergerak.</p>
          </div>
        </div>

        <div className="organization-flow__stage organization-flow__center">
          <h4 className="organization-flow__label">02 · Bergerak bersama</h4>
          <div className="organization-flow__node organization-flow__hub" data-flow-node="hub" data-in="" data-out="">
            <div className="organization-flow__logo"><Logo size="sm" /></div>
            <h5>Karang Taruna</h5>
            <p>Margabakti · RW 07</p>
            <span className="organization-flow__hub-note">Merangkul ide.<br /> Menggerakkan potensi.</span>
          </div>
          <div className="organization-flow__values">
            <span>Berlandaskan</span>
            <p>Gotong royong · Kepedulian · Kreativitas · Kebersamaan</p>
          </div>
        </div>

        <div className="organization-flow__stage organization-flow__divisions">
          <h4 className="organization-flow__label">03 · 7 divisi bidang kerja</h4>
          {divisions.map((division, index) => (
            <div className="organization-flow__node organization-flow__division" data-open={openDivisions.has(division.nama)} data-flow-node={`division-${index}`} data-in="" data-out="" key={division.nama}>
              <button type="button" aria-expanded={openDivisions.has(division.nama)} aria-controls={`${gradientId}-division-${index}`} onClick={() => setOpenDivisions(previous => {
                const next = new Set(previous);
                if (next.has(division.nama)) next.delete(division.nama);
                else next.add(division.nama);
                return next;
              })}>
                <span className="organization-flow__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span>{division.nama}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div className="organization-flow__description" id={`${gradientId}-division-${index}`} aria-hidden={!openDivisions.has(division.nama)}><div><p>{division.peran}</p></div></div>
            </div>
          ))}
        </div>

        <div className="organization-flow__stage">
          <h4 className="organization-flow__label">04 · Untuk lingkungan</h4>
          <div className="organization-flow__node organization-flow__outcome" data-flow-node="manfaat" data-in="">
            <HeartHandshake className="organization-flow__icon" size={25} aria-hidden="true" />
            <h5>Manfaat bagi warga</h5>
            <p>Pemuda berdaya, lingkungan peduli, warga saling mendukung.</p>
            <span className="organization-flow__tag">Tumbuh bersama</span>
          </div>
        </div>
      </div>
      <p className="organization-flow__caption">Pilih bidang kerja untuk mengenal perannya. Saling terhubung, saling menguatkan.</p>
    </section>
  );
}
