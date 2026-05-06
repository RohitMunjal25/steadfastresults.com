import Link from 'next/link'
import { ArrowRight, Building2, FileText, Image as ImageIcon, LayoutGrid, Tag, User } from 'lucide-react'
import { NavbarShell } from '@/components/shared/navbar-shell'
import { Footer } from '@/components/shared/footer'
import { TaskListClient } from '@/components/tasks/task-list-client'
import { SchemaJsonLd } from '@/components/seo/schema-jsonld'
import { fetchTaskPosts } from '@/lib/task-data'
import { SITE_CONFIG, getTaskConfig, type TaskKey } from '@/lib/site-config'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/categories'
import { taskIntroCopy } from '@/config/site.content'
import { getFactoryState } from '@/design/factory/get-factory-state'
import { TASK_LIST_PAGE_OVERRIDE_ENABLED, TaskListPageOverride } from '@/overrides/task-list-page'

const taskIcons: Record<TaskKey, any> = {
  listing: Building2,
  article: FileText,
  image: ImageIcon,
  profile: User,
  classified: Tag,
  sbm: LayoutGrid,
  social: LayoutGrid,
  pdf: FileText,
  org: Building2,
  comment: FileText,
}

const variantShells = {
  'listing-directory': 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]',
  'listing-showcase': 'bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)]',
  'article-editorial': 'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_20%),linear-gradient(180deg,#fff8ef_0%,#ffffff_100%)]',
  'article-journal': 'bg-[linear-gradient(180deg,#fffdf9_0%,#f7f1ea_100%)]',
  'image-masonry': 'bg-[linear-gradient(180deg,#09101d_0%,#111c2f_100%)] text-white',
  'image-portfolio': 'bg-[linear-gradient(180deg,#07111f_0%,#13203a_100%)] text-white',
  'profile-creator': 'bg-[linear-gradient(180deg,#0a1120_0%,#101c34_100%)] text-white',
  'profile-business': 'bg-[linear-gradient(180deg,#f6fbff_0%,#ffffff_100%)]',
  'classified-bulletin': 'bg-[linear-gradient(180deg,#edf3e4_0%,#ffffff_100%)]',
  'classified-market': 'bg-[linear-gradient(180deg,#f4f6ef_0%,#ffffff_100%)]',
  'sbm-curation': 'bg-[linear-gradient(180deg,#fff7ee_0%,#ffffff_100%)]',
  'sbm-library': 'bg-[linear-gradient(180deg,#f7f8fc_0%,#ffffff_100%)]',
} as const

