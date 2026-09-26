'use client'

import React from 'react'

type UploadNode = {
  type: 'upload'
  relationTo: string
  value: string | { id: string; url?: string; alt?: string; filename?: string; mimeType?: string; width?: number; height?: number; [key: string]: unknown } | number
  fields?: { alt?: string; [key: string]: unknown }
  version?: number
  id?: string
}

type TextNode = {
  type: 'text'
  text: string
  format?: number
  style?: string
  detail?: number
  mode?: string
  version?: number
}

type ParagraphNode = {
  type: 'paragraph'
  children?: (TextNode | UploadNode)[]
  direction?: string | null
  format?: string
  indent?: number
  version?: number
}

type HeadingNode = {
  type: 'heading'
  tag?: string
  children?: (TextNode | UploadNode)[]
  direction?: string | null
  format?: string
  indent?: number
  version?: number
}

type ListNode = {
  type: 'list'
  listType?: 'bullet' | 'number' | 'check'
  children?: ListItemNode[]
  start?: number
  version?: number
}

type ListItemNode = {
  type: 'listitem'
  children?: (TextNode | UploadNode)[]
  checked?: boolean
  direction?: string | null
  format?: string
  indent?: number
  version?: number
}

type LinkNode = {
  type: 'link'
  url: string
  newTab?: boolean
  relationTo?: string
  linkType?: string
  children?: (TextNode)[]
  version?: number
}

type QuoteNode = {
  type: 'quote'
  children?: (TextNode | UploadNode)[]
  version?: number
}

type CodeNode = {
  type: 'code'
  language?: string
  children?: TextNode[]
  version?: number
}

type RootNode = {
  root: {
    type: 'root'
    children: (ParagraphNode | HeadingNode | ListNode | QuoteNode | CodeNode | LinkNode)[]
    direction?: string | null
    format?: string
    indent?: number
    version?: number
  }
}

export function RichTextRenderer({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const obj = data as RootNode

  if (obj.root && typeof obj.root === 'object') {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {obj.root.children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </div>
    )
  }

  return null
}

function RichTextNode({ node }: { node: unknown }): React.ReactNode {
  if (!node || typeof node !== 'object') return null

  const n = node as Record<string, unknown>
  const type = n.type as string

  if (type === 'paragraph') {
    const children = (n.children as (TextNode | UploadNode)[]) || []
    return (
      <p>
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </p>
    )
  }

  if (type === 'heading') {
    const tag = (n.tag as string) || 'h2'
    const level = parseInt(tag.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6
    const children = (n.children as (TextNode | UploadNode)[]) || []
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <Tag>
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </Tag>
    )
  }

  if (type === 'list') {
    const listType = (n.listType as string) || 'bullet'
    const children = (n.children as ListItemNode[]) || []
    const Tag = listType === 'number' ? 'ol' : 'ul'
    return (
      <Tag>
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </Tag>
    )
  }

  if (type === 'listitem') {
    const children = (n.children as (TextNode | UploadNode)[]) || []
    return (
      <li>
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </li>
    )
  }

  if (type === 'text') {
    const textNode = n as TextNode
    let content: string | React.ReactNode = textNode.text
    const format = textNode.format || 0

    if (format & 1) {
      content = <strong>{content}</strong>
    }

    if (format & 2) {
      content = <em>{content}</em>
    }

    if (format & 4) {
      content = <u>{content}</u>
    }

    if (format & 8) {
      content = <code className="bg-muted px-1 py-0.5 rounded text-sm">{content}</code>
    }

    return <span>{content}</span>
  }

  if (type === 'link') {
    const linkNode = n as LinkNode
    const children = linkNode.children || []
    const isExternal = !linkNode.relationTo
    return (
      <a
        href={linkNode.url}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-primary underline underline-offset-2 hover:no-underline"
      >
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </a>
    )
  }

  if (type === 'quote') {
    const quoteNode = n as QuoteNode
    const children = quoteNode.children || []
    return (
      <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-4">
        {children.map((child, idx) => (
          <RichTextNode key={idx} node={child} />
        ))}
      </blockquote>
    )
  }

  if (type === 'code') {
    const codeNode = n as CodeNode
    const children = codeNode.children || []
    return (
      <pre className="bg-muted p-4 rounded-lg overflow-auto my-4">
        <code className={codeNode.language ? `language-${codeNode.language}` : ''}>
          {children.map((child, idx) => (
            <RichTextNode key={idx} node={child} />
          ))}
        </code>
      </pre>
    )
  }

  if (type === 'upload') {
    const uploadNode = n as UploadNode
    return <UploadRenderer node={uploadNode} />
  }

  return null
}

function UploadRenderer({ node }: { node: UploadNode }) {
  const value = node.value

  if (typeof value === 'object' && value !== null && 'url' in value) {
    const mimeType = value.mimeType as string | undefined
    const url = value.url as string
    const alt = (value.alt as string) || (node.fields?.alt as string) || ''

    if (mimeType?.startsWith('image/')) {
      return (
        <figure className="my-6">
          <img
            src={url}
            alt={alt}
            className="rounded-lg w-full h-auto"
            width={value.width as number | undefined}
            height={value.height as number | undefined}
          />
          {alt && <figcaption className="mt-2 text-sm text-muted-foreground text-center">{alt}</figcaption>}
        </figure>
      )
    }

    if (mimeType?.startsWith('video/')) {
      return (
        <figure className="my-6">
          <video controls className="rounded-lg w-full" playsInline>
            <source src={url} type={mimeType} />
            Your browser does not support the video tag.
          </video>
          {alt && <figcaption className="mt-2 text-sm text-muted-foreground text-center">{alt}</figcaption>}
        </figure>
      )
    }

    if (mimeType === 'application/pdf') {
      return (
        <div className="my-6">
          <embed src={url} type={mimeType} className="w-full h-96 rounded-lg" />
          <p className="text-sm text-muted-foreground text-center mt-2">{alt || value.filename}</p>
        </div>
      )
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {alt || value.filename || 'Download file'}
      </a>
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <span className="inline-block px-3 py-1 bg-muted text-muted-foreground text-sm rounded">
        Media loading...
      </span>
    )
  }

  return null
}
