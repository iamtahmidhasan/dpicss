// Data types for page-content globals.
// When fetched with a locale, all localized text fields resolve to `string`.

export interface HomeSettingsData {
  hero: {
    bar: string
    barSub: string
    globeLabel: string
    globeCopy: string
    point1: string
    point2: string
    point3: string
  }
  badge: string
  title1: string
  titleRotating: Array<{ word: string }>
  title2: string
  description: string
  buttons: {
    join: string
    login: string
    account: string
    explore: string
  }
  projectsSection: {
    title: string
    subtitle: string
    viewAll: string
  }
  eventsSection: {
    title: string
    subtitle: string
  }
  achievementsSection: {
    badge: string
    title: string
    subtitle: string
  }
  teamSection: {
    title: string
    subtitle: string
  }
  coursesSection: {
    label: string
    title: string
    subtitle: string
  }
  postsSection: {
    label: string
    title: string
    subtitle: string
  }
  features: {
    badge: string
    title: string
    subtitle: string
    workshops: { title: string; description: string }
    buildNight: { title: string; description: string }
    competition: { title: string; description: string }
    mentorship: { title: string; description: string }
  }
  workflow: {
    badge: string
    title: string
    description: string
    step1: { title: string; description: string }
    step2: { title: string; description: string }
    step3: { title: string; description: string }
  }
  stats: {
    badge: string
    title: string
    subtitle: string
    members: string
    courses: string
    posts: string
    memberGrowth: string
    weeklyMeetups: string
    communityTalks: string
    detail1: string
    detail2: string
    detail3: string
  }
  cta: {
    badge: string
    title: string
    description: string
    buttons: {
      join: string
      login: string
      dashboard: string
      explore: string
    }
  }
}

export interface AboutSettingsData {
  badge: string
  title: string
  description: string
  innovation: { title: string; description: string }
  collaboration: { title: string; description: string }
  technical: { title: string; description: string }
  mission: { badge: string; title: string; description: string }
  vision: {
    badge: string
    title: string
    description: string
    description2: string
    description2Title: string
  }
  join: { title: string; description: string; button: string }
  founder: { badge: string; title: string; description: string }
  sharedVision: { title: string; description: string }
  leadership: { title: string; description: string; description2: string }
  achievements: { title: string; description: string }
  heroCard: { description: string; exploreCourses: string }
  stats: {
    achievement1Label: string
    achievement1Value: string
    achievement2Label: string
    achievement2Value: string
    achievement3Label: string
    achievement3Value: string
    achievement4Label: string
    achievement4Value: string
  }
  missionVision: { title: string; description: string }
  partners: { title: string }
}

export interface CoursesSettingsData {
  title: string
  subtitle: string
  sortLatest: string
  sortPopular: string
  empty: string
  lessons: string
  enrolled: string
  hoursShort: string
  progress: string
  joinToEnroll: string
  startLearning: string
  enrollNow: string
  free: string
  levelUnknown: string
  categoryFallback: string
  detail: {
    whatsappEnroll: string
    contactMissing: string
    students: string
    hours: string
    selfPaced: string
    lessonsCount: string
    certificateBlurb: string
    tabsOverview: string
    tabsCurriculum: string
    tabsInstructor: string
    noDescription: string
    preview: string
    whatYouLearn: string
    memberBoth: string
    memberOfficial: string
    memberUnofficial: string
    progressLabel: string
    priceHintGuest: string
    percentComplete: string
    noteGuest: string
    notePay: string
    noteEnrolled: string
    includesTitle: string
    include1: string
    include2: string
    include3: string
    allCourses: string
    verifyCert: string
    instructorRole: string
  }
}

export interface ShopSettingsData {
  title: string
  subtitle: string
  sortLatest: string
  sortFeatured: string
  empty: string
  clubShop: string
  stock: string
  buyNow: string
  soldOut: string
  unavailable: string
  featuredStar: string
  categoryFallback: string
}