export async function TaskListPage({ task, category }: { task: TaskKey; category?: string }) {
  if (TASK_LIST_PAGE_OVERRIDE_ENABLED) {
    return await TaskListPageOverride({ task, category })
  }

  const taskConfig = getTaskConfig(task)
  const posts = await fetchTaskPosts(task, 30)
  const normalizedCategory = category ? normalizeCategory(category) : 'all'
  const intro = taskIntroCopy[task]
  const baseUrl = SITE_CONFIG.baseUrl.replace(/\/$/, '')
  const schemaItems = posts.slice(0, 10).map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${baseUrl}${taskConfig?.route || '/posts'}/${post.slug}`,
    name: post.title,
  }))
  const { recipe } = getFactoryState()
  const layoutKey = recipe.taskLayouts[task as keyof typeof recipe.taskLayouts] || `${task}-${task === 'listing' ? 'directory' : 'editorial'}`
  const shellClass = variantShells[layoutKey as keyof typeof variantShells] || 'bg-background'
  const Icon = taskIcons[task] || LayoutGrid

  const isDark = ['image-masonry', 'image-portfolio', 'profile-creator'].includes(layoutKey)
  const ui = isDark
    ? {
        muted: 'text-slate-300',
        panel: 'border border-white/10 bg-white/6',
        soft: 'border border-white/10 bg-white/5',
        input: 'border-white/10 bg-white/6 text-white',
        button: 'bg-white text-slate-950 hover:bg-slate-200',
      }
    : layoutKey.startsWith('article') || layoutKey.startsWith('sbm')
      ? {
          muted: 'text-[#72594a]',
          panel: 'border border-[#dbc6b6] bg-white/90',
          soft: 'border border-[#dbc6b6] bg-[#fff8ef]',
          input: 'border border-[#dbc6b6] bg-white text-[#2f1d16]',
          button: 'bg-[#2f1d16] text-[#fff4e4] hover:bg-[#452920]',
        }
      : {
          muted: 'text-slate-600',
          panel: 'border border-slate-200 bg-white',
          soft: 'border border-slate-200 bg-slate-50',
          input: 'border border-slate-200 bg-white text-slate-950',
          button: 'bg-slate-950 text-white hover:bg-slate-800',
        }

  return (
    <div className={`min-h-screen ${shellClass}`}>
      <NavbarShell />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {task === 'listing' ? (
          <SchemaJsonLd
            data={[
              {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Business Directory Listings',
                itemListElement: schemaItems,
              },
              {
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: SITE_CONFIG.name,
                url: `${baseUrl}/listings`,
                areaServed: 'Worldwide',
              },
            ]}
          />
        ) : null}
        {task === 'article' || task === 'classified' ? (
          <SchemaJsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `${taskConfig?.label || task} | ${SITE_CONFIG.name}`,
              url: `${baseUrl}${taskConfig?.route || ''}`,
              hasPart: schemaItems,
            }}
          />
        ) : null}

        {layoutKey === 'listing-directory' || layoutKey === 'listing-showcase' ? (
          <section className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className={`rounded-[2rem] p-7 shadow-[0_24px_70px_rgba(15,23,42,0.07)] ${ui.panel}`}>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] opacity-70"><Icon className="h-4 w-4" /> {taskConfig?.label || task}</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground">{taskConfig?.description || 'Latest posts'}</h1>
              <p className={`mt-4 max-w-2xl text-sm leading-7 ${ui.muted}`}>Built with a cleaner scan rhythm, stronger metadata grouping, and a structure designed for business discovery rather than editorial reading.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={taskConfig?.route || '#'} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${ui.button}`}>Explore results <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/search" className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${ui.soft}`}>Open search</Link>
              </div>
            </div>
            <form className={`grid gap-3 rounded-[2rem] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${ui.soft}`} action={taskConfig?.route || '#'}>
              <div>
                <label className={`text-xs uppercase tracking-[0.2em] ${ui.muted}`}>Category</label>
                <select name="category" defaultValue={normalizedCategory} className={`mt-2 h-11 w-full rounded-xl px-3 text-sm ${ui.input}`}>
                  <option value="all">All categories</option>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.slug} value={item.slug}>{item.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className={`h-11 rounded-xl text-sm font-medium ${ui.button}`}>Apply filters</button>
            </form>
          </section>
        ) : null}

        {layoutKey === 'article-editorial' || layoutKey === 'article-journal' ? (
          <section className="mb-12 relative overflow-hidden">
            {/* Unique decorative background with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 rounded-[3rem] opacity-60 transform rotate-1"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-100 via-indigo-50 to-teal-100 rounded-[3rem] opacity-40 transform -rotate-1"></div>
            
            {/* Floating decorative shapes */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-30 animate-bounce blur-xl"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-30 animate-pulse delay-300 blur-xl"></div>
            <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-purple-300 rounded-full opacity-30 animate-bounce delay-75 blur-xl"></div>
            <div className="absolute bottom-20 right-1/3 w-12 h-12 bg-blue-300 rounded-full opacity-30 animate-pulse delay-500 blur-xl"></div>
            
            {/* Decorative border pattern */}
            <div className="absolute inset-4 border-4 border-dashed border-purple-200 rounded-[2.5rem] opacity-50"></div>
            <div className="absolute inset-6 border-2 border-dotted border-pink-200 rounded-[2.5rem] opacity-50"></div>
            
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div className={`p-8 rounded-[2.5rem] ${ui.panel} backdrop-blur-sm border-2 border-dashed border-purple-300 shadow-2xl transform hover:scale-105 transition-all duration-500 relative overflow-hidden`}>
                {/* Inner decorative pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/50 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/50 to-transparent rounded-tr-full"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                    <div className="w-4 h-4 bg-pink-400 rounded-full animate-pulse delay-75 shadow-lg shadow-pink-400/50"></div>
                    <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-150 shadow-lg shadow-purple-400/50"></div>
                    <p className={`text-xs uppercase tracking-[0.3em] ${ui.muted} ml-4`}>{taskConfig?.label || task}</p>
                  </div>
                  <h1 className="max-w-4xl text-6xl lg:text-7xl font-bold leading-tight mb-6 transform hover:scale-105 transition-transform duration-300" style={{ color: '#fff7ef', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                    {taskConfig?.description || 'Creative Articles'}
                  </h1>
                  <p className={`text-lg leading-relaxed ${ui.muted} mb-8 font-medium`}>
                    ✨ Welcome to your creative writing space! This unique article hub features handcrafted designs, playful animations, and a vibrant color palette that makes reading and writing feel like an artistic adventure.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className={`px-6 py-3 rounded-full ${ui.button} text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
                      <span className="relative z-10">🎨 Start Creating</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                    </div>
                    <div className={`px-6 py-3 rounded-full ${ui.soft} font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
                      <span className="relative z-10">📚 Browse Stories</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 delay-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-[2rem] ${ui.panel} backdrop-blur-sm border-2 border-dotted border-pink-300 shadow-xl transform hover:scale-105 transition-all duration-500 hover:rotate-1 relative overflow-hidden`}>
                {/* Inner decorative elements */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-bl from-pink-200/60 to-transparent rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-tr from-purple-200/60 to-transparent rounded-full animate-pulse delay-200"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl animate-bounce">🎭</span>
                    <p className={`text-xs font-bold uppercase tracking-[0.24em] ${ui.muted}`}>Creative Hub</p>
                  </div>
                  <p className={`text-sm leading-7 ${ui.muted} mb-6 font-medium`}>
                    🌟 Filter articles by category to explore different creative worlds. Each category has its own unique flavor and style!
                  </p>
                  <form className="space-y-4" action={taskConfig?.route || '#'}>
                    <select name="category" defaultValue={normalizedCategory} className={`h-12 w-full rounded-2xl px-4 text-sm font-bold ${ui.input} border-2 border-dashed border-purple-300 focus:border-pink-400 transition-colors focus:ring-4 focus:ring-pink-200`}>
                      <option value="all">🎨 All Creative Categories</option>
                      {CATEGORY_OPTIONS.map((item) => (
                        <option key={item.slug} value={item.slug}>✨ {item.name}</option>
                      ))}
                  </select>
                  <button type="submit" className={`h-12 w-full rounded-2xl font-bold ${ui.button} text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
                    🪄 Apply Magic Filter
                  </button>
                </form>
                
                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl animate-pulse shadow-lg shadow-yellow-200/50"></div>
                  <div className="aspect-square bg-gradient-to-br from-pink-200 to-pink-400 rounded-xl animate-pulse delay-75 shadow-lg shadow-pink-200/50"></div>
                  <div className="aspect-square bg-gradient-to-br from-purple-200 to-purple-400 rounded-xl animate-pulse delay-150 shadow-lg shadow-purple-200/50"></div>
                </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Unique decorative elements for article cards */}
        {layoutKey === 'article-editorial' || layoutKey === 'article-journal' ? (
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-50"></div>
        ) : null}

        {layoutKey === 'image-masonry' || layoutKey === 'image-portfolio' ? (
          <section className="mb-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${ui.soft}`}>
                <Icon className="h-3.5 w-3.5" /> Visual feed
              </div>
              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em]">{taskConfig?.description || 'Latest posts'}</h1>
              <p className={`mt-5 max-w-2xl text-sm leading-8 ${ui.muted}`}>This surface leans into stronger imagery, larger modules, and more expressive spacing so visual content feels materially different from reading and directory pages.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`min-h-[220px] rounded-[2rem] ${ui.panel}`} />
              <div className={`min-h-[220px] rounded-[2rem] ${ui.soft}`} />
              <div className={`col-span-2 min-h-[120px] rounded-[2rem] ${ui.panel}`} />
            </div>
          </section>
        ) : null}

        {layoutKey === 'profile-creator' || layoutKey === 'profile-business' ? (
          <section className={`mb-12 rounded-[2.2rem] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] ${ui.panel}`}>
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className={`min-h-[240px] rounded-[2rem] ${ui.soft}`} />
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] ${ui.muted}`}>{taskConfig?.label || task}</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">Profiles with stronger identity, trust, and reputation cues.</h1>
                <p className={`mt-5 max-w-2xl text-sm leading-8 ${ui.muted}`}>This layout prioritizes the person or business surface first, then lets the feed continue below without borrowing the same visual logic used by articles or listings.</p>
              </div>
            </div>
          </section>
        ) : null}

        {layoutKey === 'classified-bulletin' || layoutKey === 'classified-market' ? (
          <section className="mb-12 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className={`rounded-[1.8rem] p-6 ${ui.panel}`}>
              <p className={`text-xs uppercase tracking-[0.3em] ${ui.muted}`}>{taskConfig?.label || task}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">Fast-moving notices, offers, and responses in a compact board format.</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {['Quick to scan', 'Shorter response path', 'Clearer urgency cues'].map((item) => (
                <div key={item} className={`rounded-[1.5rem] p-5 ${ui.soft}`}>
                  <p className="text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {layoutKey === 'sbm-curation' || layoutKey === 'sbm-library' ? (
          <section className="mb-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className={`text-xs uppercase tracking-[0.3em] ${ui.muted}`}>{taskConfig?.label || task}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">Curated resources arranged more like collections than a generic post feed.</h1>
              <p className={`mt-5 max-w-2xl text-sm leading-8 ${ui.muted}`}>Bookmarks, saved resources, and reference-style items need calmer grouping and lighter metadata. This variant gives them that separation.</p>
            </div>
            <div className={`rounded-[2rem] p-6 ${ui.panel}`}>
              <p className={`text-xs uppercase tracking-[0.24em] ${ui.muted}`}>Collection filter</p>
              <form className="mt-4 flex items-center gap-3" action={taskConfig?.route || '#'}>
                <select name="category" defaultValue={normalizedCategory} className={`h-11 flex-1 rounded-xl px-3 text-sm ${ui.input}`}>
                  <option value="all">All categories</option>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.slug} value={item.slug}>{item.name}</option>
                  ))}
                </select>
                <button type="submit" className={`h-11 rounded-xl px-4 text-sm font-medium ${ui.button}`}>Apply</button>
              </form>
            </div>
          </section>
        ) : null}

        {intro ? (
          <section className={`mb-12 rounded-[2rem] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8 ${ui.panel}`}>
            <h2 className="text-2xl font-semibold text-foreground">{intro.title}</h2>
            {intro.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className={`mt-4 text-sm leading-7 ${ui.muted}`}>{paragraph}</p>
            ))}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {intro.links.map((link) => (
                <a key={link.href} href={link.href} className="font-semibold text-foreground hover:underline">{link.label}</a>
              ))}
            </div>
          </section>
        ) : null}

        <TaskListClient task={task} initialPosts={posts} category={normalizedCategory} />
      </main>
      <Footer />
    </div>
  )
}
