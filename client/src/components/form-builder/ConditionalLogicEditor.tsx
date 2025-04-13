import React from 'react'
import { ConditionalLogic, FormField } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ConditionalLogicEditorProps {
  conditionalLogic?: ConditionalLogic
  availableFields: FormField[]
  onChange: (conditionalLogic?: ConditionalLogic) => void
}

export function ConditionalLogicEditor({
  conditionalLogic,
  availableFields,
  onChange
}: ConditionalLogicEditorProps) {
  // Initialize with empty logic if none exists
  const logic = conditionalLogic || { field: '', operator: 'equals', value: '' }

  const handleChange = <K extends keyof ConditionalLogic>(key: K, value: ConditionalLogic[K]) => {
    onChange({ ...logic, [key]: value })
  }

  const clearLogic = () => {
    onChange(undefined)
  }

  const getOperatorOptions = () => {
    const selectedField = availableFields.find(f => f.id === logic.field)
    
    // Default operators for all field types
    const commonOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Not Equals' },
    ]
    
    // Field-type specific operators
    if (selectedField) {
      switch (selectedField.type) {
        case 'text':
        case 'textarea':
        case 'email':
          return [
            ...commonOperators,
            { value: 'contains', label: 'Contains' },
            { value: 'notContains', label: 'Does Not Contain' },
            { value: 'startsWith', label: 'Starts With' },
            { value: 'endsWith', label: 'Ends With' },
          ]
        case 'number':
          return [
            ...commonOperators,
            { value: 'greaterThan', label: 'Greater Than' },
            { value: 'lessThan', label: 'Less Than' },
            { value: 'greaterThanEqual', label: 'Greater Than or Equal' },
            { value: 'lessThanEqual', label: 'Less Than or Equal' },
          ]
        case 'date':
          return [
            ...commonOperators,
            { value: 'before', label: 'Before' },
            { value: 'after', label: 'After' },
          ]
        case 'select':
        case 'radio':
          return commonOperators
        case 'checkbox':
          return [
            { value: 'checked', label: 'Is Checked' },
            { value: 'unchecked', label: 'Is Unchecked' },
          ]
        default:
          return commonOperators
      }
    }
    
    return commonOperators
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Conditional Display Logic</h3>
        {conditionalLogic && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearLogic}
          >
            Remove Logic
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Specify when this field should be displayed based on the value of another field.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Dependent Field Selection */}
        <div className="space-y-1">
          <Label htmlFor="logic-field">Depends On Field</Label>
          <Select
            value={logic.field}
            onValueChange={(value) => handleChange('field', value)}
          >
            <SelectTrigger id="logic-field">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator Selection */}
        <div className="space-y-1">
          <Label htmlFor="logic-operator">Operator</Label>
          <Select
            value={logic.operator}
            onValueChange={(value) => handleChange('operator', value)}
          >
            <SelectTrigger id="logic-operator">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {getOperatorOptions().map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className="space-y-1">
          <Label htmlFor="logic-value">Value</Label>
          <Input
            id="logic-value"
            value={logic.value || ''}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder="Comparison value"
          />
        </div>
      </div>

      {!logic.field && (
        <p className="text-sm text-amber-600">
          You must select a field to create conditional logic.
        </p>
      )}
    </div>
  )
}
