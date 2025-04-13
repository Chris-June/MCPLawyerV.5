from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime

class FieldType(str, Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    EMAIL = "email"
    PHONE = "phone"
    DATE = "date"
    NUMBER = "number"
    SELECT = "select"
    MULTISELECT = "multiselect"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    FILE = "file"

class ValidationRule(BaseModel):
    type: str = Field(..., description="Type of validation rule (e.g., 'required', 'min', 'max', 'regex').")
    value: Optional[Any] = Field(None, description="Value for the validation rule if applicable.")
    message: str = Field(..., description="Error message to display when validation fails.")

class ConditionalLogic(BaseModel):
    field: str = Field(..., description="Field that triggers this condition.")
    operator: str = Field(..., description="Comparison operator (e.g., 'equals', 'notEquals', 'contains').")
    value: Any = Field(..., description="Value to compare against.")

class FormField(BaseModel):
    id: str = Field(..., description="Unique identifier for the field.")
    type: FieldType = Field(..., description="Type of field.")
    label: str = Field(..., description="Display label for the field.")
    placeholder: Optional[str] = Field(None, description="Placeholder text.")
    helpText: Optional[str] = Field(None, description="Help text to guide user input.")
    required: bool = Field(False, description="Whether the field is required.")
    options: Optional[List[Dict[str, str]]] = Field(None, description="Options for select, multiselect, checkbox, or radio fields.")
    validationRules: Optional[List[ValidationRule]] = Field(None, description="Rules for validating the field input.")
    conditionalLogic: Optional[ConditionalLogic] = Field(None, description="Logic for when to show/hide the field.")
    defaultValue: Optional[Any] = Field(None, description="Default value for the field.")
    
    @validator('options')
    def validate_options(cls, v, values):
        if values.get('type') in [FieldType.SELECT, FieldType.MULTISELECT, FieldType.CHECKBOX, FieldType.RADIO] and not v:
            raise ValueError(f"Options are required for {values.get('type')} fields")
        return v

class FormSection(BaseModel):
    id: str = Field(..., description="Unique identifier for the section.")
    title: str = Field(..., description="Title of the section.")
    description: Optional[str] = Field(None, description="Description of the section.")
    fields: List[FormField] = Field(..., description="Fields in this section.")
    conditionalLogic: Optional[ConditionalLogic] = Field(None, description="Logic for when to show/hide the section.")

class IntakeForm(BaseModel):
    id: str = Field(..., description="Unique identifier for the form.")
    practiceArea: str = Field(..., description="Practice area this form is for.")
    title: str = Field(..., description="Title of the form.")
    description: Optional[str] = Field(None, description="Description of the form.")
    sections: List[FormSection] = Field(..., description="Sections of the form.")
    version: str = Field("1.0", description="Version of the form.")
    createdAt: datetime = Field(default_factory=datetime.now, description="When the form was created.")
    updatedAt: datetime = Field(default_factory=datetime.now, description="When the form was last updated.")

class IntakeFormSubmission(BaseModel):
    formId: str = Field(..., description="ID of the form being submitted.")
    clientId: Optional[str] = Field(None, description="ID of the client if already in system.")
    data: Dict[str, Any] = Field(..., description="Form data keyed by field ID.")
    submittedAt: datetime = Field(default_factory=datetime.now, description="When the form was submitted.")
    ipAddress: Optional[str] = Field(None, description="IP address of the submitter.")
    userAgent: Optional[str] = Field(None, description="User agent of the submitter.")

class CaseAssessment(BaseModel):
    strengths: List[str] = Field(..., description="Strengths of the case.")
    weaknesses: List[str] = Field(..., description="Weaknesses of the case.")
    legalIssues: List[str] = Field(..., description="Legal issues identified.")
    recommendedActions: List[str] = Field(..., description="Recommended actions.")
    riskAssessment: str = Field(..., description="Overall risk assessment.")
    estimatedTimeframe: Optional[str] = Field(None, description="Estimated timeframe for resolution.")
    estimatedCosts: Optional[Dict[str, Any]] = Field(None, description="Estimated costs breakdown.")
    additionalNotes: Optional[str] = Field(None, description="Additional notes on the case.")

class AIInterviewQuestion(BaseModel):
    id: str = Field(..., description="Unique identifier for the question.")
    question: str = Field(..., description="The question text.")
    intent: str = Field(..., description="The intent behind asking this question.")
    followUpQuestions: Optional[List[str]] = Field(None, description="Potential follow-up questions.")
    relatedTopics: Optional[List[str]] = Field(None, description="Related topics this question might lead to.")

class AIInterviewResponse(BaseModel):
    questionId: str = Field(..., description="ID of the question being answered.")
    response: str = Field(..., description="The client's response.")
    sentimentAnalysis: Optional[Dict[str, Any]] = Field(None, description="Sentiment analysis of the response.")
    extractedEntities: Optional[Dict[str, Any]] = Field(None, description="Entities extracted from the response.")
    nextQuestions: Optional[List[AIInterviewQuestion]] = Field(None, description="Next questions based on this response.")

class AIInterviewSession(BaseModel):
    sessionId: str = Field(..., description="Unique identifier for the interview session.")
    clientId: Optional[str] = Field(None, description="ID of the client if already in system.")
    practiceArea: str = Field(..., description="Practice area for this interview.")
    caseType: Optional[str] = Field(None, description="Type of case.")
    questions: List[AIInterviewQuestion] = Field(..., description="Questions asked in this session.")
    responses: List[AIInterviewResponse] = Field(..., description="Responses received in this session.")
    summary: Optional[str] = Field(None, description="Summary of the interview.")
    startedAt: datetime = Field(default_factory=datetime.now, description="When the session started.")
    lastUpdatedAt: datetime = Field(default_factory=datetime.now, description="When the session was last updated.")
    isComplete: bool = Field(False, description="Whether the interview is complete.")
    caseAssessment: Optional[CaseAssessment] = Field(None, description="Preliminary case assessment if available.")

class InterviewProcessRequest(BaseModel):
    session_id: str = Field(..., description="ID of the interview session")
    question_id: str = Field(..., description="ID of the question being answered")
    user_response: str = Field(..., description="User's response for the question")