export interface PostsSettingsData {
  title: string
  subtitle: string
  empty: string
  untitled: string
  postImageAlt: string
  minRead: string
  quickRead: string
}

export interface AchievementsSettingsData {
  title: string
  subtitle: string
  empty: string
  untitled: string
  featured: string
  unknownDate: string
  noSummary: string
  viewDetails: string
  backToList: string
  badgeLabel: string
  noContent: string
  galleryTitle: string
  detailsTitle: string
  dateLabel: string
  venueLabel: string
  organizerLabel: string
  recognitionLabel: string
  notProvided: string
}

export interface EventsSettingsData {
  title: string
  subtitle: string
  empty: string
  emptyDescription: string
  backToEvents: string
  upcoming: string
  past: string
  seatsAvailable: string
  soldOut: string
  freeEvent: string
  buyTicket: string
  loginRequired: string
  loginFirst: string
  ticketPrice: string
  eventDetails: string
  organizer: string
  organizerRole: string
  quickInfo: string
  startsAt: string
  endsAt: string
  capacity: string
  acceptedPayments: string
  buyerName: string
  buyerNamePlaceholder: string
  buyerEmail: string
  buyerEmailPlaceholder: string
  buyerPhone: string
  buyerPhonePlaceholder: string
  quantity: string
  paymentMethod: string
  selectPaymentMethod: string
  transactionId: string
  transactionIdPlaceholder: string
  transactionIdHelp: string
  total: string
  handToHandNote: string
  submitTicket: string
  success: string
  successMessage: string
  error: string
  errorMessage: string
  notAvailable: string
  featured: string
}

export interface TeamsSettingsData {
  title: string
  subtitle: string
  empty: string
  emptyDescription: string
  backToTeams: string
  members: string
  featured: string
  established: string
  noMembers: string
  viewTeam: string
  viewProfile: string
}

export interface SearchSettingsData {
  title: string
  subtitle: string
  fieldLabel: string
  placeholder: string
  submit: string
  hintEmpty: string
  membersHeading: string
  coursesHeading: string
  postsHeading: string
  noMembers: string
  noCourses: string
  noPosts: string
  unnamedMember: string
  untitledCourse: string
}

export interface SponsorsSettingsData {
  title: string
  subtitle: string
  empty: string
  untitled: string
}

export interface MembersSettingsData {
  title: string
  subtitle: string
}

export interface ProjectsSettingsData {
  title: string
  subtitle: string
  featured: string
  all: string
  noProjects: string
  untitled: string
  projectImageAlt: string
  overview: string
  gallery: string
  team: string
  detail: string
  technologies: string
  features: string
  awards: string
  github: string
  documentation: string
  demo: string
  startDate: string
  endDate: string
  noBio: string
  categories: Array<{ key: string; label: string }>
  status: Array<{ key: string; label: string }>
  roles: Array<{ key: string; label: string }>
}

export interface ContactPageSettingsData {
  title: string
  subtitle: string
  form: {
    name: string
    namePlaceholder: string
    email: string
    emailPlaceholder: string
    phone: string
    phonePlaceholder: string
    subject: string
    subjectPlaceholder: string
    message: string
    messagePlaceholder: string
    submit: string
    submitting: string
    success: string
    successMessage: string
    error: string
    errorMessage: string
    nameRequired: string
    emailRequired: string
    emailInvalid: string
    subjectRequired: string
    messageRequired: string
  }
  info: {
    title: string
    address: string
    email: string
    phone: string
    hours: string
  }
  whatsapp: string
  officeHoursValue: string
  followUs: string
  map: {
    title: string
    embedAlt: string
    openInMaps: string
    ourLocation: string
  }
  faq: {
    title: string
    q1: string
    a1: string
    q2: string
    a2: string
    q3: string
    a3: string
    q4: string
    a4: string
  }
}
