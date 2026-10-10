import { EmptyState } from "@/components/ui/card";

export default function ImagesPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Immagini</h1>
      <EmptyState
        title="In arrivo nella Fase 4"
        description="Generazione di ritratti NPC, mostri, luoghi e mappe con uno stile artistico coerente per la campagna. Per ora puoi comunque incollare un URL immagine nei campi 'Immagine' delle singole schede."
      />
    </div>
  );
}
