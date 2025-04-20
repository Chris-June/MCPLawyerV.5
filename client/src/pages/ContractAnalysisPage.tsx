import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {FileText, GitCompare, Info } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMutation } from '@tanstack/react-query'
import { analyzeContract, compareContracts } from '@/lib/api'
import {
  ContractAnalysisRequest,
  ContractAnalysisResult,
  ContractComparisonRequest,
  ContractComparisonResult,
  RiskLevel
} from '@/types'
// Import components directly, not using alias imports to avoid confusion
import { ContractAnalysisResult as ContractAnalysisResultComponent } from '../components/ContractAnalysisResult'
import { ContractComparisonResult as ContractComparisonResultComponent } from '../components/ContractComparisonResult'

const jurisdictions = [
  { value: 'canada', label: 'Canada (Federal)' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'new_brunswick', label: 'New Brunswick' },
  { value: 'newfoundland', label: 'Newfoundland and Labrador' },
  { value: 'northwest_territories', label: 'Northwest Territories' },
  { value: 'nova_scotia', label: 'Nova Scotia' },
  { value: 'nunavut', label: 'Nunavut' },
  { value: 'ontario', label: 'Ontario' },
  { value: 'pei', label: 'Prince Edward Island' },
  { value: 'quebec', label: 'Quebec' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'yukon', label: 'Yukon' },
]

const contractTypes = [
  { value: 'agency', label: 'Agency Agreement' },
  { value: 'asset_purchase', label: 'Asset Purchase Agreement' },
  { value: 'bill_of_sale', label: 'Bill of Sale' },
  { value: 'brokerage', label: 'Brokerage Agreement' },
  { value: 'consulting', label: 'Consulting Agreement' },
  { value: 'construction', label: 'Construction Agreement' },
  { value: 'distribution', label: 'Distribution Agreement' },
  { value: 'employment', label: 'Employment Contract' },
  { value: 'franchise', label: 'Franchise Agreement' },
  { value: 'joint_venture', label: 'Joint Venture Agreement' },
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'licensing', label: 'Licensing Agreement' },
  { value: 'loan', label: 'Loan Agreement' },
  { value: 'maintenance', label: 'Maintenance Agreement' },
  { value: 'manufacturing', label: 'Manufacturing Agreement' },
  { value: 'moa', label: 'Memorandum of Agreement' },
  { value: 'mou', label: 'Memorandum of Understanding' },
  { value: 'non_compete', label: 'Non-Compete Agreement' },
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'operating', label: 'Operating Agreement' },
  { value: 'other', label: 'Other Contract Type' },
  { value: 'partnership', label: 'Partnership Agreement' },
  { value: 'purchase', label: 'Purchase Agreement' },
  { value: 'research_collaboration', label: 'Research Collaboration Agreement' },
  { value: 'sales', label: 'Sales Agreement' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'settlement', label: 'Settlement Agreement' },
  { value: 'software_license', label: 'Software License Agreement' },
  { value: 'supply', label: 'Supply Agreement' },
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'warranty', label: 'Warranty Agreement' },
];

