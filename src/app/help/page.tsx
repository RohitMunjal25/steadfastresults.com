import Link from 'next/link'
import { PageShell } from '@/components/shared/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const topics = [
  { title: 'Getting Started', description: 'Create your writer account and set up your author profile.' },
  { title: 'Writing & Drafts', description: 'Draft articles, edit content, and prepare stories before publishing.' },
  { title: 'Publishing & Categories', description: 'Publish articles and organize them under the right categories.' },
  { title: 'Account & Access', description: 'Manage sign in, sign out, and account-related settings.' },
]

const articleFaqs = [
  {
    id: 'faq-1',
    question: 'How do I publish my first article?',
    answer:
      'Create an account, go to your article dashboard, add your title and content, select a category, then publish.',
  },
  {
    id: 'faq-2',
    question: 'Can I save my article as a draft?',
    answer:
      'Yes. You can save your work in progress and come back later to continue editing before publishing.',
  },
  {
    id: 'faq-3',
    question: 'How do categories help my articles?',
    answer:
      'Categories make it easier for readers to discover related content and browse your articles by topic.',
  },
  {
    id: 'faq-4',
    question: 'How do I update or edit a published article?',
    answer:
      'Open your article from the dashboard, make your changes, and save the updated version.',
  },
  {
    id: 'faq-5',
    question: 'I am not able to sign in. What should I do?',
    answer:
      'First check your email and password. If the issue continues, use the Contact page and our team will assist you.',
  },
]

export default function HelpPage() {
  return (
    <PageShell
      title="Help Center"
      description="Find answers and guides for writing, managing, and publishing articles."
      actions={
        <Button asChild>
          <Link href="/contact">Contact Support</Link>
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.title} className="border-border bg-card transition-transform hover:-translate-y-1">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground">Article FAQ</h3>
            <Accordion type="single" collapsible className="mt-4">
              {articleFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
