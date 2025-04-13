import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { IntakeForm, FormSection, PracticeArea } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FormSectionEditor } from './FormSectionEditor'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Save, FileQuestion, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface FormBuilderProps {
  initialForm?: IntakeForm
  practiceAreas: PracticeArea[]
  onSave: (form: IntakeForm) => Promise<void>
  isLoading?: boolean
}

export function FormBuilder({
  initialForm,
  practiceAreas,
  onSave,
  isLoading = false
}: FormBuilderProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<IntakeForm>(initialForm || {
    id: `form_${uuidv4().substring(0, 8)}`,
    practiceArea: '',
    title: '',
    description: '',
    sections: [],
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm({ ...form, [key]: value })
    
    // Clear error when field is edited
    if (errors[key as string]) {
      const newErrors = { ...errors }
      delete newErrors[key as string]
      setErrors(newErrors)
    }
  }

  const handleAddSection = () => {
    const newSection: FormSection = {
      id: `section_${uuidv4().substring(0, 8)}`,
      title: 'New Section',
      fields: []
    }

    setForm({
      ...form,
      sections: [...form.sections, newSection]
    })
  }

  const handleSectionChange = (index: number, updatedSection: FormSection) => {
    const newSections = [...form.sections]
    newSections[index] = updatedSection
    setForm({ ...form, sections: newSections })
  }

  const handleDeleteSection = (index: number) => {
    const newSections = [...form.sections]
    newSections.splice(index, 1)
    setForm({ ...form, sections: newSections })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.practiceArea) {
      newErrors.practiceArea = 'Practice area is required'
    }

    if (!form.title) {
      newErrors.title = 'Form title is required'
    }

    if (form.sections.length === 0) {
      newErrors.sections = 'At least one section is required'
    } else {
      // Check if sections have fields
      const emptySections = form.sections.filter(section => section.fields.length === 0)
      if (emptySections.length > 0) {
        newErrors.sections = 'All sections must have at least one field'
      }

      // Check for duplicate IDs in sections
      const sectionIds = form.sections.map(section => section.id)
      const duplicateSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index)
      if (duplicateSectionIds.length > 0) {
        newErrors.sections = 'Duplicate section IDs found. Each section must have a unique ID.'
      }

      // Check for duplicate field IDs across all sections
      const allFieldIds = form.sections.flatMap(section => section.fields.map(field => field.id))
      const duplicateFieldIds = allFieldIds.filter((id, index) => allFieldIds.indexOf(id) !== index)
      if (duplicateFieldIds.length > 0) {
        newErrors.sections = 'Duplicate field IDs found. Each field must have a unique ID.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before saving.'
      })
      return
    }

    try {
      // Update timestamp
      const formToSave = {
        ...form,
        updatedAt: new Date().toISOString()
      }

      await onSave(formToSave)
      toast({
        title: 'Success',
        description: 'Form has been saved successfully.'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save the form. Please try again.'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form ID */}
            <div className="space-y-1">
              <Label htmlFor="form-id">Form ID</Label>
              <Input
                id="form-id"
                value={form.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="e.g., family_law_intake"
                disabled={!!initialForm} // Disable editing ID for existing forms
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this form (no spaces, use underscores)
              </p>
            </div>

            {/* Practice Area */}
            <div className="space-y-1">
              <Label htmlFor="practice-area">Practice Area</Label>
              <Select
                value={form.practiceArea}
                onValueChange={(value) => handleChange('practiceArea', value)}
              >
                <SelectTrigger id="practice-area" className={errors.practiceArea ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.practiceArea && (
                <p className="text-xs text-red-500">{errors.practiceArea}</p>
              )}
            </div>

            {/* Form Title */}
            <div className="space-y-1">
              <Label htmlFor="form-title">Form Title</Label>
              <Input
                id="form-title"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Family Law Client Intake"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Form Version */}
            <div className="space-y-1">
              <Label htmlFor="form-version">Version</Label>
              <Input
                id="form-version"
                value={form.version}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="e.g., 1.0"
              />
            </div>
          </div>

          {/* Form Description */}
          <div className="space-y-1">
            <Label htmlFor="form-description">Description (Optional)</Label>
            <Textarea
              id="form-description"
              value={form.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the form's purpose and usage"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Form Sections</h2>
          <Button onClick={handleAddSection} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        </div>

        {errors.sections && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
            <p className="flex items-center">
              <FileQuestion className="h-5 w-5 mr-2" />
              {errors.sections}
            </p>
          </div>
        )}

        {form.sections.length === 0 && (
          <div className="text-center py-12 border rounded-md bg-muted/20">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No sections added yet</p>
            <Button onClick={handleAddSection} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Section
            </Button>
          </div>
        )}

        {form.sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FormSectionEditor
              section={section}
              onChange={(updatedSection) => handleSectionChange(index, updatedSection)}
              onDelete={() => handleDeleteSection(index)}
              otherSections={form.sections.filter((_, i) => i !== index)}
            />
          </motion.div>
        ))}
      </div>

      {/* Save Form Button */}
      <Card>
        <CardFooter className="flex justify-end space-x-2 pt-6">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
