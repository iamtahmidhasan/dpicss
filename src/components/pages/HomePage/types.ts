export type HomePageStats = {
  members: number
  courses: number
  posts: number
}

export type HomePageFeaturedData = {
  projects: {
    id: string
    slug?: string
    title?: string
    shortDescription?: string
    thumbnail?: { url?: string } | string
    category?: string
    technologies?: { name?: string }[]
    status?: string
    githubUrl?: string
    demoUrl?: string
  }[]
  events: {
    id: string
    name: string
    slug?: string
    tagline?: string
    featuredImage?: { url?: string }
    eventDate?: string
    endDate?: string
    venue?: string
    totalSeats?: number
    soldSeats?: number
    ticketPrice?: number
    ticketCurrency?: string
    status?: string
    category?: { title?: string }
    organizer?: { firstName?: string; lastName?: string }
  }[]
  achievements: {
    id: string
    title: string
    slug?: string
    summary?: string
    coverImage?: { url?: string } | string
    achievementDate?: string
    venue?: string
    organizer?: string
    badge?: string
    status?: string
  }[]
  founders: {
    id: string
    username?: string
    firstName?: string
    lastName?: string
    fullName?: string
    avatar?: string | { url?: string }
    bio?: string
    memberType?: string
    skills?: { skill?: string; level?: string }[]
    socialLinks?: {
      facebook?: string
      linkedin?: string
      github?: string
      website?: string
    }
  }[]
  courses: {
    id: string
    title?: string
    shortDescription?: string
    thumbnail?: { url?: string } | string
    category?: string
    level?: string
    duration?: { totalHours?: number; totalWeeks?: number }
    instructors?: { firstName?: string; lastName?: string; avatar?: { url?: string } }[]
    enrollmentCount?: number
    averageRating?: number
    pricing?: { officialMemberPrice?: number; unofficialMemberPrice?: number; currency?: string }
  }[]
  posts: {
    id: string
    slug?: string
    title?: string
    excerpt?: string
    featuredImage?: { url?: string } | string
    category?: { title?: string; slug?: string }
    author?: { firstName?: string; lastName?: string; avatar?: { url?: string } }
    publishedAt?: string
    readingTime?: number
    viewCount?: number
    likeCount?: number
  }[]
}
