/**
 * Seed script: Populates the new page-content globals with data from messages/en.json and messages/bn.json.
 *
 * Usage:  pnpm seed:globals
 *
 * Requires DATABASE_URL and PAYLOAD_SECRET in .env.local
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })

  const en = (await import('../src/messages/en.json')).default as Record<string, any>
  const bn = (await import('../src/messages/bn.json')).default as Record<string, any>

  // Helper: build a localized value from en/bn
  const loc = (enVal: unknown, bnVal?: unknown) => ({
    en: typeof enVal === 'string' ? enVal : '',
    bn: typeof bnVal === 'string' ? bnVal : '',
  })

  // Helper: build a localized array of { word } objects from en/bn arrays
  const locArray = (enArr: string[], bnArr?: string[]) =>
    enArr.map((w, i) => ({
      word: loc(w, bnArr?.[i]),
    }))

  // ─── Home Settings ──────────────────────────────────────────────
  console.log('Seeding home-settings...')
  await payload.updateGlobal({
    slug: 'home-settings',
    data: {
      hero: {
        bar: loc(en.home.hero.bar, bn.home?.hero?.bar),
        barSub: loc(en.home.hero.barSub, bn.home?.hero?.barSub),
        globeLabel: loc(en.home.hero.globeLabel, bn.home?.hero?.globeLabel),
        globeCopy: loc(en.home.hero.globeCopy, bn.home?.hero?.globeCopy),
        point1: loc(en.home.hero.point1, bn.home?.hero?.point1),
        point2: loc(en.home.hero.point2, bn.home?.hero?.point2),
        point3: loc(en.home.hero.point3, bn.home?.hero?.point3),
      },
      badge: loc(en.home.badge, bn.home?.badge),
      title1: loc(en.home.title1, bn.home?.title1),
      titleRotating: locArray(en.home.titleRotating, bn.home?.titleRotating),
      title2: loc(en.home.title2, bn.home?.title2),
      description: loc(en.home.description, bn.home?.description),
      buttons: {
        join: loc(en.home.buttons.join, bn.home?.buttons?.join),
        login: loc(en.home.buttons.login, bn.home?.buttons?.login),
        account: loc(en.home.buttons.account, bn.home?.buttons?.account),
        explore: loc(en.home.buttons.explore, bn.home?.buttons?.explore),
      },
      projectsSection: {
        title: loc(en.home.projects.title, bn.home?.projects?.title),
        subtitle: loc(en.home.projects.subtitle, bn.home?.projects?.subtitle),
        viewAll: loc(en.home.projects.viewAll, bn.home?.projects?.viewAll),
      },
      eventsSection: {
        title: loc(en.home.events.title, bn.home?.events?.title),
        subtitle: loc(en.home.events.subtitle, bn.home?.events?.subtitle),
      },
      achievementsSection: {
        badge: loc(en.home.achievements.badge, bn.home?.achievements?.badge),
        title: loc(en.home.achievements.title, bn.home?.achievements?.title),
        subtitle: loc(en.home.achievements.subtitle, bn.home?.achievements?.subtitle),
      },
      teamSection: {
        title: loc(en.home.team.title, bn.home?.team?.title),
        subtitle: loc(en.home.team.subtitle, bn.home?.team?.subtitle),
      },
      coursesSection: {
        label: loc(en.home.courses.label, bn.home?.courses?.label),
        title: loc(en.home.courses.title, bn.home?.courses?.title),
        subtitle: loc(en.home.courses.subtitle, bn.home?.courses?.subtitle),
      },
      postsSection: {
        label: loc(en.home.posts.label, bn.home?.posts?.label),
        title: loc(en.home.posts.title, bn.home?.posts?.title),
        subtitle: loc(en.home.posts.subtitle, bn.home?.posts?.subtitle),
      },
      features: {
        badge: loc(en.home.features.badge, bn.home?.features?.badge),
        title: loc(en.home.features.title, bn.home?.features?.title),
        subtitle: loc(en.home.features.subtitle, bn.home?.features?.subtitle),
        workshops: {
          title: loc(en.home.features.workshops.title, bn.home?.features?.workshops?.title),
          description: loc(en.home.features.workshops.description, bn.home?.features?.workshops?.description),
        },
        buildNight: {
          title: loc(en.home.features.buildNight.title, bn.home?.features?.buildNight?.title),
          description: loc(en.home.features.buildNight.description, bn.home?.features?.buildNight?.description),
        },
        competition: {
          title: loc(en.home.features.competition.title, bn.home?.features?.competition?.title),
          description: loc(en.home.features.competition.description, bn.home?.features?.competition?.description),
        },
        mentorship: {
          title: loc(en.home.features.mentorship.title, bn.home?.features?.mentorship?.title),
          description: loc(en.home.features.mentorship.description, bn.home?.features?.mentorship?.description),
        },
      },
      workflow: {
        badge: loc(en.home.workflow.badge, bn.home?.workflow?.badge),
        title: loc(en.home.workflow.title, bn.home?.workflow?.title),
        description: loc(en.home.workflow.description, bn.home?.workflow?.description),
        step1: {
          title: loc(en.home.workflow.step1.title, bn.home?.workflow?.step1?.title),
          description: loc(en.home.workflow.step1.description, bn.home?.workflow?.step1?.description),
        },
        step2: {
          title: loc(en.home.workflow.step2.title, bn.home?.workflow?.step2?.title),
          description: loc(en.home.workflow.step2.description, bn.home?.workflow?.step2?.description),
        },
        step3: {
          title: loc(en.home.workflow.step3.title, bn.home?.workflow?.step3?.title),
          description: loc(en.home.workflow.step3.description, bn.home?.workflow?.step3?.description),
        },
      },
      stats: {
        badge: loc(en.home.stats.badge, bn.home?.stats?.badge),
        title: loc(en.home.stats.title, bn.home?.stats?.title),
        subtitle: loc(en.home.stats.subtitle, bn.home?.stats?.subtitle),
        members: loc(en.home.stats.members, bn.home?.stats?.members),
        courses: loc(en.home.stats.courses, bn.home?.stats?.courses),
        posts: loc(en.home.stats.posts, bn.home?.stats?.posts),
        memberGrowth: loc(en.home.stats.memberGrowth, bn.home?.stats?.memberGrowth),
        weeklyMeetups: loc(en.home.stats.weeklyMeetups, bn.home?.stats?.weeklyMeetups),
        communityTalks: loc(en.home.stats.communityTalks, bn.home?.stats?.communityTalks),
        detail1: loc(en.home.stats.detail1, bn.home?.stats?.detail1),
        detail2: loc(en.home.stats.detail2, bn.home?.stats?.detail2),
        detail3: loc(en.home.stats.detail3, bn.home?.stats?.detail3),
      },
      cta: {
        badge: loc(en.home.cta.badge, bn.home?.cta?.badge),
        title: loc(en.home.cta.title, bn.home?.cta?.title),
        description: loc(en.home.cta.description, bn.home?.cta?.description),
        buttons: {
          join: loc(en.home.cta.buttons.join, bn.home?.cta?.buttons?.join),
          login: loc(en.home.cta.buttons.login, bn.home?.cta?.buttons?.login),
          dashboard: loc(en.home.cta.buttons.dashboard, bn.home?.cta?.buttons?.dashboard),
          explore: loc(en.home.cta.buttons.explore, bn.home?.cta?.buttons?.explore),
        },
      },
    },
  })

  // ─── About Settings ─────────────────────────────────────────────
  console.log('Seeding about-settings...')
  await payload.updateGlobal({
    slug: 'about-settings',
    data: {
      badge: loc(en.about.badge, bn.about?.badge),
      title: loc(en.about.title, bn.about?.title),
      description: loc(en.about.description, bn.about?.description),
      innovation: { title: loc(en.about.innovation, bn.about?.innovation), description: loc(en.about.innovationDesc, bn.about?.innovationDesc) },
      collaboration: { title: loc(en.about.collaboration, bn.about?.collaboration), description: loc(en.about.collaborationDesc, bn.about?.collaborationDesc) },
      technical: { title: loc(en.about.technical, bn.about?.technical), description: loc(en.about.technicalDesc, bn.about?.technicalDesc) },
      mission: { badge: loc(en.about.missionBadge, bn.about?.missionBadge), title: loc(en.about.missionTitle, bn.about?.missionTitle), description: loc(en.about.missionDesc, bn.about?.missionDesc) },
      vision: { badge: loc(en.about.visionBadge, bn.about?.visionBadge), title: loc(en.about.visionTitle, bn.about?.visionTitle), description: loc(en.about.visionDesc, bn.about?.visionDesc), description2: loc(en.about.visionDesc2, bn.about?.visionDesc2), description2Title: loc(en.about.visionDesc2Title, bn.about?.visionDesc2Title) },
      join: { title: loc(en.about.joinTitle, bn.about?.joinTitle), description: loc(en.about.joinDesc, bn.about?.joinDesc), button: loc(en.about.joinButton, bn.about?.joinButton) },
      founder: { badge: loc(en.about.founderBadge, bn.about?.founderBadge), title: loc(en.about.founderTitle, bn.about?.founderTitle), description: loc(en.about.founderDesc, bn.about?.founderDesc) },
      sharedVision: { title: loc(en.about.sharedVision, bn.about?.sharedVision), description: loc(en.about.sharedVisionDesc, bn.about?.sharedVisionDesc) },
      leadership: { title: loc(en.about.leadership, bn.about?.leadership), description: loc(en.about.leadershipDesc, bn.about?.leadershipDesc), description2: loc(en.about.leadershipDesc2, bn.about?.leadershipDesc2) },
      achievements: { title: loc(en.about.achievementsTitle, bn.about?.achievementsTitle), description: loc(en.about.achievementsDescription, bn.about?.achievementsDescription) },
      heroCard: { description: loc(en.about.heroCardDesc, bn.about?.heroCardDesc), exploreCourses: loc(en.about.exploreCourses, bn.about?.exploreCourses) },
      stats: {
        achievement1Label: loc(en.about.achievement1Label, bn.about?.achievement1Label),
        achievement1Value: loc(en.about.achievement1Value, bn.about?.achievement1Value),
        achievement2Label: loc(en.about.achievement2Label, bn.about?.achievement2Label),
        achievement2Value: loc(en.about.achievement2Value, bn.about?.achievement2Value),
        achievement3Label: loc(en.about.achievement3Label, bn.about?.achievement3Label),
        achievement3Value: loc(en.about.achievement3Value, bn.about?.achievement3Value),
        achievement4Label: loc(en.about.achievement4Label, bn.about?.achievement4Label),
        achievement4Value: loc(en.about.achievement4Value, bn.about?.achievement4Value),
      },
      missionVision: { title: loc(en.about.missionVisionTitle, bn.about?.missionVisionTitle), description: loc(en.about.missionVisionDesc, bn.about?.missionVisionDesc) },
      partners: { title: loc(en.about.partnersTitle, bn.about?.partnersTitle) },
    },
  })

  // ─── Courses Settings ───────────────────────────────────────────
  console.log('Seeding courses-settings...')
  await payload.updateGlobal({
    slug: 'courses-settings',
    data: {
      title: loc(en.courses.title, bn.courses?.title),
      subtitle: loc(en.courses.subtitle, bn.courses?.subtitle),
      sortLatest: loc(en.courses.sortLatest, bn.courses?.sortLatest),
      sortPopular: loc(en.courses.sortPopular, bn.courses?.sortPopular),
      empty: loc(en.courses.empty, bn.courses?.empty),
      lessons: loc(en.courses.lessons, bn.courses?.lessons),
      enrolled: loc(en.courses.enrolled, bn.courses?.enrolled),
      hoursShort: loc(en.courses.hoursShort, bn.courses?.hoursShort),
      progress: loc(en.courses.progress, bn.courses?.progress),
      joinToEnroll: loc(en.courses.joinToEnroll, bn.courses?.joinToEnroll),
      startLearning: loc(en.courses.startLearning, bn.courses?.startLearning),
      enrollNow: loc(en.courses.enrollNow, bn.courses?.enrollNow),
      free: loc(en.courses.free, bn.courses?.free),
      levelUnknown: loc(en.courses.levelUnknown, bn.courses?.levelUnknown),
      categoryFallback: loc(en.courses.categoryFallback, bn.courses?.categoryFallback),
      detail: {
        whatsappEnroll: loc(en.courses.detail.whatsappEnroll, bn.courses?.detail?.whatsappEnroll),
        contactMissing: loc(en.courses.detail.contactMissing, bn.courses?.detail?.contactMissing),
        students: loc(en.courses.detail.students, bn.courses?.detail?.students),
        hours: loc(en.courses.detail.hours, bn.courses?.detail?.hours),
        selfPaced: loc(en.courses.detail.selfPaced, bn.courses?.detail?.selfPaced),
        lessonsCount: loc(en.courses.detail.lessonsCount, bn.courses?.detail?.lessonsCount),
        certificateBlurb: loc(en.courses.detail.certificateBlurb, bn.courses?.detail?.certificateBlurb),
        tabsOverview: loc(en.courses.detail.tabsOverview, bn.courses?.detail?.tabsOverview),
        tabsCurriculum: loc(en.courses.detail.tabsCurriculum, bn.courses?.detail?.tabsCurriculum),
        tabsInstructor: loc(en.courses.detail.tabsInstructor, bn.courses?.detail?.tabsInstructor),
        noDescription: loc(en.courses.detail.noDescription, bn.courses?.detail?.noDescription),
        preview: loc(en.courses.detail.preview, bn.courses?.detail?.preview),
        whatYouLearn: loc(en.courses.detail.whatYouLearn, bn.courses?.detail?.whatYouLearn),
        memberBoth: loc(en.courses.detail.memberBoth, bn.courses?.detail?.memberBoth),
        memberOfficial: loc(en.courses.detail.memberOfficial, bn.courses?.detail?.memberOfficial),
        memberUnofficial: loc(en.courses.detail.memberUnofficial, bn.courses?.detail?.memberUnofficial),
        progressLabel: loc(en.courses.detail.progressLabel, bn.courses?.detail?.progressLabel),
        priceHintGuest: loc(en.courses.detail.priceHintGuest, bn.courses?.detail?.priceHintGuest),
        percentComplete: loc(en.courses.detail.percentComplete, bn.courses?.detail?.percentComplete),
        noteGuest: loc(en.courses.detail.noteGuest, bn.courses?.detail?.noteGuest),
        notePay: loc(en.courses.detail.notePay, bn.courses?.detail?.notePay),
        noteEnrolled: loc(en.courses.detail.noteEnrolled, bn.courses?.detail?.noteEnrolled),
        includesTitle: loc(en.courses.detail.includesTitle, bn.courses?.detail?.includesTitle),
        include1: loc(en.courses.detail.include1, bn.courses?.detail?.include1),
        include2: loc(en.courses.detail.include2, bn.courses?.detail?.include2),
        include3: loc(en.courses.detail.include3, bn.courses?.detail?.include3),
        allCourses: loc(en.courses.detail.allCourses, bn.courses?.detail?.allCourses),
        verifyCert: loc(en.courses.detail.verifyCert, bn.courses?.detail?.verifyCert),
        instructorRole: loc(en.courses.detail.instructorRole, bn.courses?.detail?.instructorRole),
      },
    },
  })

  // ─── Shop Settings ──────────────────────────────────────────────
  console.log('Seeding shop-settings...')
  await payload.updateGlobal({
    slug: 'shop-settings',
    data: {
      title: loc(en.shop.title, bn.shop?.title),
      subtitle: loc(en.shop.subtitle, bn.shop?.subtitle),
      sortLatest: loc(en.shop.sortLatest, bn.shop?.sortLatest),
      sortFeatured: loc(en.shop.sortFeatured, bn.shop?.sortFeatured),
      empty: loc(en.shop.empty, bn.shop?.empty),
      clubShop: loc(en.shop.clubShop, bn.shop?.clubShop),
      stock: loc(en.shop.stock, bn.shop?.stock),
      buyNow: loc(en.shop.buyNow, bn.shop?.buyNow),
      soldOut: loc(en.shop.soldOut, bn.shop?.soldOut),
      unavailable: loc(en.shop.unavailable, bn.shop?.unavailable),
      featuredStar: loc(en.shop.featuredStar, bn.shop?.featuredStar),
      categoryFallback: loc(en.shop.categoryFallback, bn.shop?.categoryFallback),
    },
  })

  // ─── Posts Settings ─────────────────────────────────────────────
  console.log('Seeding posts-settings...')
  await payload.updateGlobal({
    slug: 'posts-settings',
    data: {
      title: loc(en.posts.title, bn.posts?.title),
      subtitle: loc(en.posts.subtitle, bn.posts?.subtitle),
      empty: loc(en.posts.empty, bn.posts?.empty),
      untitled: loc(en.posts.untitled, bn.posts?.untitled),
      postImageAlt: loc(en.posts.postImageAlt, bn.posts?.postImageAlt),
      minRead: loc(en.posts.minRead, bn.posts?.minRead),
      quickRead: loc(en.posts.quickRead, bn.posts?.quickRead),
    },
  })

  // ─── Achievements Settings ──────────────────────────────────────
  console.log('Seeding achievements-settings...')
  await payload.updateGlobal({
    slug: 'achievements-settings',
    data: {
      title: loc(en.achievements.title, bn.achievements?.title),
      subtitle: loc(en.achievements.subtitle, bn.achievements?.subtitle),
      empty: loc(en.achievements.empty, bn.achievements?.empty),
      untitled: loc(en.achievements.untitled, bn.achievements?.untitled),
      featured: loc(en.achievements.featured, bn.achievements?.featured),
      unknownDate: loc(en.achievements.unknownDate, bn.achievements?.unknownDate),
      noSummary: loc(en.achievements.noSummary, bn.achievements?.noSummary),
      viewDetails: loc(en.achievements.viewDetails, bn.achievements?.viewDetails),
      backToList: loc(en.achievements.backToList, bn.achievements?.backToList),
      badgeLabel: loc(en.achievements.badgeLabel, bn.achievements?.badgeLabel),
      noContent: loc(en.achievements.noContent, bn.achievements?.noContent),
      galleryTitle: loc(en.achievements.galleryTitle, bn.achievements?.galleryTitle),
      detailsTitle: loc(en.achievements.detailsTitle, bn.achievements?.detailsTitle),
      dateLabel: loc(en.achievements.dateLabel, bn.achievements?.dateLabel),
      venueLabel: loc(en.achievements.venueLabel, bn.achievements?.venueLabel),
      organizerLabel: loc(en.achievements.organizerLabel, bn.achievements?.organizerLabel),
      recognitionLabel: loc(en.achievements.recognitionLabel, bn.achievements?.recognitionLabel),
      notProvided: loc(en.achievements.notProvided, bn.achievements?.notProvided),
    },
  })

  // ─── Events Settings ────────────────────────────────────────────
  console.log('Seeding events-settings...')
  await payload.updateGlobal({
    slug: 'events-settings',
    data: {
      title: loc(en.events.title, bn.events?.title),
      subtitle: loc(en.events.subtitle, bn.events?.subtitle),
      empty: loc(en.events.empty, bn.events?.empty),
      emptyDescription: loc(en.events.emptyDescription, bn.events?.emptyDescription),
      backToEvents: loc(en.events.backToEvents, bn.events?.backToEvents),
      upcoming: loc(en.events.upcoming, bn.events?.upcoming),
      past: loc(en.events.past, bn.events?.past),
      seatsAvailable: loc(en.events.seatsAvailable, bn.events?.seatsAvailable),
      soldOut: loc(en.events.soldOut, bn.events?.soldOut),
      freeEvent: loc(en.events.freeEvent, bn.events?.freeEvent),
      buyTicket: loc(en.events.buyTicket, bn.events?.buyTicket),
      loginRequired: loc(en.events.loginRequired, bn.events?.loginRequired),
      loginFirst: loc(en.events.loginFirst, bn.events?.loginFirst),
      ticketPrice: loc(en.events.ticketPrice, bn.events?.ticketPrice),
      eventDetails: loc(en.events.eventDetails, bn.events?.eventDetails),
      organizer: loc(en.events.organizer, bn.events?.organizer),
      organizerRole: loc(en.events.organizerRole, bn.events?.organizerRole),
      quickInfo: loc(en.events.quickInfo, bn.events?.quickInfo),
      startsAt: loc(en.events.startsAt, bn.events?.startsAt),
      endsAt: loc(en.events.endsAt, bn.events?.endsAt),
      capacity: loc(en.events.capacity, bn.events?.capacity),
      acceptedPayments: loc(en.events.acceptedPayments, bn.events?.acceptedPayments),
      buyerName: loc(en.events.buyerName, bn.events?.buyerName),
      buyerNamePlaceholder: loc(en.events.buyerNamePlaceholder, bn.events?.buyerNamePlaceholder),
      buyerEmail: loc(en.events.buyerEmail, bn.events?.buyerEmail),
      buyerEmailPlaceholder: loc(en.events.buyerEmailPlaceholder, bn.events?.buyerEmailPlaceholder),
      buyerPhone: loc(en.events.buyerPhone, bn.events?.buyerPhone),
      buyerPhonePlaceholder: loc(en.events.buyerPhonePlaceholder, bn.events?.buyerPhonePlaceholder),
      quantity: loc(en.events.quantity, bn.events?.quantity),
      paymentMethod: loc(en.events.paymentMethod, bn.events?.paymentMethod),
      selectPaymentMethod: loc(en.events.selectPaymentMethod, bn.events?.selectPaymentMethod),
      transactionId: loc(en.events.transactionId, bn.events?.transactionId),
      transactionIdPlaceholder: loc(en.events.transactionIdPlaceholder, bn.events?.transactionIdPlaceholder),
      transactionIdHelp: loc(en.events.transactionIdHelp, bn.events?.transactionIdHelp),
      total: loc(en.events.total, bn.events?.total),
      handToHandNote: loc(en.events.handToHandNote, bn.events?.handToHandNote),
      submitTicket: loc(en.events.submitTicket, bn.events?.submitTicket),
      success: loc(en.events.success, bn.events?.success),
      successMessage: loc(en.events.successMessage, bn.events?.successMessage),
      error: loc(en.events.error, bn.events?.error),
      errorMessage: loc(en.events.errorMessage, bn.events?.errorMessage),
      notAvailable: loc(en.events.notAvailable, bn.events?.notAvailable),
      featured: loc(en.events.featured, bn.events?.featured),
    },
  })

  // ─── Teams Settings ─────────────────────────────────────────────
  console.log('Seeding teams-settings...')
  await payload.updateGlobal({
    slug: 'teams-settings',
    data: {
      title: loc(en.teams.title, bn.teams?.title),
      subtitle: loc(en.teams.subtitle, bn.teams?.subtitle),
      empty: loc(en.teams.empty, bn.teams?.empty),
      emptyDescription: loc(en.teams.emptyDescription, bn.teams?.emptyDescription),
      backToTeams: loc(en.teams.backToTeams, bn.teams?.backToTeams),
      members: loc(en.teams.members, bn.teams?.members),
      featured: loc(en.teams.featured, bn.teams?.featured),
      established: loc(en.teams.established, bn.teams?.established),
      noMembers: loc(en.teams.noMembers, bn.teams?.noMembers),
      viewTeam: loc(en.teams.viewTeam, bn.teams?.viewTeam),
      viewProfile: loc(en.teams.viewProfile, bn.teams?.viewProfile),
    },
  })

  // ─── Search Settings ────────────────────────────────────────────
  console.log('Seeding search-settings...')
  await payload.updateGlobal({
    slug: 'search-settings',
    data: {
      title: loc(en.search.title, bn.search?.title),
      subtitle: loc(en.search.subtitle, bn.search?.subtitle),
      fieldLabel: loc(en.search.fieldLabel, bn.search?.fieldLabel),
      placeholder: loc(en.search.placeholder, bn.search?.placeholder),
      submit: loc(en.search.submit, bn.search?.submit),
      hintEmpty: loc(en.search.hintEmpty, bn.search?.hintEmpty),
      membersHeading: loc(en.search.membersHeading, bn.search?.membersHeading),
      coursesHeading: loc(en.search.coursesHeading, bn.search?.coursesHeading),
      postsHeading: loc(en.search.postsHeading, bn.search?.postsHeading),
      noMembers: loc(en.search.noMembers, bn.search?.noMembers),
      noCourses: loc(en.search.noCourses, bn.search?.noCourses),
      noPosts: loc(en.search.noPosts, bn.search?.noPosts),
      unnamedMember: loc(en.search.unnamedMember, bn.search?.unnamedMember),
      untitledCourse: loc(en.search.untitledCourse, bn.search?.untitledCourse),
    },
  })

  // ─── Contact Page Settings ──────────────────────────────────────
  console.log('Seeding contact-page-settings...')
  await payload.updateGlobal({
    slug: 'contact-page-settings',
    data: {
      title: loc(en.contact.title, bn.contact?.title),
      subtitle: loc(en.contact.subtitle, bn.contact?.subtitle),
      form: {
        name: loc(en.contact.form.name, bn.contact?.form?.name),
        namePlaceholder: loc(en.contact.form.namePlaceholder, bn.contact?.form?.namePlaceholder),
        email: loc(en.contact.form.email, bn.contact?.form?.email),
        emailPlaceholder: loc(en.contact.form.emailPlaceholder, bn.contact?.form?.emailPlaceholder),
        phone: loc(en.contact.form.phone, bn.contact?.form?.phone),
        phonePlaceholder: loc(en.contact.form.phonePlaceholder, bn.contact?.form?.phonePlaceholder),
        subject: loc(en.contact.form.subject, bn.contact?.form?.subject),
        subjectPlaceholder: loc(en.contact.form.subjectPlaceholder, bn.contact?.form?.subjectPlaceholder),
        message: loc(en.contact.form.message, bn.contact?.form?.message),
        messagePlaceholder: loc(en.contact.form.messagePlaceholder, bn.contact?.form?.messagePlaceholder),
        submit: loc(en.contact.form.submit, bn.contact?.form?.submit),
        submitting: loc(en.contact.form.submitting, bn.contact?.form?.submitting),
        success: loc(en.contact.form.success, bn.contact?.form?.success),
        successMessage: loc(en.contact.form.successMessage, bn.contact?.form?.successMessage),
        error: loc(en.contact.form.error, bn.contact?.form?.error),
        errorMessage: loc(en.contact.form.errorMessage, bn.contact?.form?.errorMessage),
        nameRequired: loc(en.contact.form.nameRequired, bn.contact?.form?.nameRequired),
        emailRequired: loc(en.contact.form.emailRequired, bn.contact?.form?.emailRequired),
        emailInvalid: loc(en.contact.form.emailInvalid, bn.contact?.form?.emailInvalid),
        subjectRequired: loc(en.contact.form.subjectRequired, bn.contact?.form?.subjectRequired),
        messageRequired: loc(en.contact.form.messageRequired, bn.contact?.form?.messageRequired),
      },
      info: {
        title: loc(en.contact.info.title, bn.contact?.info?.title),
        address: loc(en.contact.info.address, bn.contact?.info?.address),
        email: loc(en.contact.info.email, bn.contact?.info?.email),
        phone: loc(en.contact.info.phone, bn.contact?.info?.phone),
        hours: loc(en.contact.info.hours, bn.contact?.info?.hours),
      },
      whatsapp: loc(en.contact.whatsapp, bn.contact?.whatsapp),
      officeHoursValue: loc(en.contact.officeHoursValue, bn.contact?.officeHoursValue),
      followUs: loc(en.contact.followUs, bn.contact?.followUs),
      map: {
        title: loc(en.contact.map.title, bn.contact?.map?.title),
        embedAlt: loc(en.contact.map.embedAlt, bn.contact?.map?.embedAlt),
        openInMaps: loc(en.contact.map.openInMaps, bn.contact?.map?.openInMaps),
        ourLocation: loc(en.contact.map.ourLocation, bn.contact?.map?.ourLocation),
      },
      faq: {
        title: loc(en.contact.faq.title, bn.contact?.faq?.title),
        q1: loc(en.contact.faq.q1, bn.contact?.faq?.q1),
        a1: loc(en.contact.faq.a1, bn.contact?.faq?.a1),
        q2: loc(en.contact.faq.q2, bn.contact?.faq?.q2),
        a2: loc(en.contact.faq.a2, bn.contact?.faq?.a2),
        q3: loc(en.contact.faq.q3, bn.contact?.faq?.q3),
        a3: loc(en.contact.faq.a3, bn.contact?.faq?.a3),
        q4: loc(en.contact.faq.q4, bn.contact?.faq?.q4),
        a4: loc(en.contact.faq.a4, bn.contact?.faq?.a4),
      },
    },
  })

  // ─── Sponsors Settings ──────────────────────────────────────────
  console.log('Seeding sponsors-settings...')
  await payload.updateGlobal({
    slug: 'sponsors-settings',
    data: {
      title: loc('Our Partners & Sponsors', 'আমাদের পার্টনার ও স্পন্সর'),
      subtitle: loc(
        'We are grateful to the organizations that support our mission to inspire innovation and learning in computing and technology.',
        'আমাদের কম্পিউটিং ও প্রযুক্তিতে উদ্ভাবন এবং শেখার মিশনকে সমর্থনকারী প্রতিষ্ঠানগুলোর প্রতি আমরা কৃতজ্ঞ।',
      ),
      empty: loc('No partners or sponsors yet. Check back soon!', 'এখনও কোনো পার্টনার বা স্পন্সর নেই। শীঘ্রই দেখুন!'),
      untitled: loc('Sponsor', 'স্পন্সর'),
    },
  })

  // ─── Members Settings ───────────────────────────────────────────
  console.log('Seeding members-settings...')
  await payload.updateGlobal({
    slug: 'members-settings',
    data: {
      title: loc('Official Members', 'অফিসিয়াল সদস্য'),
      subtitle: loc(
        'Meet our active DPICS community members. Click on any member to view their profile.',
        'আমাদের সক্রিয় DPICS কমিউনিটি সদস্যদের সাথে পরিচিত হোন। যেকোনো সদস্যের প্রোফাইল দেখতে ক্লিক করুন।',
      ),
    },
  })

  // ─── Projects Settings ──────────────────────────────────────────
  console.log('Seeding projects-settings...')
  const projLoc = (en: string, bn: string) => ({ en, bn })
  await payload.updateGlobal({
    slug: 'projects-settings',
    data: {
      title: projLoc('Projects', 'প্রজেক্ট'),
      subtitle: projLoc('Explore our software and automation projects', 'আমাদের সফটওয়্যার ও অটোমেশন প্রজেক্টগুলো দেখুন'),
      featured: projLoc('Featured Projects', 'ফিচার্ড প্রজেক্ট'),
      all: projLoc('All Projects', 'সব প্রজেক্ট'),
      noProjects: projLoc('No projects found.', 'কোনো প্রজেক্ট পাওয়া যায়নি।'),
      untitled: projLoc('Untitled', 'শিরোনামহীন'),
      projectImageAlt: projLoc('Project', 'প্রজেক্ট'),
      overview: projLoc('Overview', 'ওভারভিউ'),
      gallery: projLoc('Gallery', 'গ্যালারি'),
      team: projLoc('Team', 'টিম'),
      detail: projLoc('Project Details', 'প্রজেক্ট বিবরণ'),
      technologies: projLoc('Technologies', 'প্রযুক্তি'),
      features: projLoc('Features', 'বৈশিষ্ট্য'),
      awards: projLoc('Awards & Achievements', 'পুরস্কার ও অর্জন'),
      github: projLoc('GitHub', 'গিটহাব'),
      documentation: projLoc('Documentation', 'ডকিউমেন্টেশন'),
      demo: projLoc('Live Demo', 'লাইভ ডেমো'),
      startDate: projLoc('Started', 'শুরু'),
      endDate: projLoc('Completed', 'শেষ'),
      noBio: projLoc('No bio available.', 'কোনো বায়ো নেই।'),
      categories: [
        { key: 'competition', label: projLoc('Competition Project', 'প্রতিযোগিতা প্রকল্প') },
        { key: 'research', label: projLoc('Research', 'গবেষণা') },
        { key: 'education', label: projLoc('Education', 'শিক্ষা') },
        { key: 'automation', label: projLoc('Automation', 'অটোমেশন') },
        { key: 'iot', label: projLoc('IoT & Smart Systems', 'আইওটি ও স্মার্ট সিস্টেম') },
        { key: 'ai-ml', label: projLoc('AI & Machine Learning', 'এআই ও মেশিন লার্নিং') },
        { key: 'drones', label: projLoc('Drones', 'ড্রোন') },
        { key: 'prototyping', label: projLoc('Prototyping', 'প্রোটোটাইপিং') },
      ],
      status: [
        { key: 'draft', label: projLoc('Draft', 'খসডা') },
        { key: 'inProgress', label: projLoc('In Progress', 'চলছে') },
        { key: 'completed', label: projLoc('Completed', 'সম্পন্ন') },
        { key: 'onHold', label: projLoc('On Hold', 'অপেক্ষায়') },
      ],
      roles: [
        { key: 'lead', label: projLoc('Team Leader', 'টিম লিডার') },
        { key: 'hardware', label: projLoc('Hardware', 'হার্ডওয়্যার') },
        { key: 'software', label: projLoc('Software', 'সফটওয়্যার') },
        { key: 'mechanical', label: projLoc('Mechanical', 'মেকানিক্যাল') },
        { key: 'designer', label: projLoc('Designer', 'ডিজাইনার') },
        { key: 'docs', label: projLoc('Documentation', 'ডকুমেন্টেশন') },
      ],
    },
  })

  console.log('All page-content globals seeded successfully!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
