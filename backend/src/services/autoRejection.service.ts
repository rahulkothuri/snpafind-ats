import prisma from '../lib/prisma.js';
import type {
  AutoRejectionRules,
  AutoRejectionRule,
  RuleField,
  RuleOperator,
  LegacyAutoRejectionRules
} from '../types/index.js';

// Transaction client type
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

/**
 * Result of auto-rejection evaluation
 */
export interface AutoRejectionResult {
  shouldReject: boolean;
  reason?: string;
  triggeredRule?: AutoRejectionRule;
}

/**
 * Candidate data for rule evaluation
 */
export interface CandidateData {
  experience?: number;
  location?: string;
  skills?: string[];
  education?: string;
  salaryExpectation?: number;
}

/**
 * Field labels for human-readable rejection reasons
 */
const FIELD_LABELS: Record<RuleField, string> = {
  experience: 'Experience',
  location: 'Location',
  skills: 'Skills',
  education: 'Education',
  salary_expectation: 'Salary Expectation',
};

/**
 * Operator labels for human-readable rejection reasons
 */
const OPERATOR_LABELS: Record<RuleOperator, string> = {
  less_than: 'less than',
  greater_than: 'greater than',
  equals: 'equal to',
  not_equals: 'not equal to',
  between: 'between',
  contains: 'containing',
  not_contains: 'not containing',
  contains_all: 'containing all of',
  contains_any: 'containing any of',
};

/**
 * Check if rules are in legacy format
 */
function isLegacyRules(rules: unknown): rules is LegacyAutoRejectionRules {
  if (!rules || typeof rules !== 'object') return false;
  const r = rules as Record<string, unknown>;
  if (!r.rules || typeof r.rules !== 'object') return false;
  const innerRules = r.rules as Record<string, unknown>;
  // Legacy format has minExperience/maxExperience directly, not an array
  return !Array.isArray(innerRules) && (
    'minExperience' in innerRules ||
    'maxExperience' in innerRules ||
    'requiredSkills' in innerRules ||
    'requiredEducation' in innerRules
  );
}

/**
 * Convert legacy rules to new format
 */
function convertLegacyRules(legacy: LegacyAutoRejectionRules): AutoRejectionRules {
  const rules: AutoRejectionRule[] = [];
  let ruleId = 1;

  if (legacy.rules.minExperience !== undefined) {
    rules.push({
      id: `legacy-${ruleId++}`,
      field: 'experience',
      operator: 'less_than',
      value: legacy.rules.minExperience,
      logicConnector: 'OR',
    });
  }

  if (legacy.rules.maxExperience !== undefined) {
    rules.push({
      id: `legacy-${ruleId++}`,
      field: 'experience',
      operator: 'greater_than',
      value: legacy.rules.maxExperience,
      logicConnector: 'OR',
    });
  }

  return {
    enabled: legacy.enabled,
    rules,
  };
}

/**
 * Evaluate a numeric operator
 */
function evaluateNumericOperator(
  candidateValue: number | undefined,
  operator: RuleOperator,
  ruleValue: number | [number, number]
): boolean {
  if (candidateValue === undefined || candidateValue === null) return false;

  switch (operator) {
    case 'less_than':
      return candidateValue < (ruleValue as number);
    case 'greater_than':
      return candidateValue > (ruleValue as number);
    case 'equals':
      return candidateValue === (ruleValue as number);
    case 'not_equals':
      return candidateValue !== (ruleValue as number);
    case 'between':
      const [min, max] = ruleValue as [number, number];
      return candidateValue >= min && candidateValue <= max;
    default:
      return false;
  }
}

/**
 * Evaluate a text operator
 */
function evaluateTextOperator(
  candidateValue: string | undefined,
  operator: RuleOperator,
  ruleValue: string
): boolean {
  if (candidateValue === undefined || candidateValue === null) return false;

  const normalizedCandidate = candidateValue.toLowerCase().trim();
  const normalizedRule = ruleValue.toLowerCase().trim();

  switch (operator) {
    case 'equals':
      return normalizedCandidate === normalizedRule;
    case 'not_equals':
      return normalizedCandidate !== normalizedRule;
    case 'contains':
      return normalizedCandidate.includes(normalizedRule);
    case 'not_contains':
      return !normalizedCandidate.includes(normalizedRule);
    default:
      return false;
  }
}


/**
 * Evaluate an array operator
 */
