import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, File, Info, X, AlertTriangle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { ContractAnalysisResult as ContractAnalysisResultType, RiskLevel } from '@/types'

interface ContractAnalysisResultProps {
  result: ContractAnalysisResultType
  onReset: () => void
}

export function ContractAnalysisResult({ result, onReset }: ContractAnalysisResultProps) {
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

  const getBorderColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case RiskLevel.NO_RISK:
      case RiskLevel.LOW_RISK:
        return 'border-green-200'
      case RiskLevel.MEDIUM_RISK:
        return 'border-yellow-200'
      case RiskLevel.HIGH_RISK:
      case RiskLevel.CRITICAL_RISK:
        return 'border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{result.summary.title || 'Contract Analysis'}</CardTitle>
              <CardDescription>
                {result.summary.contract_type} - {result.summary.parties.join(', ')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getRiskBadge(result.overall_risk_level)}
              <Button variant="outline" size="icon" onClick={onReset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Overall Contract Score</h3>
              <span className="font-bold text-lg">{result.overall_score}/100</span>
            </div>
            <Progress value={result.overall_score} className="h-2" />
          </div>

          <Separator />

          {/* Risk Explanation and Recommendations */}
          <div className="space-y-4">
            <Alert
              variant="outline"
              className={`bg-opacity-20 ${result.overall_risk_level === RiskLevel.NO_RISK || result.overall_risk_level === RiskLevel.LOW_RISK
                ? 'bg-green-50 border-green-200'
                : result.overall_risk_level === RiskLevel.MEDIUM_RISK
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'}`}
            >
              {getRiskIcon(result.overall_risk_level)}
              <AlertTitle>Risk Assessment</AlertTitle>
              <AlertDescription>{result.overall_risk_explanation}</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-medium">Key Recommendations</h3>
              <ul className="space-y-1 list-disc pl-5">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          <Separator />

          {/* Contract Summary */}
          <div className="space-y-4">
            <h3 className="font-medium">Contract Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Type</p>
                <p className="font-medium">{result.summary.contract_type}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Parties</p>
                <p className="font-medium">{result.summary.parties.join(', ')}</p>
              </div>
              
              {result.summary.effective_date && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Effective Date</p>
                  <p className="font-medium">{new Date(result.summary.effective_date).toLocaleDateString()}</p>
                </div>
              )}
              
              {result.summary.termination_date && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Termination Date</p>
                  <p className="font-medium">{new Date(result.summary.termination_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Key Points</p>
              <ul className="space-y-1 list-disc pl-5">
                {result.summary.key_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            
            {result.summary.missing_clauses.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Missing Clauses</p>
                <ul className="space-y-1 list-disc pl-5">
                  {result.summary.missing_clauses.map((clause, i) => (
                    <li key={i} className="text-red-600">{clause}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clause Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Clauses</CardTitle>
          <CardDescription>Analysis of individual contract clauses</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {result.clauses.map((clause, index) => (
              <AccordionItem 
                key={index} 
                value={`clause-${index}`}
                className={`border rounded-md ${getBorderColor(clause.clause.risk_level)}`}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{clause.clause.category}</Badge>
                      <span className="font-medium">{clause.clause.title}</span>
                    </div>
                    {getRiskBadge(clause.clause.risk_level)}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-md border font-mono text-sm whitespace-pre-wrap">
                    {clause.clause.text}
                  </div>
                  
                  {clause.clause.risk_explanation && (
                    <Alert variant="outline" className="bg-gray-50">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Risk Explanation</AlertTitle>
                      <AlertDescription>{clause.clause.risk_explanation}</AlertDescription>
                    </Alert>
                  )}
                  
                  {clause.alternative_wording && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Suggested Alternative Wording</h4>
                      <div className="p-3 bg-green-50 rounded-md border border-green-200 text-sm">
                        {clause.alternative_wording}
                      </div>
                    </div>
                  )}
                  
                  {clause.legal_concerns && clause.legal_concerns.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Legal Concerns</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {clause.legal_concerns.map((concern, i) => (
                          <li key={i}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {clause.provincial_differences && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Provincial Considerations</h4>
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
                        {Object.entries(clause.provincial_differences).map(([province, diff], i) => (
                          <div key={i} className="mb-2">
                            <span className="font-medium">{province === 'general' ? 'General' : province}:</span> {diff}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onReset}>
            Analyze Another Contract
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
