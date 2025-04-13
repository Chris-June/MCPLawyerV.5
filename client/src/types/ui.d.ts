// Type declarations for shadcn/ui components

declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes } from 'react'
  import { VariantProps } from 'class-variance-authority'

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
  }

  export function Button(props: ButtonProps): JSX.Element
}

declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react'

  export interface CardProps extends HTMLAttributes<HTMLDivElement> {}
  export function Card(props: CardProps): JSX.Element
  export function CardHeader(props: HTMLAttributes<HTMLDivElement>): JSX.Element
  export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>): JSX.Element
  export function CardDescription(props: HTMLAttributes<HTMLParagraphElement>): JSX.Element
  export function CardContent(props: HTMLAttributes<HTMLDivElement>): JSX.Element
  export function CardFooter(props: HTMLAttributes<HTMLDivElement>): JSX.Element
}

declare module '@/components/ui/input' {
  import { InputHTMLAttributes } from 'react'

  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
  export function Input(props: InputProps): JSX.Element
}

declare module '@/components/ui/label' {
  import { LabelHTMLAttributes } from 'react'

  export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}
  export function Label(props: LabelProps): JSX.Element
}

declare module '@/components/ui/select' {
  import { SelectHTMLAttributes, HTMLAttributes } from 'react'

  export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    onValueChange?: (value: string) => void
  }
  export function Select(props: SelectProps): JSX.Element
  export function SelectTrigger(props: HTMLAttributes<HTMLButtonElement>): JSX.Element
  export function SelectValue(props: HTMLAttributes<HTMLSpanElement> & { placeholder?: string }): JSX.Element
  export function SelectContent(props: HTMLAttributes<HTMLDivElement>): JSX.Element
  export function SelectItem(props: { value: string } & HTMLAttributes<HTMLDivElement>): JSX.Element
}

declare module '@/components/ui/tabs' {
  import { HTMLAttributes } from 'react'

  export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
  }
  export function Tabs(props: TabsProps): JSX.Element
  export function TabsList(props: HTMLAttributes<HTMLDivElement>): JSX.Element
  export function TabsTrigger(props: { value: string, disabled?: boolean } & HTMLAttributes<HTMLButtonElement>): JSX.Element
  export function TabsContent(props: { value: string } & HTMLAttributes<HTMLDivElement>): JSX.Element
}

declare module '@/components/ui/textarea' {
  import { TextareaHTMLAttributes } from 'react'

  export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
  export function Textarea(props: TextareaProps): JSX.Element
}

declare module '@/components/ui/toast' {
  export interface ToastProps {
    title?: string
    description?: string
    variant?: 'default' | 'destructive'
  }

  export function useToast(): {
    toast: (props: ToastProps) => void
  }
  export function Toaster(): JSX.Element
}
