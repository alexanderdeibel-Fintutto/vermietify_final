import { Link } from 'react-router-dom'
import {
  MessageCircle,
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COMMON_PROBLEMS, SGB_CATEGORIES, LETTER_TEMPLATES } from '@/lib/sgb-knowledge'
import { REGELSAETZE_2026, MEHRBEDARFE, SANKTIONEN, FRISTEN, BERATUNGSSTELLEN } from '@/lib/sgb-data'

export default function ProblemePage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Haeufige Probleme mit dem Amt</h1>
        <p className="text-muted-foreground max-w-2xl">
          Finde schnell die richtige Loesung fuer dein Problem. Jedes Thema mit Erklaerung,
          passenden Musterschreiben und praktischen Tipps.
        </p>
      </div>

      {/* Quick Problem Finder */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Was ist dein Problem?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMON_PROBLEMS.map((problem) => {
            const templates = LETTER_TEMPLATES.filter(t => problem.suggestedTemplates.includes(t.id))
            return (
              <Card key={problem.id} className="hover:border-primary/40 transition-all">
                <CardContent className="p-5">
                  <Badge variant={problem.category as 'sgb2' | 'sgb3' | 'kdu' | 'sgb10'} className="mb-3">
                    {SGB_CATEGORIES[problem.category]?.name}
                  </Badge>
                  <h3 className="font-semibold mb-1">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{problem.description}</p>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Empfohlene Schritte:</p>
                    <div className="flex flex-col gap-1.5">
                      <Link
                        to="/chat"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Zuerst: KI-Berater fragen
                      </Link>
                      {templates.map(t => (
                        <Link
                          key={t.id}
                          to={`/generator/${t.id}`}
                          className="flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          {t.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Current Regelsaetze */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Aktuelle Regelsaetze 2026
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium">Regelbedarfsstufe</th>
                    <th className="text-left py-3 px-4 font-medium">Personengruppe</th>
                    <th className="text-right py-3 px-4 font-medium">Betrag / Monat</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(REGELSAETZE_2026).map((rs) => (
                    <tr key={rs.stufe} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{rs.stufe}</td>
                      <td className="py-3 px-4 text-muted-foreground">{rs.beschreibung}</td>
                      <td className="py-3 px-4 text-right font-semibold">{rs.betrag},00 EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Mehrbedarfe */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Mehrbedarfe - Zusaetzliches Geld
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-2">Alleinerziehende ({MEHRBEDARFE.alleinerziehend.paragraph})</h3>
              <ul className="space-y-1">
                {MEHRBEDARFE.alleinerziehend.staffelung.map((s) => (
                  <li key={s.kinder} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{s.kinder}</span>
                    <span className="font-medium">{s.prozent}% = {Math.round(563 * s.prozent / 100)} EUR</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-2">Weitere Mehrbedarfe</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Schwangerschaft (ab 13. Woche)</span>
                  <span className="font-medium">{MEHRBEDARFE.schwangerschaft.prozent}% = {MEHRBEDARFE.schwangerschaft.betrag_rs1} EUR</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Behinderung (Merkzeichen G/aG)</span>
                  <span className="font-medium">{MEHRBEDARFE.behinderung.prozent}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Warmwasser dezentral</span>
                  <span className="font-medium">0,8-2,3%</span>
                </li>
                <li className="text-muted-foreground">
                  + Kostenaufwaendige Ernaehrung (individuell, Attest noetig)
                </li>
                <li className="text-muted-foreground">
                  + Unabweisbarer Mehrbedarf § 21 Abs. 6 (individuell)
                </li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link to="/generator/antrag_mehrbedarf">
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Mehrbedarf beantragen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sanktionsregeln */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Sanktionsregeln (seit Buergergeld 2023)
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm mb-2 text-destructive">Maximal {SANKTIONEN.maxKuerzung}% Kuerzung!</h3>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5" />
                    <span>1. Pflichtverletzung: 10% fuer 1 Monat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5" />
                    <span>2. Pflichtverletzung: 20% fuer 2 Monate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5" />
                    <span>3. Pflichtverletzung: 30% fuer 3 Monate (Maximum!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5" />
                    <span className="font-medium">Miete (KdU) darf NICHT gekuerzt werden!</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">Wichtige Gruende (= keine Sanktion!):</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {SANKTIONEN.wichtigeGruende.map((grund) => (
                    <li key={grund} className="flex items-start gap-2">
                      <span className="text-primary">&bull;</span>
                      {grund}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Wichtige Fristen */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-destructive" />
          Wichtige Fristen
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(FRISTEN).map(([key, frist]) => (
            <Card key={key}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="text-xs">
                    {frist.frist}
                  </Badge>
                  {'paragraph' in frist && (
                    <span className="text-xs text-muted-foreground">{frist.paragraph}</span>
                  )}
                </div>
                {'ab' in frist && <p className="text-xs text-muted-foreground mb-1">Ab: {frist.ab}</p>}
                <p className="text-xs text-primary font-medium">{frist.hinweis}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Beratungsstellen */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Beratungsstellen
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BERATUNGSSTELLEN.map((stelle) => (
            <Card key={stelle.name}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-1">{stelle.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{stelle.beschreibung}</p>
                <Badge variant={stelle.kostenlos ? 'success' : 'outline'} className="text-[10px]">
                  {stelle.kostenlos ? 'Kostenlos' : stelle.mitgliedschaft || 'Kostenpflichtig'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Dein Problem ist nicht dabei?</h2>
        <p className="text-muted-foreground mb-6">
          Unser KI-Berater kennt sich in allen Bereichen des Sozialrechts aus.
        </p>
        <Button variant="amt" size="lg" asChild>
          <Link to="/chat">
            <MessageCircle className="mr-2 h-5 w-5" />
            KI-Berater fragen
          </Link>
        </Button>
      </section>
    </div>
  )
}
