import React from 'react'
import { FormField } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react'

interface FieldOptionsEditorProps {
  field: FormField
  onChange: (options: Array<{ label: string; value: string }>) => void
}

export function FieldOptionsEditor({ field, onChange }: FieldOptionsEditorProps) {
  const options = field.options || []

  const handleAddOption = () => {
    const newOptions = [...options, { label: '', value: '' }]
    onChange(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options]
    newOptions.splice(index, 1)
    onChange(newOptions)
  }

  const handleOptionChange = (index: number, key: 'label' | 'value', newValue: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [key]: newValue }
    onChange(newOptions)
  }

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === options.length - 1)
    ) {
      return // Can't move further in this direction
    }

    const newOptions = [...options]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap the options
    const temp = newOptions[index];
    newOptions[index] = newOptions[targetIndex];
    newOptions[targetIndex] = temp;
    
    onChange(newOptions)
  }

  // Auto-generate value from label if value is empty
  const handleLabelBlur = (index: number, label: string) => {
    if (options[index].value === '') {
      // Convert the label to a suitable value (lowercase, replace spaces with underscores)
      const generatedValue = label.toLowerCase().replace(/\s+/g, '_')
      handleOptionChange(index, 'value', generatedValue)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Field Options</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No options defined. Click "Add Option" to create one.
        </p>
      )}

      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="flex-grow grid grid-cols-2 gap-2">
            <Input
              value={option.label}
              onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
              onBlur={(e) => handleLabelBlur(index, e.target.value)}
              placeholder="Option Label"
            />
            <Input
              value={option.value}
              onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
              placeholder="Option Value"
            />
          </div>
          
          <div className="flex space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleMoveOption(index, 'up')}
              disabled={index === 0}
              className="h-8 w-8"
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleMoveOption(index, 'down')}
              disabled={index === options.length - 1}
              className="h-8 w-8"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveOption(index)}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      {field.type === 'select' && options.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          The first option will be used as the default selection.
        </p>
      )}
    </div>
  )
}
