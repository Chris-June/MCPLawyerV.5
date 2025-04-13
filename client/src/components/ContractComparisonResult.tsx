import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X, ArrowLeftRight } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContractComparisonResult as ContractComparisonResultType, RiskLevel, ClauseCategory } from '@/types'

interface ContractComparisonResultProps {
  result: ContractComparisonResultType
  onReset: () => void
}

export function ContractComparisonResult({ result, onReset }: ContractComparisonResultProps) {
  const getRiskBadge = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case RiskLevel.NO_RISK:
        return <Badge className="bg-green-500 hover:bg-green-600">No Risk</Badge>
      case RiskLevel.LOW_RISK:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Low Risk</Badge>
      case RiskLevel.MEDIUM_RISK:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Medium Risk</Badge>
      case RiskLevel.HIGH_RISK:
        return <Badge className="bg-orange-500 hover:bg-orange-600">High Risk</Badge>
      case RiskLevel.CRITICAL_RISK:
        return <Badge className="bg-red-500 hover:bg-red-600">Critical Risk</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getRiskIcon = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case RiskLevel.NO_RISK:
      case RiskLevel.LOW_RISK:
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case RiskLevel.MEDIUM_RISK:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case RiskLevel.HIGH_RISK:
      case RiskLevel.CRITICAL_RISK:
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const formatCategoryName = (category: ClauseCategory) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Extract high-risk differences for attention
  const highRiskDifferences = result.differences.filter(
    diff => diff.significance === RiskLevel.HIGH_RISK || diff.significance === RiskLevel.CRITICAL_RISK
  )

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Contract Comparison Result</CardTitle>
              <CardDescription>
                {result.contract_a_name} vs. {result.contract_b_name}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={onReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recommendation */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-5 w-5 text-blue-500" />
            <AlertTitle>Analysis Summary</AlertTitle>
            <AlertDescription>{result.recommendation}</AlertDescription>
          </Alert>

          <Separator />

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Common Clauses</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{result.common_clauses.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Unique to {result.contract_a_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{result.unique_to_a.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Unique to {result.contract_b_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{result.unique_to_b.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* High Risk Alert */}
          {highRiskDifferences.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>High Risk Differences Detected</AlertTitle>
              <AlertDescription>
                {highRiskDifferences.length} clause{highRiskDifferences.length !== 1 ? 's' : ''} with significant differences that require attention. 
                Pay special attention to: {highRiskDifferences.map(d => formatCategoryName(d.category)).join(', ')}.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Different Contract Structure */}
          <div className="space-y-4">
            <h3 className="font-medium">Contract Structure Comparison</h3>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Common Clauses</h4>
              {result.common_clauses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.common_clauses.map((category, i) => (
                    <Badge key={i} variant="outline">{formatCategoryName(category)}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No common clauses found.</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Unique to {result.contract_a_name}</h4>
                {result.unique_to_a.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.unique_to_a.map((category, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50">{formatCategoryName(category)}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No unique clauses found.</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Unique to {result.contract_b_name}</h4>
                {result.unique_to_b.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.unique_to_b.map((category, i) => (
                      <Badge key={i} variant="outline" className="bg-purple-50">{formatCategoryName(category)}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No unique clauses found.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause Differences */}
      <Card>
        <CardHeader>
          <CardTitle>Clause Differences</CardTitle>
          <CardDescription>
            Detailed comparison of differing clauses between contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.differences.length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {result.differences.map((diff, index) => (
                <AccordionItem 
                  key={index} 
                  value={`diff-${index}`}
                  className={`border rounded-md ${diff.significance === RiskLevel.HIGH_RISK || diff.significance === RiskLevel.CRITICAL_RISK 
                    ? 'border-red-200' 
                    : diff.significance === RiskLevel.MEDIUM_RISK 
                      ? 'border-yellow-200' 
                      : 'border-gray-200'}`}
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{formatCategoryName(diff.category)}</Badge>
                        <span className="font-medium">{diff.title}</span>
                      </div>
                      {getRiskBadge(diff.significance)}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                    <Tabs defaultValue="side-by-side" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                        <TabsTrigger value="explanation">Explanation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="side-by-side" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">{result.contract_a_name}</Badge>
                            </h4>
                            <div className="p-3 bg-blue-50 rounded-md border border-blue-200 font-mono text-sm whitespace-pre-wrap">
                              {diff.contract_a_text}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Badge variant="outline" className="bg-purple-50">{result.contract_b_name}</Badge>
                            </h4>
                            <div className="p-3 bg-purple-50 rounded-md border border-purple-200 font-mono text-sm whitespace-pre-wrap">
                              {diff.contract_b_text}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="explanation" className="space-y-4 mt-4">
                        <Alert className="bg-gray-50">
                          {getRiskIcon(diff.significance)}
                          <AlertTitle>Legal Significance</AlertTitle>
                          <AlertDescription>{diff.explanation}</AlertDescription>
                        </Alert>
                      </TabsContent>
                    </Tabs>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No Differences Found</h3>
              <p className="text-muted-foreground">The compared clauses are identical or very similar.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onReset}>
            Compare Different Contracts
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
