import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, MessageSquare, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'

const features = [
  {
    icon: <Brain className="h-10 w-10 text-primary" />,
    title: 'Legal Expertise',
    description: 'Access specialized Canadian legal expertise across multiple practice areas and jurisdictions.',
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: 'Document Automation',
    description: 'Generate legal documents tailored to Canadian law with customizable templates and fields.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Practice Management',
    description: 'Streamline client intake, deadline tracking, and legal research for your Canadian law practice.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
           Noesis Law
            <span className="text-primary"> Practice Management</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive legal practice management for Canadian law firms
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/legal-tools">
                Legal Tools <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/documents">Document Management</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Key Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform provides a powerful way to interact with specialized AI agents.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-lg border bg-card"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 -mx-4 px-4 py-12 rounded-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground mb-8">
            The Pathways Law Practice Management system streamlines your Canadian legal practice workflow.
          </p>
          
          <div className="flex flex-col gap-6">
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-2">1. Access Legal Expertise</h3>
              <p className="text-muted-foreground">
                Consult with specialized legal experts in areas like family law, real estate, immigration, corporate law, and litigation.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-2">2. Generate Legal Documents</h3>
              <p className="text-muted-foreground">
                Create customized legal documents based on Canadian law with our document templates and automated generation tools.
              </p>
            </div>
            
            <div className="bg-background p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-2">3. Manage Your Practice</h3>
              <p className="text-muted-foreground">
                Track deadlines, manage client intake, analyze legal issues, and streamline your Canadian law practice workflow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
