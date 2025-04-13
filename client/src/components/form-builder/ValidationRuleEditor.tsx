import React from 'react'
import { FieldType, ValidationRule } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'

interface ValidationRuleEditorProps {
  fieldType: FieldType
  validationRules: ValidationRule[]
  onChange: (rules: ValidationRule[]) => void
}

export function ValidationRuleEditor({
  fieldType,
  validationRules,
  onChange
}: ValidationRuleEditorProps) {
  const handleAddRule = () => {
    const newRule: ValidationRule = {
      type: 'required',
      message: 'This field is required.'
    }
    onChange([...validationRules, newRule])
  }

  const handleRemoveRule = (index: number) => {
    const newRules = [...validationRules]
    newRules.splice(index, 1)
    onChange(newRules)
  }

  const handleRuleChange = (index: number, field: keyof ValidationRule, value: any) => {
    const newRules = [...validationRules]
    newRules[index] = { ...newRules[index], [field]: value }
    onChange(newRules)
  }

  // Get available validation types based on field type
  const getAvailableValidationTypes = () => {
    const commonTypes = [
      { value: 'required', label: 'Required' },
    ]

    const typeSpecificValidations: Record<FieldType, Array<{ value: string; label: string }>> = {
      [FieldType.TEXT]: [
        { value: 'minLength', label: 'Min Length' },
        { value: 'maxLength', label: 'Max Length' },
        { value: 'pattern', label: 'Regex Pattern' }
      ],
      [FieldType.TEXTAREA]: [
        { value: 'minLength', label: 'Min Length' },
        { value: 'maxLength', label: 'Max Length' }
      ],
      [FieldType.EMAIL]: [
        { value: 'email', label: 'Email Format' }
      ],
      [FieldType.PHONE]: [
        { value: 'phone', label: 'Phone Format' }
      ],
      [FieldType.DATE]: [
        { value: 'minDate', label: 'Min Date' },
        { value: 'maxDate', label: 'Max Date' }
      ],
      [FieldType.NUMBER]: [
        { value: 'min', label: 'Min Value' },
        { value: 'max', label: 'Max Value' }
      ],
      [FieldType.SELECT]: [],
      [FieldType.MULTISELECT]: [
        { value: 'minSelected', label: 'Min Selected' },
        { value: 'maxSelected', label: 'Max Selected' }
      ],
      [FieldType.CHECKBOX]: [],
      [FieldType.RADIO]: [],
      [FieldType.FILE]: [
        { value: 'fileType', label: 'File Type' },
        { value: 'maxSize', label: 'Max Size (KB)' }
      ]
    }

    return [...commonTypes, ...typeSpecificValidations[fieldType]]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Validation Rules</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRule}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>

      {validationRules.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No validation rules defined. Click "Add Rule" to create one.
        </p>
      )}

      {validationRules.map((rule, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b">
          {/* Rule Type */}
          <div className="space-y-1">
            <Label htmlFor={`rule-type-${index}`}>Rule Type</Label>
            <Select
              value={rule.type}
              onValueChange={(value) => handleRuleChange(index, 'type', value)}
            >
              <SelectTrigger id={`rule-type-${index}`}>
                <SelectValue placeholder="Select rule type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableValidationTypes().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rule Value (if applicable) */}
          {rule.type !== 'required' && rule.type !== 'email' && rule.type !== 'phone' && (
            <div className="space-y-1">
              <Label htmlFor={`rule-value-${index}`}>Value</Label>
              <Input
                id={`rule-value-${index}`}
                value={rule.value || ''}
                onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                placeholder="Rule value"
                type={rule.type.includes('Length') || rule.type.includes('Size') || 
                      rule.type === 'min' || rule.type === 'max' ? 'number' : 'text'}
              />
            </div>
          )}

          {/* Error Message */}
          <div className="space-y-1">
            <Label htmlFor={`rule-message-${index}`}>Error Message</Label>
            <div className="flex">
              <Input
                id={`rule-message-${index}`}
                value={rule.message}
                onChange={(e) => handleRuleChange(index, 'message', e.target.value)}
                placeholder="Error message"
                className="rounded-r-none"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-l-none"
                onClick={() => handleRemoveRule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