export default function ContractAnalysisPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('analyze')
  
  // Single contract analysis state
  const [contractText, setContractText] = useState('')
  const [contractName, setContractName] = useState('')
  const [contractType, setContractType] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null)
  
  // Contract comparison state
  const [contractAText, setContractAText] = useState('')
  const [contractAName, setContractAName] = useState('Contract A')
  const [contractBText, setContractBText] = useState('')
  const [contractBName, setContractBName] = useState('Contract B')
  const [comparisonResult, setComparisonResult] = useState<ContractComparisonResult | null>(null)

  // Analyze contract mutation
  const analyzeMutation = useMutation({
    mutationFn: (request: ContractAnalysisRequest) => analyzeContract(request),
    onSuccess: (data) => {
      setAnalysisResult(data)
      toast({
        title: 'Contract Analysis Complete',
        description: 'The contract has been analyzed successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: `There was an error analyzing the contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    },
  })

  // Compare contracts mutation
  const compareMutation = useMutation({
    mutationFn: (request: ContractComparisonRequest) => compareContracts(request),
    onSuccess: (data) => {
      setComparisonResult(data)
      toast({
        title: 'Contract Comparison Complete',
        description: 'The contracts have been compared successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Comparison Failed',
        description: `There was an error comparing the contracts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    },
  })

  const handleAnalyzeContract = () => {
    if (!contractText.trim()) {
      toast({
        title: 'Missing Contract',
        description: 'Please enter the contract text to analyze.',
        variant: 'destructive',
      })
      return
    }

    analyzeMutation.mutate({
      contract_text: contractText,
      contract_name: contractName || undefined,
      contract_type: contractType || undefined,
      jurisdiction: jurisdiction || undefined,
    })
  }

  const handleCompareContracts = () => {
    if (!contractAText.trim() || !contractBText.trim()) {
      toast({
        title: 'Missing Contracts',
        description: 'Please enter both contracts to compare.',
        variant: 'destructive',
      })
      return
    }

    compareMutation.mutate({
      contract_a_text: contractAText,
      contract_b_text: contractBText,
      contract_a_name: contractAName || 'Contract A',
      contract_b_name: contractBName || 'Contract B',
    })
  }

  const resetAnalysis = () => {
    setContractText('')
    setContractName('')
    setContractType('')
    setJurisdiction('')
    setAnalysisResult(null)
  }

  const resetComparison = () => {
    setContractAText('')
    setContractAName('Contract A')
    setContractBText('')
    setContractBName('Contract B')
    setComparisonResult(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-6 relative">
      <AIProcessingOverlay
        isProcessing={analyzeMutation.isPending || compareMutation.isPending}
        theme={activeTab === 'analyze' ? 'analysis' : 'document'}
        title={activeTab === 'analyze' ? 'Analyzing Contract' : 'Comparing Contracts'}
        message={activeTab === 'analyze' ? 'Our AI is analyzing your contract for risks and opportunities...' : 'Our AI is comparing the contracts to identify differences...'}
        modelName="gpt-4.1-nano"
      />
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contract Analysis</h1>
        <p className="text-muted-foreground">
          Analyze contracts for risks and compare different versions to identify important differences.
        </p>
      </div>

      <Separator className="my-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analyze Contract
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Compare Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          {/* Contract Analysis Form */}
          {!analysisResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Contract Analysis</CardTitle>
                <CardDescription>
                  Submit a contract to analyze for risks, extract clauses, and receive recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contract-name" className="text-foreground">Contract Name (Optional)</Label>
                  <Input
                    id="contract-name"
                    placeholder="Enter a descriptive name for this contract"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    className="text-foreground bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract-type" className="text-foreground">Contract Type (Optional)</Label>
                    <Select value={contractType} onValueChange={setContractType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction" className="text-foreground">Jurisdiction (Optional)</Label>
                    <Select value={jurisdiction} onValueChange={setJurisdiction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions.map((j) => (
                          <SelectItem key={j.value} value={j.value}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract-text" className="text-foreground">Contract Text</Label>
                  <Textarea
                    id="contract-text"
                    placeholder="Paste your contract text here"
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm text-foreground bg-background"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetAnalysis}>
                  Clear
                </Button>
                <Button 
                  onClick={handleAnalyzeContract} 
                  disabled={analyzeMutation.isPending || !contractText.trim()}
                >
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Contract'}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <ContractAnalysisResultComponent 
              result={analysisResult} 
              onReset={resetAnalysis} 
            />
          )}
          
          {analyzeMutation.isPending && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          {/* Contract Comparison Form */}
          {!comparisonResult ? (
            <Card>
              <CardHeader>
                <CardTitle>Contract Comparison</CardTitle>
                <CardDescription>
                  Compare two versions of a contract to identify differences and changes in legal terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contract A */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">A</Badge>
                      <h3 className="font-semibold">First Contract</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contract-a-name" className="text-foreground">Contract Name</Label>
                      <Input
                        id="contract-a-name"
                        placeholder="Contract A"
                        value={contractAName}
                        onChange={(e) => setContractAName(e.target.value)}
                        className="text-foreground bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contract-a-text" className="text-foreground">Contract Text</Label>
                      <Textarea
                        id="contract-a-text"
                        placeholder="Paste the first contract text here"
                        value={contractAText}
                        onChange={(e) => setContractAText(e.target.value)}
                        className="min-h-[250px] font-mono text-sm text-foreground bg-background"
                      />
                    </div>
                  </div>
                  
                  {/* Contract B */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">B</Badge>
                      <h3 className="font-semibold">Second Contract</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contract-b-name" className="text-foreground">Contract Name</Label>
                      <Input
                        id="contract-b-name"
                        placeholder="Contract B"
                        value={contractBName}
                        onChange={(e) => setContractBName(e.target.value)}
                        className="text-foreground bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contract-b-text" className="text-foreground">Contract Text</Label>
                      <Textarea
                        id="contract-b-text"
                        placeholder="Paste the second contract text here"
                        value={contractBText}
                        onChange={(e) => setContractBText(e.target.value)}
                        className="min-h-[250px] font-mono text-sm text-foreground bg-background"
                      />
                    </div>
                  </div>
                </div>

                <Alert variant="outline" className="bg-background border-primary text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-foreground">Comparison Tips</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    For best results, compare similar contracts or different versions of the same contract.
                    The comparison will identify added, removed, and modified clauses.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetComparison}>
                  Clear
                </Button>
                <Button 
                  onClick={handleCompareContracts} 
                  disabled={compareMutation.isPending || !contractAText.trim() || !contractBText.trim()}
                >
                  {compareMutation.isPending ? 'Comparing...' : 'Compare Contracts'}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <ContractComparisonResultComponent 
              result={comparisonResult} 
              onReset={resetComparison} 
            />
          )}
          
          {compareMutation.isPending && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
