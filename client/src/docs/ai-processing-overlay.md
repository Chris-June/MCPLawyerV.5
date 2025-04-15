# AI Processing Overlay Component

## Overview

The `AIProcessingOverlay` component provides visual feedback during AI processing tasks across the application. This component enhances user experience by displaying a loading indicator with contextual information about the ongoing AI operation.

## Features

- **Themed Overlays**: Supports different themes (legal, research, document, analysis) to match the context of the operation
- **Customizable Messages**: Displays dynamic titles and messages based on the current operation
- **Model Information**: Shows which AI model is being used for processing
- **Responsive Design**: Works across all screen sizes and device types
- **Smooth Animations**: Uses Framer Motion for smooth transitions
- **Animated Progress Feedback**: Displays an indeterminate animated progress bar and spinner when progress is unknown, ensuring users always see visual feedback while waiting for the AI.

## Progress Animation

- When a numeric `progress` value is provided, a standard progress bar is shown.
- When `progress` is undefined (i.e., the model is processing and no percentage is available), an animated indeterminate progress bar appears, smoothly sliding across the bar.
- Additionally, a spinner animation is displayed below the progress bar for extra feedback, ensuring users always see a lively animation while waiting for the model response.

Both animations use Tailwind CSS v4, shadcn/ui, and Framer Motion for a modern, smooth experience.

### Example

```tsx
<AIProcessingOverlay isProcessing={true} message="AI is working..." />
```

This will display the animated overlay with indeterminate progress and spinner while waiting for a response.

## Implementation

The AIProcessingOverlay component has been integrated into the following pages:

### Document Generation Page
```tsx
<AIProcessingOverlay
  isProcessing={templateLoading || generateDocumentMutation.isPending}
  theme="document"
  title={generateDocumentMutation.isPending ? 'Generating Document' : 'Loading Template'}
  message={generateDocumentMutation.isPending ? 'Our AI is generating your document based on the provided variables...' : 'Loading template details...'}
  modelName="gpt-4.1-nano"
/>
```

### Documents Page
```tsx
<AIProcessingOverlay
  isProcessing={isLoading || generateDocumentMutation.isPending}
  theme="document"
  title={generateDocumentMutation.isPending ? 'Generating Document' : 'Loading Templates'}
  message={generateDocumentMutation.isPending ? 'Our AI is generating your document based on the provided information...' : 'Loading document templates...'}
  modelName="gpt-4.1-nano"
/>
```

### AI Clause Generator Component
```tsx
<AIProcessingOverlay
  isProcessing={generateClauseMutation.isPending}
  theme="legal"
  title="Generating Legal Clause"
  message="Our AI is generating a custom legal clause based on your specifications..."
  modelName="gpt-4.1-nano"
/>
```

### Legal Research Page
```tsx
<AIProcessingOverlay
  isProcessing={analyzeLegalIssueMutation.isPending}
  theme="research"
  title="Legal Research in Progress"
  message="Our AI is analyzing your legal issue and researching relevant cases and statutes..."
  modelName="gpt-4.1-nano"
/>
```

### Document Automation Page
```tsx
<AIProcessingOverlay
  isProcessing={isLoadingClauses || createClauseMutation.isPending}
  theme="document"
  title={createClauseMutation.isPending ? 'Processing Document' : 'Loading Clauses'}
  message={createClauseMutation.isPending ? 'Our AI is processing your document request...' : 'Loading clause library...'}
  modelName="gpt-4.1-nano"
/>
```

### Document Templates Page
```tsx
<AIProcessingOverlay
  isProcessing={templatesLoading || categoriesLoading || createTemplateMutation.isPending || deleteTemplateMutation.isPending}
  theme="document"
  title={createTemplateMutation.isPending ? 'Creating Template' : deleteTemplateMutation.isPending ? 'Deleting Template' : 'Loading Templates'}
  message={createTemplateMutation.isPending ? 'Creating your new document template...' : deleteTemplateMutation.isPending ? 'Removing the selected template...' : 'Loading document templates...'}
  modelName="gpt-4.1-nano"
/>
```

### Contract Analysis Page
```tsx
<AIProcessingOverlay
  isProcessing={analyzeMutation.isPending || compareMutation.isPending}
  theme={activeTab === 'analyze' ? 'analysis' : 'document'}
  title={activeTab === 'analyze' ? 'Analyzing Contract' : 'Comparing Contracts'}
  message={activeTab === 'analyze' ? 'Our AI is analyzing your contract for risks and opportunities...' : 'Our AI is comparing the contracts to identify differences...'}
  modelName="gpt-4.1-nano"
/>
```

### Predictive Outcome Analysis Component
```tsx
<AIProcessingOverlay
  isProcessing={isAnalyzing}
  theme="legal"
  title="Analyzing Case Outcome"
  message="Our AI is analyzing the case details to predict potential outcomes..."
  modelName="gpt-4.1-nano"
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isProcessing` | boolean | Controls whether the overlay is visible |
| `theme` | string | Visual theme of the overlay (legal, research, document, analysis) |
| `title` | string | Main heading displayed during processing |
| `message` | string | Descriptive text explaining the current operation |
| `modelName` | string | Name of the AI model being used |

## Usage

```tsx
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay';

// Inside your component
return (
  <div className="container relative">
    <AIProcessingOverlay
      isProcessing={isLoading}
      theme="document"
      title="Processing Your Request"
      message="Our AI is working on your request..."
      modelName="gpt-4.1-nano"
    />
    
    {/* Your component content */}
  </div>
);
```

## Best Practices

1. Always place the overlay inside a container with `position: relative`
2. Use dynamic messages that explain exactly what the AI is doing
3. Match the theme to the context of the operation
4. Use the same model name across the application for consistency
5. Ensure all async operations are properly tracked with loading states
