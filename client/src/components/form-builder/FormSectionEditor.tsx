import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FormSection, FormField, FieldType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormFieldEditor } from './FormFieldEditor'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

interface FormSectionEditorProps {
  section: FormSection
  onChange: (updatedSection: FormSection) => void
  onDelete: () => void
  otherSections: FormSection[] // For conditional logic dependencies
}

export function FormSectionEditor({
  section,
  onChange,
  onDelete,
  otherSections
}: FormSectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleChange = <K extends keyof FormSection>(key: K, value: FormSection[K]) => {
    onChange({ ...section, [key]: value })
  }

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${uuidv4().substring(0, 8)}`,
      type: FieldType.TEXT,
      label: 'New Field',
      placeholder: '',
      required: false
    }

    handleChange('fields', [...section.fields, newField])
  }

  const handleFieldChange = (index: number, updatedField: FormField) => {
    const newFields = [...section.fields]
    newFields[index] = updatedField
    handleChange('fields', newFields)
  }

  const handleDeleteField = (index: number) => {
    const newFields = [...section.fields]
    newFields.splice(index, 1)
    handleChange('fields', newFields)
  }

  // Collect all fields from all sections for conditional logic dependencies
  const allFieldsForConditionalLogic = otherSections.flatMap(s => s.fields).filter(f => f.id !== section.id)

  return (
    <Card className="mb-6 border-gray-300">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {section.title || 'Untitled Section'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete() }}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button variant="ghost" size="icon">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Section ID */}
              <div className="space-y-1">
                <label htmlFor={`section-id-${section.id}`} className="text-sm font-medium">
                  Section ID
                </label>
                <Input
                  id={`section-id-${section.id}`}
                  value={section.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="e.g., personal_information"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this section (no spaces, use underscores)
                </p>
              </div>

              {/* Section Title */}
              <div className="space-y-1">
                <label htmlFor={`section-title-${section.id}`} className="text-sm font-medium">
                  Section Title
                </label>
                <Input
                  id={`section-title-${section.id}`}
                  value={section.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Personal Information"
                />
              </div>

              {/* Section Description */}
              <div className="space-y-1">
                <label htmlFor={`section-desc-${section.id}`} className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea
                  id={`section-desc-${section.id}`}
                  value={section.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Instructions or additional information for this section"
                  rows={2}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">Fields</h3>
                <Button onClick={handleAddField} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {section.fields.length === 0 && (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">No fields added yet</p>
                  <Button onClick={handleAddField} variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
              )}

              {section.fields.map((field, index) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  onChange={(updatedField) => handleFieldChange(index, updatedField)}
                  onDelete={() => handleDeleteField(index)}
                  availableFields={allFieldsForConditionalLogic}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
