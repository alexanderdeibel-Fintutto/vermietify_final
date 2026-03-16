import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { CreditsProvider } from '@/contexts/CreditsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Layout from '@/components/layout/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import ScrollToTop from '@/components/ScrollToTop'

// Eagerly load the home page for fast first paint
import HomePage from '@/pages/HomePage'

// Lazy load everything else
const BescheidScanPage = lazy(() => import('@/pages/BescheidScanPage'))
const ChatPage = lazy(() => import('@/pages/ChatPage'))
const MusterschreibenPage = lazy(() => import('@/pages/MusterschreibenPage'))
const GeneratorPage = lazy(() => import('@/pages/GeneratorPage'))
const ForumPage = lazy(() => import('@/pages/ForumPage'))
const ForumNewPostPage = lazy(() => import('@/pages/forum/ForumNewPostPage'))
const ForumTopicPage = lazy(() => import('@/pages/forum/ForumTopicPage'))
const PricingPage = lazy(() => import('@/pages/PricingPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const ProblemePage = lazy(() => import('@/pages/ProblemePage'))
const RechnerPage = lazy(() => import('@/pages/RechnerPage'))
const BuergergeldRechner = lazy(() => import('@/pages/rechner/BuergergeldRechner'))
const KduRechner = lazy(() => import('@/pages/rechner/KduRechner'))
const MehrbedarfRechner = lazy(() => import('@/pages/rechner/MehrbedarfRechner'))
const FreibetragsRechner = lazy(() => import('@/pages/rechner/FreibetragsRechner'))
const SanktionsRechner = lazy(() => import('@/pages/rechner/SanktionsRechner'))
const SchonvermoegensRechner = lazy(() => import('@/pages/rechner/SchonvermoegensRechner'))
const FristenRechner = lazy(() => import('@/pages/rechner/FristenRechner'))
const WiderspruchTracker = lazy(() => import('@/pages/WiderspruchTracker'))
const PkhRechner = lazy(() => import('@/pages/rechner/PkhRechner'))
const ErstausstattungsRechner = lazy(() => import('@/pages/rechner/ErstausstattungsRechner'))
const UmzugskostenRechner = lazy(() => import('@/pages/rechner/UmzugskostenRechner'))
const ProfilPage = lazy(() => import('@/pages/ProfilPage'))
const SuchePage = lazy(() => import('@/pages/SuchePage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const KontaktPage = lazy(() => import('@/pages/KontaktPage'))
const WissenPage = lazy(() => import('@/pages/WissenPage'))
const VerlaufPage = lazy(() => import('@/pages/VerlaufPage'))
const BenachrichtigungenPage = lazy(() => import('@/pages/BenachrichtigungenPage'))
const ChecklistenPage = lazy(() => import('@/pages/ChecklistenPage'))
const GlossarPage = lazy(() => import('@/pages/GlossarPage'))
const NotizenPage = lazy(() => import('@/pages/NotizenPage'))
const VergleichsRechner = lazy(() => import('@/pages/VergleichsRechner'))
const ImpressumPage = lazy(() => import('@/pages/ImpressumPage'))
const DatenschutzPage = lazy(() => import('@/pages/DatenschutzPage'))
const AgbPage = lazy(() => import('@/pages/AgbPage'))
const DokumentePage = lazy(() => import('@/pages/DokumentePage'))
const AktenzeichenPage = lazy(() => import('@/pages/AktenzeichenPage'))
const StatistikenPage = lazy(() => import('@/pages/StatistikenPage'))
const TerminePage = lazy(() => import('@/pages/TerminePage'))
const BewerbungsTracker = lazy(() => import('@/pages/BewerbungsTracker'))
const NotfallSeite = lazy(() => import('@/pages/NotfallSeite'))
const EinkommenRechner = lazy(() => import('@/pages/rechner/EinkommenRechner'))
const WiderspruchVorlagen = lazy(() => import('@/pages/WiderspruchVorlagen'))
const HaushaltsRechner = lazy(() => import('@/pages/rechner/HaushaltsRechner'))
const AnbieterVergleich = lazy(() => import('@/pages/AnbieterVergleich'))
const MeineFaellePage = lazy(() => import('@/pages/MeineFaellePage'))
const AnwaltsSuche = lazy(() => import('@/pages/AnwaltsSuche'))
const LernbereichPage = lazy(() => import('@/pages/LernbereichPage'))
const MietspiegelRechner = lazy(() => import('@/pages/rechner/MietspiegelRechner'))
const ErfolgsgeschichtenPage = lazy(() => import('@/pages/ErfolgsgeschichtenPage'))
const SanktionsTracker = lazy(() => import('@/pages/SanktionsTracker'))
const BescheidArchivPage = lazy(() => import('@/pages/BescheidArchivPage'))
const KostenUebersichtPage = lazy(() => import('@/pages/KostenUebersichtPage'))
const ErinnerungenPage = lazy(() => import('@/pages/ErinnerungenPage'))

import PageSkeleton from '@/components/PageSkeleton'

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <CreditsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Onboarding (no layout) */}
              <Route path="onboarding" element={<OnboardingPage />} />

              {/* Main app with layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />

                {/* BescheidScan */}
                <Route path="scan" element={<BescheidScanPage />} />

                {/* KI-Rechtsberater */}
                <Route path="chat" element={<ChatPage />} />

                {/* Dokumenten-Werkstatt */}
                <Route path="musterschreiben" element={<MusterschreibenPage />} />
                <Route path="generator/:templateId" element={<GeneratorPage />} />

                {/* Community Forum */}
                <Route path="forum" element={<ForumPage />} />
                <Route path="forum/neu" element={<ForumNewPostPage />} />
                <Route path="forum/:topicId" element={<ForumTopicPage />} />

                {/* Pricing */}
                <Route path="preise" element={<PricingPage />} />
                <Route path="pricing" element={<PricingPage />} />

                {/* AmtsRechner Suite */}
                <Route path="rechner" element={<RechnerPage />} />
                <Route path="rechner/buergergeld" element={<BuergergeldRechner />} />
                <Route path="rechner/kdu" element={<KduRechner />} />
                <Route path="rechner/mehrbedarf" element={<MehrbedarfRechner />} />
                <Route path="rechner/freibetrag" element={<FreibetragsRechner />} />
                <Route path="rechner/sanktion" element={<SanktionsRechner />} />
                <Route path="rechner/schonvermoegen" element={<SchonvermoegensRechner />} />
                <Route path="rechner/fristen" element={<FristenRechner />} />
                <Route path="rechner/pkh" element={<PkhRechner />} />
                <Route path="rechner/erstausstattung" element={<ErstausstattungsRechner />} />
                <Route path="rechner/umzugskosten" element={<UmzugskostenRechner />} />
                <Route path="rechner/vergleich" element={<VergleichsRechner />} />
                <Route path="rechner/einkommen" element={<EinkommenRechner />} />
                <Route path="rechner/haushalt" element={<HaushaltsRechner />} />
                <Route path="rechner/mietspiegel" element={<MietspiegelRechner />} />

                {/* Widerspruch-Vorlagen */}
                <Route path="widerspruch-vorlagen" element={<WiderspruchVorlagen />} />

                {/* Widerspruch-Tracker */}
                <Route path="tracker" element={<WiderspruchTracker />} />

                {/* Probleme-Guide */}
                <Route path="probleme" element={<ProblemePage />} />

                {/* Dashboard, Profile & Search */}
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profil" element={<ProfilPage />} />
                <Route path="suche" element={<SuchePage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="kontakt" element={<KontaktPage />} />
                <Route path="wissen" element={<WissenPage />} />
                <Route path="verlauf" element={<VerlaufPage />} />
                <Route path="benachrichtigungen" element={<BenachrichtigungenPage />} />
                <Route path="checklisten" element={<ChecklistenPage />} />
                <Route path="glossar" element={<GlossarPage />} />
                <Route path="notizen" element={<NotizenPage />} />
                <Route path="dokumente" element={<DokumentePage />} />
                <Route path="aktenzeichen" element={<AktenzeichenPage />} />
                <Route path="statistiken" element={<StatistikenPage />} />
                <Route path="termine" element={<TerminePage />} />
                <Route path="bewerbungen" element={<BewerbungsTracker />} />
                <Route path="notfall" element={<NotfallSeite />} />
                <Route path="anbieter-vergleich" element={<AnbieterVergleich />} />
                <Route path="faelle" element={<MeineFaellePage />} />
                <Route path="anwaltssuche" element={<AnwaltsSuche />} />
                <Route path="lernen" element={<LernbereichPage />} />
                <Route path="erfolgsgeschichten" element={<ErfolgsgeschichtenPage />} />
                <Route path="sanktions-tracker" element={<SanktionsTracker />} />
                <Route path="bescheid-archiv" element={<BescheidArchivPage />} />
                <Route path="kosten" element={<KostenUebersichtPage />} />
                <Route path="erinnerungen" element={<ErinnerungenPage />} />

                {/* Auth */}
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* Legal Pages */}
                <Route path="impressum" element={<ImpressumPage />} />
                <Route path="datenschutz" element={<DatenschutzPage />} />
                <Route path="agb" element={<AgbPage />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CreditsProvider>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