function evaluateArrayOperator(
  candidateValue: string[] | undefined,
  operator: RuleOperator,
  ruleValue: string | string[]
): boolean {
  if (!candidateValue || !Array.isArray(candidateValue)) return false;

  const normalizedCandidate = candidateValue.map(v => v.toLowerCase().trim());
  const ruleValues = Array.isArray(ruleValue)
    ? ruleValue.map(v => v.toLowerCase().trim())
    : [ruleValue.toLowerCase().trim()];

  switch (operator) {
    case 'contains':
      // Candidate has at least one of the rule values
      return ruleValues.some(rv => normalizedCandidate.includes(rv));
    case 'not_contains':
      // Candidate has none of the rule values
      return !ruleValues.some(rv => normalizedCandidate.includes(rv));
    case 'contains_all':
      // Candidate has all of the rule values
      return ruleValues.every(rv => normalizedCandidate.includes(rv));
    case 'contains_any':
      // Candidate has at least one of the rule values (same as contains)
      return ruleValues.some(rv => normalizedCandidate.includes(rv));
    default:
      return false;
  }
}

/**
 * Get candidate field value for evaluation
 */
function getCandidateFieldValue(
  candidate: CandidateData,
  field: RuleField
): number | string | string[] | undefined {
  switch (field) {
    case 'experience':
      return candidate.experience;
    case 'location':
      return candidate.location;
    case 'skills':
      return candidate.skills;
    case 'education':
      return candidate.education;
    case 'salary_expectation':
      return candidate.salaryExpectation;
    default:
      return undefined;
  }
}

/**
 * Evaluate a single rule against candidate data
 */
function evaluateSingleRule(
  candidate: CandidateData,
  rule: AutoRejectionRule
): boolean {
  const candidateValue = getCandidateFieldValue(candidate, rule.field);

  // Determine field type and evaluate accordingly
  switch (rule.field) {
    case 'experience':
    case 'salary_expectation':
      return evaluateNumericOperator(
        candidateValue as number | undefined,
        rule.operator,
        rule.value as number | [number, number]
      );
    case 'location':
    case 'education':
      return evaluateTextOperator(
        candidateValue as string | undefined,
        rule.operator,
        rule.value as string
      );
    case 'skills':
      return evaluateArrayOperator(
        candidateValue as string[] | undefined,
        rule.operator,
        rule.value as string | string[]
      );
    default:
      return false;
  }
}

/**
 * Generate human-readable rejection reason
 */
function generateRejectionReason(
  candidate: CandidateData,
  rule: AutoRejectionRule
): string {
  const fieldLabel = FIELD_LABELS[rule.field];
  const operatorLabel = OPERATOR_LABELS[rule.operator];
  const candidateValue = getCandidateFieldValue(candidate, rule.field);

  let valueStr: string;
  if (Array.isArray(rule.value)) {
    if (rule.operator === 'between') {
      valueStr = `${rule.value[0]} and ${rule.value[1]}`;
    } else {
      valueStr = rule.value.join(', ');
    }
  } else {
    valueStr = String(rule.value);
  }

  let candidateValueStr: string;
  if (Array.isArray(candidateValue)) {
    candidateValueStr = candidateValue.join(', ') || 'none';
  } else {
    candidateValueStr = candidateValue !== undefined ? String(candidateValue) : 'not specified';
  }

  // Add units for specific fields
  let unit = '';
  if (rule.field === 'experience') {
    unit = ' years';
  }

  return `Auto-rejected: ${fieldLabel} (${candidateValueStr}${unit}) is ${operatorLabel} required (${valueStr}${unit})`;
}

/**
 * Evaluate if a candidate should be auto-rejected based on job rules
 * Requirements: 4.6, 9.2, 9.3, 9.4, 9.5
 * 
 * @param candidate - Candidate data for evaluation
 * @param rules - Auto-rejection rules from the job
 * @returns AutoRejectionResult indicating if candidate should be rejected and why
 */
