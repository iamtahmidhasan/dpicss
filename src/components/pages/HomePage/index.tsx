import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import type { HomePageStats, HomePageFeaturedData } from './types'
import type { User } from '@/payload-types'

import HeroSection from './HeroSection'
import ProgramsSection from './ProgramsSection'
import WorkflowSection from './WorkflowSection'
import StatsSection from './StatsSection'
import CallToActionSection from './CallToActionSection'
import Dashboard from './Dashboard'
import FeaturedProjectsSection from './FeaturedProjectsSection'
import FeaturedEventsSection from './FeaturedEventsSection'
import FeaturedAchievementsSection from './FeaturedAchievementsSection'
import FeaturedTeamSection from './FeaturedTeamSection'
import FeaturedCoursesSection from './FeaturedCoursesSection'
import FeaturedPostsSection from './FeaturedPostsSection'

export type HomePageProps = {
  user: User | null
  lang: AppLocale
  homeSettings: HomeSettingsData
  stats: HomePageStats
  featuredData?: HomePageFeaturedData
}

export default function HomePage({ user, lang, homeSettings, stats, featuredData }: HomePageProps) {
  if (user) {
    return <Dashboard user={user} lang={lang} />
  }

  const achievementsData =
    (featuredData?.achievements || []).map((a) => ({
      ...a,
      coverImage:
        typeof a.coverImage === 'object' && a.coverImage?.url
          ? a.coverImage
          : typeof a.coverImage === 'string'
            ? { url: a.coverImage }
            : undefined,
    })) || []

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_25%),bg-background] text-foreground">
      <HeroSection user={!!user} lang={lang} homeSettings={homeSettings} stats={stats} />
      <ProgramsSection lang={lang} homeSettings={homeSettings} />
      <FeaturedProjectsSection lang={lang} homeSettings={homeSettings} projects={featuredData?.projects || []} />
      <FeaturedEventsSection lang={lang} homeSettings={homeSettings} events={featuredData?.events || []} />
      <FeaturedCoursesSection lang={lang} homeSettings={homeSettings} courses={featuredData?.courses || []} />
      <FeaturedTeamSection lang={lang} homeSettings={homeSettings} members={featuredData?.founders || []} />
      <FeaturedPostsSection lang={lang} homeSettings={homeSettings} posts={featuredData?.posts || []} />
      {/* <FeaturedAchievementsSection lang={lang} homeSettings={homeSettings} achievements={achievementsData} /> */}
      {/* <WorkflowSection lang={lang} homeSettings={homeSettings} /> */}
      {/* <StatsSection lang={lang} homeSettings={homeSettings} stats={stats} /> */}
      {/* <CallToActionSection user={!!user} lang={lang} homeSettings={homeSettings} /> */}
    </main>
  )
}
