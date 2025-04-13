import React, { useState } from 'react'
import { FieldType, FormField, ValidationRule, ConditionalLogic } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, Settings } from 'lucide-react'
import { ValidationRuleEditor } from './ValidationRuleEditor'
import { ConditionalLogicEditor } from './ConditionalLogicEditor'
import { FieldOptionsEditor } from './FieldOptionsEditor'

interface FormFieldEditorProps {
  field: FormField
  onChange: (updatedField: FormField) => void
  onDelete: () => void
  availableFields: FormField[] // For conditional logic dependencies
}

export function FormFieldEditor({ field, onChange, onDelete, availableFields }: FormFieldEditorProps) {
  const [showValidation, setShowValidation] = useState(false)
  const [showConditionalLogic, setShowConditionalLogic] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    onChange({ ...field, [key]: value })
  }

  const handleValidationChange = (validationRules: ValidationRule[]) => {
    onChange({ ...field, validationRules })
  }

  const handleConditionalLogicChange = (conditionalLogic: ConditionalLogic | undefined) => {
    onChange({ ...field, conditionalLogic })
  }

  // Check if this field type requires options
  const requiresOptions = [
    FieldType.SELECT,
    FieldType.MULTISELECT,
    FieldType.CHECKBOX,
    FieldType.RADIO
  ].includes(field.type)

  return (
    <Card className="mb-3 border-gray-300">
      <CardContent className="pt-4 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          {/* Field ID */}
          <div className="space-y-1">
            <Label htmlFor={`field-id-${field.id}`}>Field ID</Label>
            <Input
              id={`field-id-${field.id}`}
              value={field.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="e.g., client_name"
            />
            <p className="text-xs text-muted-foreground">Unique identifier for this field (no spaces, use underscores)</p>
          </div>

          {/* Field Type */}
          <div className="space-y-1">
            <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => handleChange('type', value as FieldType)}
            >
              <SelectTrigger id={`field-type-${field.id}`}>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FieldType.TEXT}>Text</SelectItem>
                <SelectItem value={FieldType.TEXTAREA}>Textarea</SelectItem>
                <SelectItem value={FieldType.EMAIL}>Email</SelectItem>
                <SelectItem value={FieldType.PHONE}>Phone</SelectItem>
                <SelectItem value={FieldType.DATE}>Date</SelectItem>
                <SelectItem value={FieldType.NUMBER}>Number</SelectItem>
                <SelectItem value={FieldType.SELECT}>Select</SelectItem>
                <SelectItem value={FieldType.MULTISELECT}>Multi-select</SelectItem>
                <SelectItem value={FieldType.CHECKBOX}>Checkbox</SelectItem>
                <SelectItem value={FieldType.RADIO}>Radio</SelectItem>
                <SelectItem value={FieldType.FILE}>File Upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Label */}
          <div className="space-y-1">
            <Label htmlFor={`field-label-${field.id}`}>Field Label</Label>
            <Input
              id={`field-label-${field.id}`}
              value={field.label}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., Client Name"
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-1">
            <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
            <Input
              id={`field-placeholder-${field.id}`}
              value={field.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              placeholder="e.g., Enter client's full name"
            />
          </div>

          {/* Help Text */}
          <div className="space-y-1 col-span-1 md:col-span-2">
            <Label htmlFor={`field-help-${field.id}`}>Help Text</Label>
            <Textarea
              id={`field-help-${field.id}`}
              value={field.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              placeholder="Additional instructions for this field"
              rows={2}
            />
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => handleChange('required', !!checked)}
            />
            <Label
              htmlFor={`required-${field.id}`}
              className="cursor-pointer font-normal"
            >
              Required Field
            </Label>
          </div>
        </div>

        {/* Advanced options */}
        <div className="flex flex-wrap gap-2 mt-4">
          {requiresOptions && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? 'Hide Options' : 'Edit Options'}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowValidation(!showValidation)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {showValidation ? 'Hide Validation' : 'Validation Rules'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowConditionalLogic(!showConditionalLogic)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {showConditionalLogic ? 'Hide Logic' : 'Conditional Logic'}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Field
          </Button>
        </div>

        {/* Options Editor */}
        {showOptions && requiresOptions && (
          <div className="mt-4 pt-4 border-t">
            <FieldOptionsEditor
              field={field}
              onChange={(options) => handleChange('options', options)}
            />
          </div>
        )}

        {/* Validation Rules */}
        {showValidation && (
          <div className="mt-4 pt-4 border-t">
            <ValidationRuleEditor
              fieldType={field.type}
              validationRules={field.validationRules || []}
              onChange={handleValidationChange}
            />
          </div>
        )}

        {/* Conditional Logic */}
        {showConditionalLogic && (
          <div className="mt-4 pt-4 border-t">
            <ConditionalLogicEditor
              conditionalLogic={field.conditionalLogic}
              availableFields={availableFields}
              onChange={handleConditionalLogicChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
