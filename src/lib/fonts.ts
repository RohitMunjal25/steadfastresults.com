import { DynaPuff, Manrope, Fraunces } from 'next/font/google'

export const dynaPuff = DynaPuff({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dyna-puff',
  display: 'swap',
})

export const manrope = Manrope({
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const fraunces = Fraunces({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})
