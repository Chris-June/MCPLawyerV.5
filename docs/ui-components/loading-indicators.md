# Loading Indicators and AI Processing Overlays

This document describes the loading indicator components available in the MCP Lawyer application for providing visual feedback during asynchronous operations, particularly when interacting with AI models.

## AIProcessingOverlay Component

The `AIProcessingOverlay` is a highly customizable overlay component designed to provide visual feedback during AI processing operations. It offers multiple themes, animations, and informational elements to enhance the user experience while waiting for model responses.

### Features

- **Themed Variations**: Multiple visual themes tailored to different types of AI processing tasks
- **Visual Customization**: Configurable icons, progress indicators, and animation effects
- **Informational Elements**: Display of processing status, model name, and estimated time remaining
- **Smooth Animations**: Powered by Framer Motion for a polished user experience

### Usage

```tsx
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay'

// In your component:
const YourComponent = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      // Call your AI service
      await yourAIService.processData()
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="relative">
      <AIProcessingOverlay
        isProcessing={isProcessing}
        theme="legal"  // Options: 'default', 'legal', 'research', 'document', 'analysis'
        title="Processing Your Request"
        message="Our AI is analyzing your data..."
        modelName="GPT-4o-mini"
      />
      
      {/* Your component content */}
    </div>
  )
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isProcessing` | boolean | Whether the overlay is currently visible |
| `title` | string | Main title displayed in the overlay |
| `message` | string | Descriptive message about what's happening |
| `subMessage` | string | Optional secondary message with more details |
| `theme` | AIProcessingTheme | Visual theme: 'default', 'legal', 'research', 'document', 'analysis' |
| `icon` | AIProcessingIconType | Icon to display: 'brain', 'sparkles', 'bot', 'cpu', 'loader' |
| `progress` | number | Progress value (0-100) if known, undefined for indeterminate |
| `pulseEffect` | boolean | Whether to show a pulsing effect on the overlay |
| `blurBackground` | boolean | Whether to blur the background content |
| `className` | string | Custom CSS class for the container |
| `modelName` | string | Optional model name to display |
| `estimatedTimeRemaining` | number | Optional estimated time remaining in seconds |

## Implementation Guidelines

1. **Container Positioning**: Always add `relative` to the parent container where you use the overlay
2. **Processing State**: Connect the `isProcessing` prop to your loading/processing state
3. **Theme Selection**: Choose the appropriate theme based on the type of AI processing
4. **Informative Messages**: Provide clear, specific messages about what the AI is doing
5. **Model Transparency**: When possible, include the model name being used for transparency

## Theme Guidelines

- **Legal**: Use for legal analysis, document review, and case law research
- **Research**: Use for information gathering and knowledge-based operations
- **Document**: Use for document generation, template filling, and document processing
- **Analysis**: Use for data analysis, predictive modeling, and statistical operations
- **Default**: Use when no specific theme is appropriate

## Integration Examples

The AIProcessingOverlay component has been integrated into the following pages:

- Legal Research Page
- Contract Analysis Page
- Document Generation Page
- Predictive Analysis Page
- Chat Interface

Each integration uses a theme and messaging appropriate to the specific AI processing task being performed.
