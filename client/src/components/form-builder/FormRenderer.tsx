import React, { useState, useEffect } from 'react'
import { IntakeForm, FormField, FieldType, FormSection } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react'

interface FormRendererProps {
  form: IntakeForm
  onSubmit: (formData: Record<string, any>) => Promise<void>
  isSubmitting?: boolean
  initialValues?: Record<string, any>
}

export function FormRenderer({
  form,
  onSubmit,
  isSubmitting = false,
  initialValues = {}
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  
  // Filter sections based on conditional logic
  const visibleSections = form.sections.filter(section => {
    if (!section.conditionalLogic) return true
    return evaluateConditionalLogic(section.conditionalLogic, formData)
  })
  
  // Calculate progress
  useEffect(() => {
    if (visibleSections.length === 0) return
    
    const filledFields = Object.keys(formData).filter(key => {
      const value = formData[key]
      return value !== undefined && value !== null && value !== ''
    }).length
    
    const totalFields = getAllRequiredFields().length
    setProgress(totalFields > 0 ? Math.min(100, Math.round((filledFields / totalFields) * 100)) : 0)
  }, [formData, visibleSections])
  
  const getAllRequiredFields = () => {
    return visibleSections.flatMap(section => 
      section.fields
        .filter(field => {
          // Check if field is visible based on conditional logic
          if (!field.conditionalLogic) return true
          return evaluateConditionalLogic(field.conditionalLogic, formData)
        })
        .filter(field => field.required)
    )
  }
  
  // Evaluate conditional logic for a field or section
  const evaluateConditionalLogic = (logic: { field: string; operator: string; value: any }, data: Record<string, any>) => {
    const fieldValue = data[logic.field]
    
    switch (logic.operator) {
      case 'equals':
        return fieldValue === logic.value
      case 'notEquals':
        return fieldValue !== logic.value
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(logic.value)
      case 'notContains':
        return typeof fieldValue === 'string' && !fieldValue.includes(logic.value)
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.startsWith(logic.value)
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.endsWith(logic.value)
      case 'greaterThan':
        return Number(fieldValue) > Number(logic.value)
      case 'lessThan':
        return Number(fieldValue) < Number(logic.value)
      case 'greaterThanEqual':
        return Number(fieldValue) >= Number(logic.value)
      case 'lessThanEqual':
        return Number(fieldValue) <= Number(logic.value)
      case 'before':
        return new Date(fieldValue) < new Date(logic.value)
      case 'after':
        return new Date(fieldValue) > new Date(logic.value)
      case 'checked':
        return !!fieldValue
      case 'unchecked':
        return !fieldValue
      default:
        return true
    }
  }
  
  // Handle field change
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }
  
  // Validate form data for the current section
  const validateCurrentSection = (): boolean => {
    if (currentSectionIndex >= visibleSections.length) return true
    
    const currentSection = visibleSections[currentSectionIndex]
    const newErrors: Record<string, string> = {}
    
    currentSection.fields.forEach(field => {
      // Skip validation for non-visible fields
      if (field.conditionalLogic && !evaluateConditionalLogic(field.conditionalLogic, formData)) {
        return
      }
      
      // Skip validation for non-required fields with no value
      if (!field.required && (!formData[field.id] || formData[field.id] === '')) {
        return
      }
      
      // Validate required fields
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`
        return
      }
      
      // Validate field-specific rules
      if (field.validationRules && field.validationRules.length > 0) {
        for (const rule of field.validationRules) {
          if (!validateFieldRule(field, rule, formData[field.id])) {
            newErrors[field.id] = rule.message
            break
          }
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Validate a single field rule
  const validateFieldRule = (field: FormField, rule: { type: string; value?: any; message: string }, value: any): boolean => {
    if (!value && !rule.type.includes('required')) return true
    
    switch (rule.type) {
      case 'required':
        return value !== undefined && value !== null && value !== ''
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone':
        return /^[\d\+\-\(\)\s]+$/.test(value)
      case 'minLength':
        return value.length >= rule.value
      case 'maxLength':
        return value.length <= rule.value
      case 'pattern':
        return new RegExp(rule.value).test(value)
      case 'min':
        return Number(value) >= Number(rule.value)
      case 'max':
        return Number(value) <= Number(rule.value)
      case 'minSelected':
        return Array.isArray(value) && value.length >= rule.value
      case 'maxSelected':
        return Array.isArray(value) && value.length <= rule.value
      case 'minDate':
        return new Date(value) >= new Date(rule.value)
      case 'maxDate':
        return new Date(value) <= new Date(rule.value)
      case 'fileType':
        if (!value || !value.name) return false
        const extensions = rule.value.split(',')
        const fileExt = value.name.split('.').pop()?.toLowerCase()
        return extensions.includes(fileExt)
      case 'maxSize':
        return value.size <= rule.value * 1024 // Convert KB to bytes
      default:
        return true
    }
  }
  
  // Navigate to next section
  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSectionIndex(prev => Math.min(prev + 1, visibleSections.length))
    }
  }
  
  // Navigate to previous section
  const handlePrevious = () => {
    setCurrentSectionIndex(prev => Math.max(prev - 1, 0))
  }
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentSection()) return
    
    // Final validation of all sections
    const allSectionErrors: Record<string, string> = {}
    
    visibleSections.forEach(section => {
      section.fields.forEach(field => {
        // Skip validation for non-visible fields
        if (field.conditionalLogic && !evaluateConditionalLogic(field.conditionalLogic, formData)) {
          return
        }
        
        // Validate required fields
        if (field.required && (!formData[field.id] || formData[field.id] === '')) {
          allSectionErrors[field.id] = `${field.label} is required`
        }
      })
    })
    
    if (Object.keys(allSectionErrors).length > 0) {
      setErrors(allSectionErrors)
      return
    }
    
    // Submit the form data
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }
  
  // Render a field based on its type
  const renderField = (field: FormField) => {
    // Check if field should be displayed based on conditional logic
    if (field.conditionalLogic && !evaluateConditionalLogic(field.conditionalLogic, formData)) {
      return null
    }
    
    const commonProps = {
      id: field.id,
      placeholder: field.placeholder,
      className: errors[field.id] ? 'border-red-500' : ''
    }
    
    switch (field.type) {
      case FieldType.TEXT:
        return (
          <Input
            {...commonProps}
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case FieldType.TEXTAREA:
        return (
          <Textarea
            {...commonProps}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
          />
        )
      
      case FieldType.EMAIL:
        return (
          <Input
            {...commonProps}
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case FieldType.PHONE:
        return (
          <Input
            {...commonProps}
            type="tel"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case FieldType.DATE:
        return (
          <Input
            {...commonProps}
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      
      case FieldType.NUMBER:
        return (
          <Input
            {...commonProps}
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || '')}
          />
        )
      
      case FieldType.SELECT:
        return (
          <Select
            value={formData[field.id] || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger className={errors[field.id] ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case FieldType.MULTISELECT:
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={(formData[field.id] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = formData[field.id] || []
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value)
                    handleFieldChange(field.id, newValues)
                  }}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )
      
      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!formData[field.id]}
              onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
            />
            <Label
              htmlFor={field.id}
              className="cursor-pointer font-normal"
            >
              {field.label}
            </Label>
          </div>
        )
      
      case FieldType.RADIO:
        return (
          <RadioGroup
            value={formData[field.id] || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      
      case FieldType.FILE:
        return (
          <Input
            {...commonProps}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              handleFieldChange(field.id, file)
            }}
          />
        )
      
      default:
        return <p>Unsupported field type</p>
    }
  }
  
  // Render field container
  const renderFieldContainer = (field: FormField) => {
    // Skip fields with conditional logic that evaluates to false
    if (field.conditionalLogic && !evaluateConditionalLogic(field.conditionalLogic, formData)) {
      return null
    }
    
    // Special case for checkbox type - label is rendered with the checkbox
    if (field.type === FieldType.CHECKBOX) {
      return (
        <div key={field.id} className="mb-4">
          {renderField(field)}
          {field.helpText && (
            <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
          )}
          {errors[field.id] && (
            <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
          )}
        </div>
      )
    }
    
    return (
      <div key={field.id} className="mb-4">
        <div className="flex justify-between mb-1">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        {renderField(field)}
        {field.helpText && (
          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
        )}
        {errors[field.id] && (
          <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
        )}
      </div>
    )
  }
  
  // Render the current section
  const renderCurrentSection = () => {
    if (visibleSections.length === 0) {
      return (
        <Alert className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No form sections are available. Please contact support.
          </AlertDescription>
        </Alert>
      )
    }
    
    if (currentSectionIndex >= visibleSections.length) {
      // Review page
      return (
        <div className="space-y-6">
          <div className="border rounded-md p-4 bg-muted/20">
            <div className="flex items-center mb-4">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium">Review Your Information</h3>
            </div>
            
            {visibleSections.map(section => (
              <div key={section.id} className="mb-6">
                <h4 className="font-medium border-b pb-2 mb-3">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields
                    .filter(field => {
                      // Skip fields with conditional logic that evaluates to false
                      if (field.conditionalLogic && !evaluateConditionalLogic(field.conditionalLogic, formData)) {
                        return false
                      }
                      return true
                    })
                    .map(field => {
                      let displayValue = formData[field.id]
                      
                      // Format display value based on field type
                      if (field.type === FieldType.SELECT || field.type === FieldType.RADIO) {
                        const option = field.options?.find(opt => opt.value === displayValue)
                        displayValue = option?.label || displayValue
                      } else if (field.type === FieldType.MULTISELECT) {
                        const selectedValues = displayValue || []
                        const selectedLabels = selectedValues.map((val: string) => {
                          const option = field.options?.find(opt => opt.value === val)
                          return option?.label || val
                        })
                        displayValue = selectedLabels.join(', ')
                      } else if (field.type === FieldType.CHECKBOX) {
                        displayValue = displayValue ? 'Yes' : 'No'
                      } else if (field.type === FieldType.FILE) {
                        displayValue = displayValue?.name || 'No file selected'
                      }
                      
                      return (
                        <div key={field.id} className="mb-2">
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-sm">
                            {displayValue || <span className="text-muted-foreground italic">Not provided</span>}
                          </p>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please review your information carefully before submitting.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
    
    const currentSection = visibleSections[currentSectionIndex]
    
    return (
      <div>
        {currentSection.description && (
          <p className="text-muted-foreground mb-4">{currentSection.description}</p>
        )}
        {currentSection.fields.map(field => renderFieldContainer(field))}
      </div>
    )
  }
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && <CardDescription>{form.description}</CardDescription>}
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        {visibleSections.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <span>Section {currentSectionIndex + 1} of {visibleSections.length + 1}</span>
            <span className="font-medium">
              {currentSectionIndex < visibleSections.length 
                ? visibleSections[currentSectionIndex].title 
                : 'Review'}
            </span>
          </div>
        )}
        
        {renderCurrentSection()}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        {currentSectionIndex < visibleSections.length ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              <span>Submit</span>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
