import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Apple, ArrowDown, ArrowUp, Download, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { computeBlocs, computeTotaux, downloadCsv, nf, nf0, type Plein } from "@/lib/conso";
import { PleinSheet, type PleinInput } from "@/components/conso/PleinSheet";
import { ConsoChart } from "@/components/conso/ConsoChart";
import { Historique } from "@/components/conso/Historique";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conso CC — Suivi de consommation camping-car" },
      {
        name: "description",
        content:
          "Suivez la consommation de votre camping-car : litres, kilomètres, coût et moyenne en L/100 km, directement depuis votre iPhone.",
      },
      { property: "og:title", content: "Conso CC — Suivi de consommation camping-car" },
      {
        property: "og:description",
        content: "Ajoutez un plein en 10 secondes et suivez votre moyenne en L/100 km.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }
  return session ? <App /> : <Login />;
}

function Login() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Connexion impossible. Réessayez.");
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-8 safe-top safe-bottom">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Conso CC</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le suivi de consommation de votre camping-car.
        </p>
      </div>
      <button
        onClick={signIn}
        disabled={loading}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-base font-semibold text-background disabled:opacity-60"
      >
        <Apple className="size-5" />
        {loading ? "Connexion…" : "Se connecter avec Apple"}
      </button>
    </main>
  );
}

function App() {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Plein | null>(null);

  const { data: pleins = [], isLoading } = useQuery({
    queryKey: ["pleins"],
    queryFn: async (): Promise<Plein[]> => {
      const { data, error } = await supabase
        .from("pleins")
        .select("id,date,litres,km,cout,created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Plein[];
    },
  });

  const save = useMutation({
    mutationFn: async (values: PleinInput) => {
      if (editing) {
        const { error } = await supabase.from("pleins").update(values).eq("id", editing.id);
        if (error) throw error;
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("pleins").insert({ ...values, user_id: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pleins"] });
      setSheetOpen(false);
      setEditing(null);
      toast.success(editing ? "Plein modifié" : "Plein enregistré");
    },
    onError: () => toast.error("Enregistrement impossible. Réessayez."),
  });

  const remove = useMutation({
    mutationFn: async (p: Plein) => {
      const { error } = await supabase.from("pleins").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pleins"] });
      toast.success("Plein supprimé");
    },
    onError: () => toast.error("Suppression impossible."),
  });

  const totaux = computeTotaux(pleins);
  const blocsClos = computeBlocs(pleins).filter((b) => b.cloture);
  const dernierBloc = blocsClos[blocsClos.length - 1];
  const consoDernier = dernierBloc?.conso ?? null;
  const delta =
    consoDernier != null && totaux.moyenne != null ? consoDernier - totaux.moyenne : null;

  return (
    <main className="min-h-screen px-4 pb-32 safe-top safe-bottom">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold tracking-tight">Conso CC</h1>
        <div className="flex gap-2">
          <button
            onClick={() => (pleins.length ? downloadCsv(pleins) : toast.error("Aucun plein à exporter."))}
            className="rounded-full bg-secondary p-2.5 text-muted-foreground"
            aria-label="Exporter en CSV"
          >
            <Download className="size-4" />
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-full bg-secondary p-2.5 text-muted-foreground"
            aria-label="Se déconnecter"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <section className="card-surface p-6 text-center">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Moyenne
        </p>
        <p className="mt-2 text-6xl font-bold text-primary num">
          {totaux.moyenne != null ? nf(totaux.moyenne) : "—"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">L/100 km</p>
      </section>

      {totaux.litresEnAttente > 0 && (
        <p className="num mt-2 text-center text-xs text-muted-foreground">
          {nf(totaux.litresEnAttente, 1)} L en attente de distance
        </p>
      )}

      {consoDernier != null && (
        <section className="card-surface mt-3 flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Dernier bloc clôturé
            </p>
            <p className="num mt-1 text-3xl font-bold">{nf(consoDernier)}</p>
            <p className="text-xs text-muted-foreground">
              L/100 km
              {dernierBloc && dernierBloc.pleins.length > 1
                ? ` · ${dernierBloc.pleins.length} pleins`
                : ""}
            </p>
          </div>
          {delta != null && (
            <div
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                delta > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
              }`}
            >
              {delta > 0 ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
              <span className="num">{nf(Math.abs(delta))}</span>
            </div>
          )}
        </section>
      )}

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Km cumulés" value={`${nf0(totaux.km)} km`} />
        <Stat label="Litres cumulés" value={`${nf(totaux.litres, 1)} L`} />
        <Stat label="Dépensé" value={`${nf(totaux.cout)} €`} />
        <Stat
          label="Coût / 100 km"
          value={totaux.coutPour100 != null ? `${nf(totaux.coutPour100)} €` : "—"}
        />
      </section>

      <section className="mt-4">
        <ConsoChart pleins={pleins} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historique</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <Historique
            pleins={pleins}
            onEdit={(p) => {
              setEditing(p);
              setSheetOpen(true);
            }}
            onDelete={(p) => remove.mutate(p)}
          />
        )}
      </section>

      <button
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
        aria-label="Ajouter un plein"
        className="fixed right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] active:scale-95"
      >
        <Plus className="size-8" strokeWidth={2.5} />
      </button>

      <PleinSheet
        open={sheetOpen}
        initial={editing}
        saving={save.isPending || remove.isPending}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSubmit={(v) => save.mutate(v)}
        onDelete={(p) => remove.mutate(p)}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold num">{value}</p>
    </div>
  );
}
