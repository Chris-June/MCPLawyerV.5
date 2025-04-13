import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

const navGroups = [
  {
    label: 'Legal Experts',
    items: [
      { path: '/roles', label: 'Legal Experts' },
      { path: '/chat', label: 'Legal Assistants' }
    ]
  },
  {
    label: 'Documents',
    items: [
      { path: '/documents', label: 'Documents' },
      { path: '/document-automation', label: 'Document Automation' },
      { path: '/clause-library', label: 'Clause Library' }
    ]
  },
  {
    label: 'Legal Tools',
    items: [
      { path: '/legal-tools', label: 'Legal Tools' },
      { path: '/contract-analysis', label: 'Contract Analysis' },
      { path: '/predictive-analysis', label: 'Case Prediction' }
    ]
  },
  {
    label: 'Client Management',
    items: [
      { path: '/client-intake', label: 'Client Intake' }
    ]
  }
]

export default function Layout() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/" className="text-2xl font-bold text-primary">
                Noesis Law
              </Link>
            </motion.div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md transition-colors ${location.pathname === '/' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
            >
              Home
            </Link>
            {navGroups.map((group) => (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger className={`px-3 py-2 rounded-md transition-colors hover:bg-muted ${group.items.some(item => location.pathname === item.path) ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                  {group.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {group.items.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link 
                        to={item.path} 
                        className={`w-full ${location.pathname === item.path ? 'bg-primary/10 text-primary font-medium' : ''}`}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4 overflow-y-auto">
        <Outlet />
      </main>
      
      <footer className="border-t py-6 bg-muted/30 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Noesis Practice Management {new Date().getFullYear()} | Powered by IntelliSync Solutions</p>
        </div>
      </footer>
    </div>
  )
}
