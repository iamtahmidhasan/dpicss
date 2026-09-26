import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { SearchSettingsData, PostsSettingsData } from '@/globals/types'

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>

const getSingleParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const query = getSingleParam(resolvedSearchParams?.q).trim()

  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const [searchSettings, postsSettings] = await Promise.all([
    getGlobalPayload<SearchSettingsData>('search-settings', locale),
    getGlobalPayload<PostsSettingsData>('posts-settings', locale),
  ])

  let memberResults: Array<{
    id: string
    firstName?: string
    lastName?: string
    username?: string
    bio?: string
  }> = []
  let courseResults: Array<{
    id: string
    title?: unknown
    slug?: string
    description?: unknown
  }> = []
  let postResults: Array<{
    id: string
    title?: unknown
    slug?: string
    excerpt?: unknown
  }> = []

  if (query) {
    // Run all three searches in parallel instead of sequentially
    const [memberResults_raw, courseResults_raw, postResults_raw] = await Promise.allSettled([
      payload.find({
        collection: 'members',
        where: {
          and: [
            { isActive: { equals: true } },
            {
              or: [
                { directoryApprovalStatus: { equals: 'approved' } },
                { directoryApprovalStatus: { exists: false } },
              ],
            },
            {
              or: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { username: { contains: query } },
                { email: { contains: query } },
                { bio: { contains: query } },
              ],
            },
          ],
        },
        limit: 20,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'courses',
        where: {
          or: [{ title: { contains: query } }, { slug: { contains: query } }],
        },
        limit: 20,
        depth: 0,
        overrideAccess: true,
        ...locOpts,
      }),
      payload.find({
        collection: 'posts',
        where: {
          and: [
            { status: { equals: 'published' } },
            {
              or: [
                { title: { contains: query } },
                { slug: { contains: query } },
                { excerpt: { contains: query } },
              ],
            },
          ],
        },
        limit: 20,
        depth: 0,
        overrideAccess: true,
        ...locOpts,
      }),
    ])

    // Extract results from Promise.allSettled responses
    if (memberResults_raw.status === 'fulfilled') {
      memberResults = memberResults_raw.value.docs as typeof memberResults
    }
    if (courseResults_raw.status === 'fulfilled') {
      courseResults = courseResults_raw.value.docs as typeof courseResults
    }
    if (postResults_raw.status === 'fulfilled') {
      postResults = postResults_raw.value.docs as typeof postResults
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-semibold">{searchSettings.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{searchSettings.subtitle}</p>

      <form action="/search" className="mt-4 max-w-xl">
        <Field>
          <FieldLabel htmlFor="input-button-group">{searchSettings.fieldLabel}</FieldLabel>
          <ButtonGroup>
            <Input
              id="input-button-group"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={searchSettings.placeholder}
            />
            <Button variant="outline" type="submit">
              {searchSettings.submit}
            </Button>
          </ButtonGroup>
        </Field>
      </form>

      {!query ? (
        <p className="mt-6 text-sm text-muted-foreground">{searchSettings.hintEmpty}</p>
      ) : null}

      {query ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-medium">
              {searchSettings.membersHeading.replace('{n}', String(memberResults.length))}
            </h2>
            {memberResults.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {searchSettings.noMembers}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {memberResults.map((member) => (
                  <Link
                    key={member.id}
                    href={member.username ? `/profile/${member.username}` : '/members'}
                    className="rounded-lg border p-4 transition hover:bg-muted/40"
                  >
                    <p className="font-medium">
                      {[member.firstName, member.lastName].filter(Boolean).join(' ') ||
                        searchSettings.unnamedMember}
                    </p>
                    {member.username ? (
                      <p className="text-xs text-muted-foreground">@{member.username}</p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {member.bio}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">
              {searchSettings.coursesHeading.replace('{n}', String(courseResults.length))}
            </h2>
            {courseResults.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {searchSettings.noCourses}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courseResults.map((course) => {
                  const courseTitle =
                    pickLocalizedString(course.title, locale) ||
                    searchSettings.untitledCourse
                  return (
                    <Link
                      key={course.id}
                      href={course.slug ? `/courses/${course.slug}` : '/courses'}
                      className="rounded-lg border p-4 transition hover:bg-muted/40"
                    >
                      <p className="font-medium">{courseTitle}</p>
                      {course.slug ? (
                        <p className="text-xs text-muted-foreground">{course.slug}</p>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">
              {searchSettings.postsHeading.replace('{n}', String(postResults.length))}
            </h2>
            {postResults.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{searchSettings.noPosts}</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {postResults.map((post) => {
                  const postTitle =
                    pickLocalizedString(post.title, locale) || postsSettings.untitled
                  const excerpt = pickLocalizedString(post.excerpt, locale)
                  return (
                    <Link
                      key={post.id}
                      href={post.slug ? `/posts/${post.slug}` : '/posts'}
                      className="rounded-lg border p-4 transition hover:bg-muted/40"
                    >
                      <p className="font-medium">{postTitle}</p>
                      {post.slug ? (
                        <p className="text-xs text-muted-foreground">{post.slug}</p>
                      ) : null}
                      {excerpt ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}
