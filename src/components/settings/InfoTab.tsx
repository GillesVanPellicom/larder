import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from 'cn'
import packageJson from '../../../package.json'

interface LicenseEntry {
  name: string
  description: string
  license: string
  url: string
}

const THIRD_PARTY_LICENSES: LicenseEntry[] = [
  {
    name: 'React & React DOM',
    description: 'The library for web and native user interfaces',
    license: 'MIT',
    url: 'https://github.com/facebook/react/blob/main/LICENSE',
  },
  {
    name: 'Vite',
    description: 'Next generation frontend tooling',
    license: 'MIT',
    url: 'https://github.com/vitejs/vite/blob/main/LICENSE',
  },
  {
    name: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapid UI development',
    license: 'MIT',
    url: 'https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE',
  },
  {
    name: 'Base UI',
    description: 'Unstyled UI components for React',
    license: 'MIT',
    url: 'https://github.com/mui/base-ui/blob/master/LICENSE',
  },
  {
    name: 'Lucide Icons',
    description: 'Beautiful & consistent icon toolkit',
    license: 'ISC',
    url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
  },
  {
    name: 'Quill',
    description: 'Rich text editor built for compatibility and extensibility',
    license: 'BSD-3-Clause',
    url: 'https://github.com/slab/quill/blob/develop/LICENSE',
  },
  {
    name: 'Drizzle ORM',
    description: 'TypeScript ORM for SQL databases',
    license: 'Apache-2.0',
    url: 'https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE',
  },
  {
    name: 'PostgreSQL Client (pg)',
    description: 'Non-blocking PostgreSQL client for Node.js',
    license: 'MIT',
    url: 'https://github.com/brianc/node-postgres/blob/master/LICENSE',
  },
  {
    name: 'AWS SDK for JavaScript (S3)',
    description: 'Amazon S3 Client for Node.js and modern browsers',
    license: 'Apache-2.0',
    url: 'https://github.com/aws/aws-sdk-js-v3/blob/main/LICENSE',
  },
  {
    name: '@dnd-kit',
    description: 'Lightweight, performant, accessible drag & drop toolkit',
    license: 'MIT',
    url: 'https://github.com/clauderic/dnd-kit/blob/master/LICENSE',
  },
  {
    name: 'Zod',
    description: 'TypeScript-first schema declaration and validation library',
    license: 'MIT',
    url: 'https://github.com/colinhacks/zod/blob/master/LICENSE',
  },
  {
    name: 'Geist Font',
    description: 'Modern variable typeface designed for readability',
    license: 'OFL-1.1',
    url: 'https://github.com/vercel/geist-font/blob/main/LICENSE.txt',
  },
  {
    name: 'Electron',
    description: 'Build cross-platform desktop apps with JavaScript, HTML, and CSS',
    license: 'MIT',
    url: 'https://github.com/electron/electron/blob/main/LICENSE',
  },
  {
    name: 'Capacitor',
    description: 'Cross-platform native runtime for web apps',
    license: 'MIT',
    url: 'https://github.com/ionic-team/capacitor/blob/main/LICENSE',
  },
]

export function InfoTab() {
  const [licensesOpen, setLicensesOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const version = packageJson.version || '0.0.0'

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      {/* App Overview Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extralight tracking-[0.2em] uppercase text-foreground">
              LARDER
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              A smarter way to decide what to cook, organize your recipes, and handle the busywork around cooking.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/80">
              v{version}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-1">
          &copy; {currentYear} Gilles Van Pellicom. All rights reserved.
        </div>
      </div>

      {/* Expandable Third-Party Licenses & Acknowledgements */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Collapsible open={licensesOpen} onOpenChange={setLicensesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between p-5 w-full text-left group cursor-pointer select-none hover:bg-muted/30 transition-colors">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Licenses &amp; Acknowledgements
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open source software libraries and components that power Larder.
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 shrink-0',
                licensesOpen && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="border-t border-border/60 p-5 pt-3">
            <div className="divide-y divide-border/40">
              {THIRD_PARTY_LICENSES.map((entry) => (
                <div
                  key={entry.name}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-1 last:pb-1"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {entry.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60 font-semibold">
                        {entry.license}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.description}
                    </p>
                  </div>

                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium shrink-0 self-start sm:self-center"
                    title={`View ${entry.name} license`}
                  >
                    <span>License</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
