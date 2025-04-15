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
    <div className="relative min-h-screen flex flex-col gap-20 justify-center overflow-x-hidden">
  {/* Parallax Animated Background */}
  <motion.div
    className="absolute inset-0 -z-10 pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.div
      className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-br from-primary/40 to-secondary/20 rounded-full blur-3xl opacity-60 animate-float-slow"
      animate={{ y: [0, 40, 0] }}
      transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-secondary/30 to-primary/20 rounded-full blur-2xl opacity-50 animate-float-fast"
      animate={{ y: [0, -30, 0] }}
      transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
    />
  </motion.div>
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <motion.h1
  className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg"
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8 }}
>
  <span className="inline-block animate-text-glow">Noesis Law</span>
  <span className="block text-primary animate-fade-in">Practice Management</span>
</motion.h1>
<motion.p
  className="text-2xl text-muted-foreground mb-8 animate-fade-in"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.9, delay: 0.2 }}
>
  Comprehensive legal practice management for Canadian law firms, powered by next-gen AI.
</motion.p>
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
          <motion.h2
  className="text-3xl md:text-4xl font-bold mb-4 animate-gradient-text"
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.7 }}
>
  Key Features
</motion.h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform provides a powerful way to interact with specialized AI agents.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 px-2">
  {features.map((feature, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(16, 185, 129, 0.18)" }}
      className="relative flex flex-col items-center text-center p-8 rounded-2xl border bg-white/60 dark:bg-card/70 backdrop-blur-lg shadow-lg transition-all cursor-pointer group hover:bg-white/80 hover:shadow-2xl"
      tabIndex={0}
    >
      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity text-primary text-2xl select-none">★</span>
      <div className="mb-4 scale-110 group-hover:scale-125 transition-transform">{feature.icon}</div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
      <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
    </motion.div>
  ))}
</div>
      </section>

      <section className="relative bg-muted/30 -mx-4 px-4 py-20 rounded-3xl overflow-hidden mt-12">
  <div className="absolute inset-0 -z-10 pointer-events-none">
    <motion.div
      className="absolute left-[40%] top-[10%] w-[350px] h-[350px] bg-gradient-to-br from-primary/30 to-secondary/20 rounded-full blur-2xl opacity-40 animate-float-slow"
      animate={{ y: [0, 18, 0] }}
      transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
    />
  </div>
  <div className="max-w-4xl mx-auto text-center">
    <motion.h2
      className="text-3xl md:text-4xl font-bold mb-4 animate-gradient-text"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
    >
      How It Works
    </motion.h2>
    <motion.p
      className="text-lg text-muted-foreground mb-12 animate-fade-in"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      The Noesis Law Practice Management system streamlines your Canadian legal practice workflow.
    </motion.p>
    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
      {[{
        title: "1. Access Legal Expertise",
        desc: "Consult with specialized legal experts in areas like family law, real estate, immigration, corporate law, and litigation."
      }, {
        title: "2. Generate Legal Documents",
        desc: "Create customized legal documents based on Canadian law with our document templates and automated generation tools."
      }, {
        title: "3. Manage Your Practice",
        desc: "Track deadlines, manage client intake, analyze legal issues, and streamline your Canadian law practice workflow."
      }].map((step, idx) => (
        <motion.div
          key={step.title}
          className="flex-1 min-w-[220px] bg-background/80 border rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center hover:scale-105 hover:shadow-2xl transition-transform group cursor-pointer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: idx * 0.15 }}
          whileHover={{ scale: 1.08, backgroundColor: "#f0fdfa", boxShadow: "0 12px 40px 0 rgba(16, 185, 129, 0.18)" }}
          tabIndex={0}
        >
          <span className="block text-4xl mb-2 font-black text-primary/70 group-hover:text-primary select-none">
            {idx + 1}
          </span>
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>

</div>
  )
}