export function evaluateAutoRejection(
  candidate: CandidateData,
  rules: AutoRejectionRules | LegacyAutoRejectionRules | null | undefined
): AutoRejectionResult {
  // If no rules or rules not enabled, don't reject (Requirements 4.10)
  if (!rules || !rules.enabled) {
    return { shouldReject: false };
  }

  // Convert legacy rules if needed
  let normalizedRules: AutoRejectionRules;
  if (isLegacyRules(rules)) {
    normalizedRules = convertLegacyRules(rules);
  } else {
    normalizedRules = rules as AutoRejectionRules;
  }

  // If no rules configured, don't reject
  if (!normalizedRules.rules || normalizedRules.rules.length === 0) {
    return { shouldReject: false };
  }

  // Evaluate rules with AND/OR logic
  let shouldReject = false;
  let triggeredRule: AutoRejectionRule | undefined;
  let currentResult = false;
  let pendingLogic: 'AND' | 'OR' | undefined;

  for (let i = 0; i < normalizedRules.rules.length; i++) {
    const rule = normalizedRules.rules[i];
    const ruleMatches = evaluateSingleRule(candidate, rule);

    if (i === 0) {
      // First rule
      currentResult = ruleMatches;
      if (ruleMatches) {
        triggeredRule = rule;
      }
    } else {
      // Apply logic from previous rule
      if (pendingLogic === 'AND') {
        currentResult = currentResult && ruleMatches;
        if (currentResult && ruleMatches && !triggeredRule) {
          triggeredRule = rule;
        }
      } else {
        // OR logic (default)
        if (ruleMatches && !triggeredRule) {
          triggeredRule = rule;
        }
        currentResult = currentResult || ruleMatches;
      }
    }

    // Store logic connector for next iteration
    pendingLogic = rule.logicConnector || 'OR';
  }

  shouldReject = currentResult;

  if (shouldReject && triggeredRule) {
    return {
      shouldReject: true,
      reason: generateRejectionReason(candidate, triggeredRule),
      triggeredRule,
    };
  }

  return { shouldReject: false };
}


/**
 * Process auto-rejection for a candidate application
 * Requirements: 4.6, 4.7, 4.9, 9.2, 9.3, 9.5, 9.6
 * 
 * @param jobCandidateId - The job candidate record ID
 * @param candidateId - The candidate ID
 * @param candidateData - Candidate data for rule evaluation
 * @param jobId - The job ID
 * @param tx - Optional transaction client
 * @returns True if candidate was auto-rejected, false otherwise
 */
export async function processAutoRejection(
  jobCandidateId: string,
  candidateId: string,
  candidateData: CandidateData,
  jobId: string,
  tx?: TransactionClient
): Promise<boolean> {
  const client = tx || prisma;

  // Get job with auto-rejection rules
  const job = await client.job.findUnique({
    where: { id: jobId },
    select: {
      autoRejectionRules: true,
      pipelineStages: {
        where: {
          name: 'Rejected',
          parentId: null,
        },
        take: 1,
      },
    },
  });

  if (!job) {
    return false;
  }

  const rules = job.autoRejectionRules as AutoRejectionRules | LegacyAutoRejectionRules | null;
  const evaluation = evaluateAutoRejection(candidateData, rules);

  if (!evaluation.shouldReject) {
    return false;
  }

  // Find the Rejected stage
  const rejectedStage = job.pipelineStages[0];
  if (!rejectedStage) {
    console.warn(`No Rejected stage found for job ${jobId}, skipping auto-rejection`);
    return false;
  }

  // Move candidate to Rejected stage (Requirements 9.5)
  await client.jobCandidate.update({
    where: { id: jobCandidateId },
    data: { currentStageId: rejectedStage.id },
  });

  // Create activity log entry (Requirements 4.7, 4.9, 9.6)
  await client.candidateActivity.create({
    data: {
      candidateId,
      jobCandidateId,
      activityType: 'stage_change',
      description: evaluation.reason || 'Auto-rejected: Does not meet minimum requirements',
      metadata: {
        fromStageName: 'Applied',
        toStageName: 'Rejected',
        toStageId: rejectedStage.id,
        autoRejected: true,
        rejectionReason: evaluation.reason,
        triggeredRule: evaluation.triggeredRule ? {
          id: evaluation.triggeredRule.id,
          field: evaluation.triggeredRule.field,
          operator: evaluation.triggeredRule.operator,
          value: evaluation.triggeredRule.value,
          logicConnector: evaluation.triggeredRule.logicConnector,
        } : undefined,
      },
    },
  });

  return true;
}

/**
 * Legacy function for backward compatibility
 * Converts experience-only call to new format
 */
export async function processAutoRejectionLegacy(
  jobCandidateId: string,
  candidateId: string,
  candidateExperience: number,
  jobId: string,
  tx?: TransactionClient
): Promise<boolean> {
  return processAutoRejection(
    jobCandidateId,
    candidateId,
    { experience: candidateExperience },
    jobId,
    tx
  );
}

export const autoRejectionService = {
  evaluateAutoRejection,
  processAutoRejection,
  processAutoRejectionLegacy,
};

export default autoRejectionService;
